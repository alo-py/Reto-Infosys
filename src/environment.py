import random
from typing import Optional
from src.config import CATALOGO_LLUVIA, CATALOGO_AVENIDAS, IMPACTO_AVENIDAS
from src.models import EstadoEntorno, EventoLluvia, IncidenteVial

class MotorEntorno:
    def __init__(self, duracion_turno: int = 120):
        self.duracion_turno = duracion_turno
        self.temp_base: int = random.randint(38, 42)
        self.evento_lluvia: Optional[EventoLluvia] = self._generar_evento_lluvia()
        self.incidente: Optional[IncidenteVial] = self._generar_incidente()

    def _generar_evento_lluvia(self) -> Optional[EventoLluvia]:
        elegido = random.choices(CATALOGO_LLUVIA, weights=[c["prob"] for c in CATALOGO_LLUVIA], k=1)[0]
        if elegido["tipo"] == "SIN_LLUVIA":
            return None
        dur_min, dur_max = elegido["duracion"]
        duracion = random.randint(dur_min, dur_max)
        inicio = random.randint(10, max(11, self.duracion_turno - duracion - 5))
        fin = min(inicio + duracion, self.duracion_turno)
        return EventoLluvia(
            tipo=elegido["tipo"],
            descripcion=f"{elegido['emoji']} {elegido['desc']}",
            minuto_inicio=inicio,
            minuto_fin=fin,
            factor_trafico=elegido["factor_trafico"],
            factor_surge=elegido["factor_surge"],
            puede_cerrar_avenida=elegido["puede_cerrar"],
        )

    def _generar_incidente(self) -> Optional[IncidenteVial]:
        prob_cierre = 0.60 if (self.evento_lluvia and self.evento_lluvia.puede_cerrar_avenida) else 0.15
        roll = random.random()

        if roll < prob_cierre:
            avenida = random.choice(CATALOGO_AVENIDAS)
            inicio = random.randint(10, self.duracion_turno - 25) if not self.evento_lluvia else self.evento_lluvia.minuto_inicio
            fin = min(inicio + random.randint(15, 35), self.duracion_turno - 2)
            return IncidenteVial(tipo="CIERRE_AVENIDA", descripcion=f"🚧 Cierre vial: {avenida} bloqueada", minuto_inicio=inicio, minuto_fin=fin, factor_trafico_extra=1.25, avenida_cerrada=avenida)
        
        elif roll < prob_cierre + 0.20:
            avenida = random.choice(CATALOGO_AVENIDAS)
            inicio = random.randint(5, self.duracion_turno - 20)
            fin = min(inicio + random.randint(10, 25), self.duracion_turno - 2)
            return IncidenteVial(tipo="ACCIDENTE_VIAL", descripcion=f"💥 Accidente vial en {avenida}", minuto_inicio=inicio, minuto_fin=fin, factor_trafico_extra=1.35, avenida_cerrada=avenida)
        return None

    def obtener_estado(self, minuto: int) -> EstadoEntorno:
        horas, mins = 12 + (minuto // 60), minuto % 60
        hora_reloj = f"{horas:02d}:{mins:02d} PM"

        factor_trafico = 1.25 if 40 <= minuto <= 90 else (1.10 if minuto < 40 else 1.15)
        factor_surge = 1.0
        clima = f"☀️ CALOR_EXTREMO ({self.temp_base}°C)"
        avenida_cerrada = None

        if self.evento_lluvia and self.evento_lluvia.activo_en(minuto):
            factor_trafico *= self.evento_lluvia.factor_trafico
            factor_surge = self.evento_lluvia.factor_surge
            clima = self.evento_lluvia.descripcion

        if self.incidente and self.incidente.activo_en(minuto):
            factor_trafico *= self.incidente.factor_trafico_extra
            avenida_cerrada = self.incidente.avenida_cerrada

        return EstadoEntorno(minuto, hora_reloj, clima, round(factor_trafico, 2), factor_surge, avenida_cerrada)
    
    def imprimir_pronostico(self):
        print("🌤️ PRONÓSTICO: IA Motor de Entorno inicializado.")