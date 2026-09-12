from typing import Dict, Tuple

DURACION_TURNO = 120

# Parámetros de SLA y Penalizaciones por Retraso
TOLERANCIA_DEADLINE_MIN = 5           # Margen de gracia sin penalización
PENALIZACION_RETRASO_SEVERO_MIN = 15  # Umbral para penalización crítica sobre tarifa base
FACTOR_PENALIZACION_TARIFA = 0.25     # 25% de la tarifa base como penalización por retraso severo
DESCUENTO_BASE_BATCHING = 8.0         # Descuento realista de tarifa base compartida en 2do pedido de batch

PUNTOS_INTERES: Dict[str, Tuple[float, float]] = {
    "Tec de Monterrey (Garza Sada)": (25.6514, -100.2895),
    "Centro MTY (Barrio Antiguo)": (25.6693, -100.3099),
    "Centrito Valle (San Pedro)": (25.6572, -100.3662),
    "Valle Oriente (San Pedro)": (25.6420, -100.3160),
    "San Jerónimo": (25.6725, -100.3551),
    "Cumbres": (25.7225, -100.3860),
    "San Nicolás": (25.7480, -100.2850),
    "Apodaca (Industrial)": (25.7808, -100.1873),
    "Santa Catarina": (25.6750, -100.4639),
}

CATALOGO_LLUVIA = [
    {"tipo": "SIN_LLUVIA",      "prob": 0.40, "factor_trafico": 1.00, "factor_surge": 1.00, "puede_cerrar": False, "duracion": (0,  0),  "emoji": "✅",  "desc": "Sin lluvia"},
    {"tipo": "LLUVIA_LIGERA",   "prob": 0.30, "factor_trafico": 1.20, "factor_surge": 1.20, "puede_cerrar": False, "duracion": (20, 35), "emoji": "🌦️", "desc": "Lluvia ligera"},
    {"tipo": "TORMENTA_SEVERA", "prob": 0.20, "factor_trafico": 1.65, "factor_surge": 1.65, "puede_cerrar": True,  "duracion": (30, 50), "emoji": "🌧️", "desc": "Tormenta severa (Encharcamientos)"},
    {"tipo": "GRANIZO",         "prob": 0.10, "factor_trafico": 1.85, "factor_surge": 1.80, "puede_cerrar": True,  "duracion": (15, 30), "emoji": "🌨️", "desc": "Granizo / Visibilidad reducida"},
]

CATALOGO_AVENIDAS = [
    "Av. Constitución",
    "Av. Gonzalitos",
    "Av. Morones Prieto",
    "Blvd. Díaz Ordaz",
]

IMPACTO_AVENIDAS: Dict[str, dict] = {
    "Av. Constitución": {"zonas_afectadas": ["Centro MTY (Barrio Antiguo)", "Tec de Monterrey (Garza Sada)", "Valle Oriente (San Pedro)"], "factor_desvio": 1.45, "desvio_desc": "Desvío por Lincoln/Colón"},
    "Av. Gonzalitos": {"zonas_afectadas": ["San Nicolás", "Valle Oriente (San Pedro)", "Centrito Valle (San Pedro)"], "factor_desvio": 1.40, "desvio_desc": "Desvío por Insurgentes"},
    "Av. Morones Prieto": {"zonas_afectadas": ["San Jerónimo", "Centrito Valle (San Pedro)", "Santa Catarina"], "factor_desvio": 1.35, "desvio_desc": "Desvío por Vasconcelos"},
    "Blvd. Díaz Ordaz": {"zonas_afectadas": ["Santa Catarina", "Centro MTY (Barrio Antiguo)", "San Jerónimo"], "factor_desvio": 1.50, "desvio_desc": "Desvío por Carretera Nacional"},
}