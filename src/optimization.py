from typing import Dict, List, Optional, Tuple
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from src.models import Pedido

def resolver_batching_ortools(
    ubicacion_actual: str,
    pedido1: Pedido,
    pedido2: Pedido,
    factor_trafico: float,
    minuto_actual: int,
    tiempo_restante_turno: int,
    matriz_viajes: Dict[Tuple[str, str], Tuple[float, float]],
) -> Optional[Tuple[List[str], float, float]]:
    
    nodos = [ubicacion_actual, pedido1.origen, pedido1.destino, pedido2.origen, pedido2.destino]
    nodos_con_dummy = nodos + ["FIN_RUTA_ABIERTA"]
    
    matriz_tiempos_dummy, matriz_distancias_dummy = [], []
    for i, orig in enumerate(nodos_con_dummy):
        fila_t, fila_d = [], []
        for j, dest in enumerate(nodos_con_dummy):
            if i == 5 or j == 5:
                fila_t.append(0); fila_d.append(0.0)
            else:
                d_km, t_min = matriz_viajes.get((orig, dest), (5.0, 15.0))
                fila_t.append(int(round(t_min * factor_trafico)))
                fila_d.append(d_km)
        matriz_tiempos_dummy.append(fila_t)
        matriz_distancias_dummy.append(fila_d)

    manager = pywrapcp.RoutingIndexManager(6, 1, [0], [5])
    routing = pywrapcp.RoutingModel(manager)

    def transit_callback(from_idx, to_idx):
        return matriz_tiempos_dummy[manager.IndexToNode(from_idx)][manager.IndexToNode(to_idx)]
    
    transit_callback_index = routing.RegisterTransitCallback(transit_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    routing.AddDimension(transit_callback_index, slack_max=35, capacity=tiempo_restante_turno, fix_start_cumul_to_zero=True, name="Tiempo")
    time_dimension = routing.GetDimensionOrDie("Tiempo")

    p1, d1 = manager.NodeToIndex(1), manager.NodeToIndex(2)
    p2, d2 = manager.NodeToIndex(3), manager.NodeToIndex(4)
    routing.AddPickupAndDelivery(p1, d1)
    routing.AddPickupAndDelivery(p2, d2)
    
    solver = routing.solver()
    solver.Add(routing.VehicleVar(p1) == routing.VehicleVar(d1))
    solver.Add(routing.VehicleVar(p2) == routing.VehicleVar(d2))

    time_dimension.CumulVar(d1).SetRange(0, max(10, pedido1.minuto_deadline - minuto_actual))
    time_dimension.CumulVar(d2).SetRange(0, max(10, pedido2.minuto_deadline - minuto_actual))

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    search_parameters.time_limit.seconds = 1
    solution = routing.SolveWithParameters(search_parameters)

    if not solution: return None

    idx = routing.Start(0)
    secuencia_nodos, distancia_total, tiempo_total = [], 0.0, 0.0
    while not routing.IsEnd(idx):
        node_curr = manager.IndexToNode(idx)
        next_idx = solution.Value(routing.NextVar(idx))
        if not routing.IsEnd(next_idx):
            node_next = manager.IndexToNode(next_idx)
            if node_next != 5:
                distancia_total += matriz_distancias_dummy[node_curr][node_next]
                tiempo_total += matriz_tiempos_dummy[node_curr][node_next]
        if node_curr != 5:
            secuencia_nodos.append(nodos[node_curr])
        idx = next_idx

    return secuencia_nodos, round(distancia_total, 2), round(tiempo_total, 1)