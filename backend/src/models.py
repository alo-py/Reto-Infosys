from dataclasses import dataclass
from typing import Optional

@dataclass
class EstadoEntorno:
    minuto_turno: int
    hora_reloj: str
    clima: str
    factor_trafico: float
    factor_surge: float
    avenida_cerrada: Optional[str] = None

@dataclass
class EventoLluvia:
    tipo: str
    descripcion: str
    minuto_inicio: int
    minuto_fin: int
    factor_trafico: float
    factor_surge: float
    puede_cerrar_avenida: bool

    def activo_en(self, minuto: int) -> bool:
        return self.minuto_inicio <= minuto <= self.minuto_fin

@dataclass
class IncidenteVial:
    tipo: str
    descripcion: str
    minuto_inicio: int
    minuto_fin: int
    factor_trafico_extra: float
    avenida_cerrada: Optional[str]

    def activo_en(self, minuto: int) -> bool:
        return self.minuto_inicio <= minuto <= self.minuto_fin

@dataclass
class Pedido:
    id_pedido: int
    minuto_aparicion: int
    minuto_deadline: int
    origen: str
    destino: str
    demanda_paquete: int
    tiempo_preparacion_min: int
    distancia_km: float
    tiempo_viaje_min: float
    tarifa_final_mxn: float
    propina_mxn: float
    gasolina_viaje_mxn: float