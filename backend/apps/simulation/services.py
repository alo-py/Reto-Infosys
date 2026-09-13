import logging
from typing import Dict, Optional, Tuple
from django.utils import timezone
from apps.simulation.models import BloqueTurno
from apps.telemetry.models import (
    EstadoEntornoSnapshot,
    Pedido as PedidoModel,
    RegistroDecisionIA,
    LiquidacionEntrega,
)
from src.config import DURACION_TURNO, IMPACTO_AVENIDAS
from src.environment import MotorEntorno
from src.routing import cargar_matriz_base, calcular_matriz_cierre
from src.data_loader import preparar_datasets
from src.ai import ExplicadorOptiGo
from src.agents import Repartidor, calcular_liquidacion_pedido
from src.models import Pedido as PedidoDataclass

logger = logging.getLogger(__name__)

# Cache de memoria para recursos pesados de OSMnx y Kaggle
_MATRIZ_BASE: Optional[Dict] = None
_DF_KAGGLE = None
_EXPLICADOR: Optional[ExplicadorOptiGo] = None

def get_recursos_compartidos():
    global _MATRIZ_BASE, _DF_KAGGLE, _EXPLICADOR
    if _MATRIZ_BASE is None:
        _MATRIZ_BASE = cargar_matriz_base()
    if _DF_KAGGLE is None:
        _DF_KAGGLE = preparar_datasets()
    if _EXPLICADOR is None:
        _EXPLICADOR = ExplicadorOptiGo()
    return _MATRIZ_BASE, _DF_KAGGLE, _EXPLICADOR

class ShiftExecutionService:
    def __init__(self, bloque_turno: BloqueTurno):
        self.bloque = bloque_turno
        self.matriz_base, self.df_kaggle, self.explicador = get_recursos_compartidos()
        self.entorno_motor = MotorEntorno(duracion_turno=self.bloque.duracion_programada_min)
        
        self.matrices_cierre = {}
        if self.entorno_motor.incidente and self.entorno_motor.incidente.avenida_cerrada:
            av = self.entorno_motor.incidente.avenida_cerrada
            self.matrices_cierre[av] = calcular_matriz_cierre(av, self.matriz_base)

        self.repartidor = Repartidor(
            nombre=self.bloque.usuario.get_full_name() or self.bloque.usuario.email,
            tipo_agente=self.bloque.tipo_agente,
            ubicacion_inicial=self.bloque.zona_cobertura,
            explicador=self.explicador
        )
        # Restore accumulated state from BloqueTurno if continuing an ongoing shift
        self.repartidor.ganancia_neta_total = float(self.bloque.ganancia_neta_total)
        self.repartidor.ingresos_brutos = float(self.bloque.ingresos_brutos)
        self.repartidor.gasto_gasolina_total = float(self.bloque.gasto_gasolina_total)
        self.repartidor.pedidos_completados = self.bloque.pedidos_completados
        self.repartidor.batches_realizados = self.bloque.batches_realizados
        self.repartidor.pedidos_con_retraso = self.bloque.pedidos_con_retraso
        self.repartidor.penalizaciones_sla_total = float(self.bloque.penalizaciones_sla_total)
        self.repartidor.km_totales = float(self.bloque.km_totales)
        self.repartidor.km_en_vacio = float(self.bloque.km_en_vacio)
        self.repartidor.disponible_en_minuto = self.bloque.minuto_progreso

    def ejecutar_paso(self, minutos_avance: int = 1) -> dict:
        """Avanza N minutos el bloque de turno y registra telemetría y decisiones en PostgreSQL."""
        if self.bloque.estado_turno != "EN_CURSO":
            return {"status": "TURNO_NO_ACTIVO", "mensaje": f"El turno está en estado {self.bloque.estado_turno}"}

        minuto_inicio = self.bloque.minuto_progreso
        minuto_objetivo = min(minuto_inicio + minutos_avance, self.bloque.duracion_programada_min)

        decisiones_tomadas = []

        for minuto in range(minuto_inicio + 1, minuto_objetivo + 1):
            estado_actual = self.entorno_motor.obtener_estado(minuto)
            
            # Guardar Snapshot de Telemetría en PostgreSQL
            zonas_afectadas = IMPACTO_AVENIDAS.get(estado_actual.avenida_cerrada, {}).get("zonas_afectadas", []) if estado_actual.avenida_cerrada else []
            EstadoEntornoSnapshot.objects.create(
                turno=self.bloque,
                minuto=minuto,
                hora_reloj=estado_actual.hora_reloj,
                clima=estado_actual.clima,
                temperatura_c=self.entorno_motor.temp_base,
                factor_trafico=estado_actual.factor_trafico,
                factor_surge=estado_actual.factor_surge,
                avenida_cerrada=estado_actual.avenida_cerrada,
                zonas_afectadas=zonas_afectadas
            )

            # Filtrar pedidos activos en este minuto
            _mz = self.matrices_cierre.get(estado_actual.avenida_cerrada, self.matriz_base) if estado_actual.avenida_cerrada else self.matriz_base
            pedidos_activos = []
            for _, row in self.df_kaggle.iterrows():
                m_llegada = int(row["arrival_minute"])
                if m_llegada <= minuto and (minuto - m_llegada) <= 4 and minuto < int(row["deadline_minute"]):
                    d_km, t_base = _mz.get((row["restaurant_zone"], row["delivery_zone"]), (5.0, 15.0))
                    tarifa = round(((row["base_fee_mxn"] + (d_km * 4.0)) * estado_actual.factor_surge) + row["tip_mxn"], 2)
                    pedidos_activos.append(PedidoDataclass(
                        id_pedido=int(row["order_id"]),
                        minuto_aparicion=m_llegada,
                        minuto_deadline=int(row["deadline_minute"]),
                        origen=row["restaurant_zone"],
                        destino=row["delivery_zone"],
                        demanda_paquete=int(row["solomon_demand"]),
                        tiempo_preparacion_min=int(row["prep_time_min"]),
                        distancia_km=d_km,
                        tiempo_viaje_min=round(t_base * estado_actual.factor_trafico, 1),
                        tarifa_final_mxn=tarifa,
                        propina_mxn=float(row["tip_mxn"]),
                        gasolina_viaje_mxn=round(d_km * float(self.bloque.usuario.consumo_gasolina_km), 2)
                    ))

            # Ejecutar decisión del agente
            tiempo_restante = self.bloque.duracion_programada_min - minuto
            log_decision = self.repartidor.ejecutar_turno(
                pedidos_disponibles=pedidos_activos,
                entorno=estado_actual,
                tiempo_restante=tiempo_restante,
                matriz_base=self.matriz_base,
                matrices_cierre=self.matrices_cierre
            )

            if log_decision:
                decisiones_tomadas.append({"minuto": minuto, "log": log_decision})
                RegistroDecisionIA.objects.create(
                    turno=self.bloque,
                    minuto=minuto,
                    tipo_agente=self.bloque.tipo_agente,
                    tipo_accion="AGENTE_ACCION",
                    opcion_id=f"DECISION_MIN_{minuto}",
                    log_explicativo=log_decision,
                    ganancia_neta_proyectada=self.repartidor.ganancia_neta_total,
                    tiempo_estimado_min=0.0,
                    distancia_total_km=self.repartidor.km_totales
                )

        # Actualizar estado acumulado del Bloque de Turno en DB
        self.bloque.minuto_progreso = minuto_objetivo
        self.bloque.zona_cobertura = self.repartidor.ubicacion_actual
        self.bloque.ganancia_neta_total = self.repartidor.ganancia_neta_total
        self.bloque.ingresos_brutos = self.repartidor.ingresos_brutos
        self.bloque.gasto_gasolina_total = self.repartidor.gasto_gasolina_total
        self.bloque.pedidos_completados = self.repartidor.pedidos_completados
        self.bloque.batches_realizados = self.repartidor.batches_realizados
        self.bloque.pedidos_con_retraso = self.repartidor.pedidos_con_retraso
        self.bloque.penalizaciones_sla_total = self.repartidor.penalizaciones_sla_total
        self.bloque.km_totales = self.repartidor.km_totales
        self.bloque.km_en_vacio = self.repartidor.km_en_vacio

        if self.bloque.minuto_progreso >= self.bloque.duracion_programada_min:
            self.bloque.estado_turno = "FINALIZADO"
            self.bloque.estado_conexion = "DESCONECTADO"

        self.bloque.save()

        return {
            "minuto_actual": self.bloque.minuto_progreso,
            "duracion_total": self.bloque.duracion_programada_min,
            "estado_turno": self.bloque.estado_turno,
            "ubicacion_actual": self.repartidor.ubicacion_actual,
            "disponible_en_minuto": self.repartidor.disponible_en_minuto,
            "ganancia_neta": float(self.bloque.ganancia_neta_total),
            "ingresos_brutos": float(self.bloque.ingresos_brutos),
            "gasto_gasolina": float(self.bloque.gasto_gasolina_total),
            "pedidos_completados": self.bloque.pedidos_completados,
            "batches_realizados": self.bloque.batches_realizados,
            "pedidos_con_retraso": self.bloque.pedidos_con_retraso,
            "penalizaciones_sla": float(self.bloque.penalizaciones_sla_total),
            "km_totales": float(self.bloque.km_totales),
            "km_en_vacio": float(self.bloque.km_en_vacio),
            "decisiones_en_este_paso": decisiones_tomadas
        }
