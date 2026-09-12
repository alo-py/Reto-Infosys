from typing import Dict, List, Optional, Tuple
from src.config import (
    IMPACTO_AVENIDAS,
    TOLERANCIA_DEADLINE_MIN,
    PENALIZACION_RETRASO_SEVERO_MIN,
    FACTOR_PENALIZACION_TARIFA,
    DESCUENTO_BASE_BATCHING
)
from src.models import Pedido, EstadoEntorno
from src.optimization import resolver_batching_ortools
from src.ai import ExplicadorOptiGo

def calcular_liquidacion_pedido(pedido: Pedido, minuto_entrega: int) -> Tuple[float, float, str]:
    """
    Calcula la tarifa final recibida por el repartidor aplicando SLA de entrega:
    - Retraso <= TOLERANCIA_DEADLINE_MIN (5 min): A tiempo, 100% tarifa y propina.
    - Retraso > 5 min: El cliente retira la propina (comida retrasada/fría).
    - Retraso > 15 min: Pérdida de propina + deducción del 25% de tarifa base por reembolso/penalización.
    """
    retraso = minuto_entrega - pedido.minuto_deadline
    tarifa_base = pedido.tarifa_final_mxn - pedido.propina_mxn
    propina = pedido.propina_mxn
    penalizacion = 0.0
    estado_sla = "A_TIEMPO"

    if retraso > TOLERANCIA_DEADLINE_MIN:
        penalizacion += propina
        propina = 0.0
        estado_sla = f"RETRASO_MODERADO (+{retraso}m)"

        if retraso > PENALIZACION_RETRASO_SEVERO_MIN:
            multa_sla = round(tarifa_base * FACTOR_PENALIZACION_TARIFA, 2)
            penalizacion += multa_sla
            tarifa_base = max(0.0, tarifa_base - multa_sla)
            estado_sla = f"RETRASO_CRITICO (+{retraso}m)"

    ingreso_final = round(tarifa_base + propina, 2)
    return ingreso_final, penalizacion, estado_sla

class Repartidor:
    def __init__(self, nombre: str, tipo_agente: str, ubicacion_inicial: str, explicador: ExplicadorOptiGo):
        self.nombre = nombre
        self.tipo_agente = tipo_agente
        self.ubicacion_actual = ubicacion_inicial
        self.explicador = explicador
        self.disponible_en_minuto = 0
        self.pedidos_completados = 0
        self.pedidos_con_retraso = 0
        self.penalizaciones_sla_total = 0.0
        self.batches_realizados = 0
        self.pedidos_rechazados = 0
        self.ingresos_brutos = 0.0
        self.gasto_gasolina_total = 0.0
        self.ganancia_neta_total = 0.0
        self.km_totales = 0.0
        self.km_en_vacio = 0.0

    def ejecutar_turno(
        self,
        pedidos_disponibles: List[Pedido],
        entorno: EstadoEntorno,
        tiempo_restante: int,
        matriz_base: Dict,
        matrices_cierre: Dict
    ) -> Optional[str]:
        if entorno.minuto_turno < self.disponible_en_minuto or not pedidos_disponibles:
            return None

        _mz = matrices_cierre.get(entorno.avenida_cerrada, matriz_base) if entorno.avenida_cerrada else matriz_base

        # -------------------------------------------------------------
        # AGENTE 1: GREEDY (Baseline tradicional sin optimización)
        # -------------------------------------------------------------
        if self.tipo_agente == "GREEDY":
            p = pedidos_disponibles[0]
            dist_pickup, t_pickup = _mz.get((self.ubicacion_actual, p.origen), (3.0, 8.0))
            t_pickup_real = round(t_pickup * entorno.factor_trafico, 1)
            
            minuto_llegada_restaurante = entorno.minuto_turno + t_pickup_real
            tiempo_espera = max(0, (p.minuto_aparicion + p.tiempo_preparacion_min) - minuto_llegada_restaurante)
            t_total_viaje = t_pickup_real + tiempo_espera + p.tiempo_viaje_min + 3.0

            if t_total_viaje > tiempo_restante:
                return None

            minuto_entrega = entorno.minuto_turno + int(t_total_viaje)
            ingreso_real, penalizacion, estado_sla = calcular_liquidacion_pedido(p, minuto_entrega)

            c_gasolina = round((dist_pickup + p.distancia_km) * 0.90, 2)
            self.ubicacion_actual = p.destino
            self.disponible_en_minuto = minuto_entrega
            self.pedidos_completados += 1
            if penalizacion > 0:
                self.pedidos_con_retraso += 1
                self.penalizaciones_sla_total += penalizacion

            self.ingresos_brutos += ingreso_real
            self.gasto_gasolina_total += c_gasolina
            self.ganancia_neta_total += round(ingreso_real - c_gasolina, 2)
            self.km_totales += (dist_pickup + p.distancia_km)
            self.km_en_vacio += dist_pickup
            return None

        # -------------------------------------------------------------
        # AGENTE 2: OPTIGO AI (Arquitectura Agéntica Dual con OR-Tools)
        # -------------------------------------------------------------
        elif self.tipo_agente == "OPTIGO_AI":
            candidatos_internos = []
            max_ev = min(len(pedidos_disponibles), 8)

            # 1. Generar Candidatos de Batching con Google OR-Tools
            for i in range(max_ev):
                for j in range(i + 1, max_ev):
                    c1, c2 = pedidos_disponibles[i], pedidos_disponibles[j]
                    if _mz.get((c1.origen, c2.origen), (10, 20))[0] > 6.0:
                        continue

                    sol = resolver_batching_ortools(
                        self.ubicacion_actual, c1, c2, entorno.factor_trafico,
                        entorno.minuto_turno, tiempo_restante, _mz
                    )
                    if sol:
                        sec, d_batch, t_rutas = sol
                        t_batch = t_rutas + max(c1.tiempo_preparacion_min, c2.tiempo_preparacion_min) + 6.0
                        if t_batch > tiempo_restante:
                            continue

                        # Proyectar entregas con liquidación SLA
                        minuto_entrega_batch = entorno.minuto_turno + int(t_batch)
                        ingreso_c1, pen_c1, sla_c1 = calcular_liquidacion_pedido(c1, minuto_entrega_batch)
                        ingreso_c2, pen_c2, sla_c2 = calcular_liquidacion_pedido(c2, minuto_entrega_batch)
                        pen_batch = pen_c1 + pen_c2

                        t_tot = round(ingreso_c1 + ingreso_c2 - DESCUENTO_BASE_BATCHING, 2)
                        c_gas = round(d_batch * 0.90, 2)
                        g_neta = round(t_tot - c_gas, 2)
                        r_hr = round((g_neta / max(t_batch, 1)) * 60, 1)

                        if g_neta > 0:  # Ganancia neta positiva
                            candidatos_internos.append({
                                "id_opcion": f"BATCH_{c1.id_pedido}_{c2.id_pedido}",
                                "tipo": "BATCH_ORTOOLS",
                                "pedidos_ids": [c1.id_pedido, c2.id_pedido],
                                "secuencia": sec,
                                "zona_origen": c1.origen,
                                "zona_destino": sec[-1],
                                "ganancia_neta": g_neta,
                                "tarifa_total": t_tot,
                                "penalizacion_sla": pen_batch,
                                "gasolina": c_gas,
                                "tiempo_total_min": t_batch,
                                "distancia_total_km": d_batch,
                                "rentabilidad_hr": r_hr,
                                "dist_pickup": 0.0,
                                "descripcion": f"Batch de {c1.id_pedido} y {c2.id_pedido} hacia {sec[-1]} (SLA: {sla_c1}/{sla_c2})"
                            })

            # 2. Generar Candidatos Individuales
            for p in pedidos_disponibles:
                d_pick, t_pick = _mz.get((self.ubicacion_actual, p.origen), (3.0, 8.0))

                t_pick_real = round(t_pick * entorno.factor_trafico, 1)
                t_espera = max(0, (p.minuto_aparicion + p.tiempo_preparacion_min) - (entorno.minuto_turno + t_pick_real))
                t_tot = t_pick_real + t_espera + p.tiempo_viaje_min + 3.0
                if t_tot > tiempo_restante:
                    continue

                minuto_entrega_est = entorno.minuto_turno + int(t_tot)
                ingreso_est, pen_est, estado_sla = calcular_liquidacion_pedido(p, minuto_entrega_est)

                c_gas = round((d_pick + p.distancia_km) * 0.90, 2)
                g_neta = round(ingreso_est - c_gas, 2)
                r_hr = round((g_neta / max(t_tot, 1)) * 60, 1)

                if g_neta > 0:  # Ganancia neta positiva
                    candidatos_internos.append({
                        "id_opcion": f"SOLO_{p.id_pedido}",
                        "tipo": "INDIVIDUAL",
                        "pedidos_ids": [p.id_pedido],
                        "secuencia": [self.ubicacion_actual, p.origen, p.destino],
                        "zona_origen": p.origen,
                        "zona_destino": p.destino,
                        "ganancia_neta": g_neta,
                        "tarifa_total": ingreso_est,
                        "penalizacion_sla": pen_est,
                        "gasolina": c_gas,
                        "tiempo_total_min": t_tot,
                        "distancia_total_km": round(d_pick + p.distancia_km, 2),
                        "rentabilidad_hr": r_hr,
                        "dist_pickup": d_pick,
                        "descripcion": f"Pedido #{p.id_pedido} de {p.origen} a {p.destino} ({estado_sla})"
                    })

            # Si no hay candidatos con rentabilidad mínima, no se ejecuta acción este minuto
            if not candidatos_internos:
                return None

            # Ordenar y seleccionar los mejores candidatos para alimentar a los agentes
            candidatos_internos.sort(key=lambda x: x["rentabilidad_hr"], reverse=True)
            top_candidatos = candidatos_internos[:4]

            # Opción alternativa solo como último recurso
            top_candidatos.append({
                "id_opcion": "ESPERAR",
                "tipo": "ESPERAR",
                "pedidos_ids": [],
                "secuencia": [],
                "zona_origen": self.ubicacion_actual,
                "zona_destino": self.ubicacion_actual,
                "ganancia_neta": 0.0,
                "tarifa_total": 0.0,
                "gasolina": 0.0,
                "tiempo_total_min": 2.0,
                "distancia_total_km": 0.0,
                "rentabilidad_hr": 0.0,
                "dist_pickup": 0.0,
                "descripcion": "Esperar en zona actual solo si no existen opciones transitables ni seguras"
            })

            # 3. Datos de Contexto para el Sistema Dual DeepSeek
            zonas_afectadas = IMPACTO_AVENIDAS.get(entorno.avenida_cerrada, {}).get("zonas_afectadas", []) if entorno.avenida_cerrada else []
            condiciones_entorno = {
                "clima": entorno.clima,
                "factor_trafico": entorno.factor_trafico,
                "factor_surge": entorno.factor_surge,
                "avenida_cerrada": entorno.avenida_cerrada,
                "zonas_afectadas": zonas_afectadas
            }
            estado_repartidor = {
                "ubicacion_actual": self.ubicacion_actual,
                "minutos_restantes": tiempo_restante,
                "ganancia_acumulada": round(self.ganancia_neta_total, 2),
                "pedidos_completados": self.pedidos_completados
            }
            estado_mercado = {
                "factor_surge": entorno.factor_surge,
                "total_ofertas": len(pedidos_disponibles)
            }

            # Candidatos resumidos para el payload JSON
            candidatos_payload = [
                {
                    "id_opcion": c["id_opcion"],
                    "tipo": c["tipo"],
                    "ganancia_neta": c["ganancia_neta"],
                    "tiempo_total_min": c["tiempo_total_min"],
                    "distancia_total_km": c["distancia_total_km"],
                    "rentabilidad_hr": c["rentabilidad_hr"],
                    "zona_destino": c["zona_destino"],
                    "descripcion": c["descripcion"]
                }
                for c in top_candidatos
            ]

            # 4. Invocación del Sistema Dual (Estratega + Supervisor de Riesgo)
            opcion_elegida, log = self.explicador.evaluar_y_decidir(
                estado_repartidor, estado_mercado, candidatos_payload, condiciones_entorno
            )

            if not opcion_elegida or opcion_elegida.get("id_opcion") == "ESPERAR":
                self.disponible_en_minuto = entorno.minuto_turno + 2
                return log if log else None

            # Recuperar datos completos del candidato seleccionado
            cand_full = next((c for c in top_candidatos if c["id_opcion"] == opcion_elegida["id_opcion"]), None)
            if not cand_full or cand_full["tipo"] == "ESPERAR":
                self.disponible_en_minuto = entorno.minuto_turno + 2
                return log

            # 5. Ejecutar la acción aprobada y actualizar estado del repartidor
            if cand_full["tipo"] == "BATCH_ORTOOLS":
                self.ubicacion_actual = cand_full["zona_destino"]
                self.disponible_en_minuto = entorno.minuto_turno + int(cand_full["tiempo_total_min"])
                self.pedidos_completados += 2
                self.batches_realizados += 1
                self.ingresos_brutos += cand_full["tarifa_total"]
                self.gasto_gasolina_total += cand_full["gasolina"]
                self.ganancia_neta_total += cand_full["ganancia_neta"]
                self.km_totales += cand_full["distancia_total_km"]
                if cand_full.get("penalizacion_sla", 0.0) > 0:
                    self.pedidos_con_retraso += 1
                    self.penalizaciones_sla_total += cand_full["penalizacion_sla"]
                return log

            elif cand_full["tipo"] == "INDIVIDUAL":
                self.ubicacion_actual = cand_full["zona_destino"]
                self.disponible_en_minuto = entorno.minuto_turno + int(cand_full["tiempo_total_min"])
                self.pedidos_completados += 1
                self.ingresos_brutos += cand_full["tarifa_total"]
                self.gasto_gasolina_total += cand_full["gasolina"]
                self.ganancia_neta_total += cand_full["ganancia_neta"]
                self.km_totales += cand_full["distancia_total_km"]
                self.km_en_vacio += cand_full["dist_pickup"]
                if cand_full.get("penalizacion_sla", 0.0) > 0:
                    self.pedidos_con_retraso += 1
                    self.penalizaciones_sla_total += cand_full["penalizacion_sla"]
                return log

        return None