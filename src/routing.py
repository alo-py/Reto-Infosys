import osmnx as ox
from typing import Dict, Tuple
from src.config import PUNTOS_INTERES, IMPACTO_AVENIDAS

def cargar_matriz_base() -> Dict[Tuple[str, str], Tuple[float, float]]:
    print("🚀 [1/5] Inicializando red vial real de Monterrey con OSMnx...")
    ox.settings.use_cache = True
    ox.settings.log_console = False

    G = ox.graph.graph_from_place("Monterrey, Mexico", network_type="drive")
    G = ox.routing.add_edge_speeds(G)
    G = ox.routing.add_edge_travel_times(G)

    nodos_puntos = {nombre: ox.distance.nearest_nodes(G, X=coords[1], Y=coords[0]) for nombre, coords in PUNTOS_INTERES.items()}
    matriz_base = {}

    print("⚡ [2/5] Pre-calculando matriz de distancias y tiempos base...")
    for orig_name, orig_node in nodos_puntos.items():
        for dest_name, dest_node in nodos_puntos.items():
            if orig_name == dest_name:
                matriz_base[(orig_name, dest_name)] = (0.0, 0.0)
                continue
            try:
                ruta = ox.routing.shortest_path(G, orig_node, dest_node, weight="travel_time")
                if ruta and len(ruta) > 1:
                    dist_m = sum(G.get_edge_data(u, v)[0].get("length", 0) for u, v in zip(ruta[:-1], ruta[1:]))
                    tiempo_s = sum(G.get_edge_data(u, v)[0].get("travel_time", 0) for u, v in zip(ruta[:-1], ruta[1:]))
                    matriz_base[(orig_name, dest_name)] = (round(dist_m / 1000.0, 2), round(tiempo_s / 60.0, 1))
                else:
                    matriz_base[(orig_name, dest_name)] = (5.0, 15.0)
            except Exception:
                matriz_base[(orig_name, dest_name)] = (6.0, 18.0)
    return matriz_base

def calcular_matriz_cierre(avenida: str, matriz_base: Dict[Tuple[str, str], Tuple[float, float]]) -> Dict[Tuple[str, str], Tuple[float, float]]:
    impacto = IMPACTO_AVENIDAS[avenida]
    zonas = set(impacto["zonas_afectadas"])
    factor = impacto["factor_desvio"]
    matriz_cierre = {}
    for (orig, dest), (dist_km, t_min) in matriz_base.items():
        if orig in zonas or dest in zonas:
            matriz_cierre[(orig, dest)] = (round(dist_km * 1.15, 2), round(t_min * factor, 1))
        else:
            matriz_cierre[(orig, dest)] = (dist_km, t_min)
    return matriz_cierre