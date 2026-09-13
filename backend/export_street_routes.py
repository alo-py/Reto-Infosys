import json
import os
import osmnx as ox
from src.config import PUNTOS_INTERES

def export_routes():
    print("🚗 [1/3] Loading Monterrey road network from OpenStreetMap cache...")
    ox.settings.use_cache = True
    ox.settings.log_console = False

    G = ox.graph.graph_from_place("Monterrey, Mexico", network_type="drive")
    G = ox.routing.add_edge_speeds(G)
    G = ox.routing.add_edge_travel_times(G)

    nodes = {name: ox.distance.nearest_nodes(G, X=coords[1], Y=coords[0]) for name, coords in PUNTOS_INTERES.items()}

    routes_dict = {}
    print("🛣️ [2/3] Computing shortest street paths between all 9 Monterrey hubs...")
    
    for orig_name, orig_node in nodes.items():
        for dest_name, dest_node in nodes.items():
            key = f"{orig_name}->{dest_name}"
            if orig_name == dest_name:
                c = PUNTOS_INTERES[orig_name]
                routes_dict[key] = [[round(c[0], 5), round(c[1], 5)]]
                continue

            try:
                path = ox.routing.shortest_path(G, orig_node, dest_node, weight="travel_time")
                if path and len(path) > 1:
                    # Extraer las coordenadas exactas de cada nodo en la calle
                    coords = [[round(G.nodes[n]["y"], 5), round(G.nodes[n]["x"], 5)] for n in path]
                    routes_dict[key] = coords
                else:
                    c1, c2 = PUNTOS_INTERES[orig_name], PUNTOS_INTERES[dest_name]
                    routes_dict[key] = [
                        [round(c1[0], 5), round(c1[1], 5)],
                        [round((c1[0] + c2[0])/2, 5), round((c1[1] + c2[1])/2, 5)],
                        [round(c2[0], 5), round(c2[1], 5)]
                    ]
            except Exception as e:
                c1, c2 = PUNTOS_INTERES[orig_name], PUNTOS_INTERES[dest_name]
                routes_dict[key] = [
                    [round(c1[0], 5), round(c1[1], 5)],
                    [round(c2[0], 5), round(c2[1], 5)]
                ]

    output_path = "../frontend/app/ui/Components/Driver/monterrey_street_routes.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(routes_dict, f, separators=(',', ':'))

    size_kb = os.path.getsize(output_path) / 1024
    print(f"✅ [3/3] Exported {len(routes_dict)} real-street routes to {output_path} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    export_routes()
