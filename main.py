import time
from src.config import DURACION_TURNO, IMPACTO_AVENIDAS
from src.models import Pedido
from src.routing import cargar_matriz_base, calcular_matriz_cierre
from src.data_loader import preparar_datasets
from src.environment import MotorEntorno
from src.ai import ExplicadorOptiGo
from src.agents import Repartidor

def main():
    matriz_base = cargar_matriz_base()
    df_kaggle = preparar_datasets()
    explicador = ExplicadorOptiGo()
    entorno_motor = MotorEntorno(duracion_turno=DURACION_TURNO)
    entorno_motor.imprimir_pronostico()

    matrices_cierre = {}
    if entorno_motor.incidente and entorno_motor.incidente.avenida_cerrada:
        av = entorno_motor.incidente.avenida_cerrada
        matrices_cierre[av] = calcular_matriz_cierre(av, matriz_base)

    greedy = Repartidor("Greedy (Base)", "GREEDY", "Centro MTY (Barrio Antiguo)", explicador)
    optigo = Repartidor("OptiGo AI", "OPTIGO_AI", "Centro MTY (Barrio Antiguo)", explicador)

    pedidos_minuto = {m: [] for m in range(1, DURACION_TURNO + 1)}
    for _, row in df_kaggle.iterrows():
        m_llegada = int(row["arrival_minute"])
        if m_llegada > DURACION_TURNO: continue
        estado_m = entorno_motor.obtener_estado(m_llegada)
        _mz = matrices_cierre.get(estado_m.avenida_cerrada, matriz_base) if estado_m.avenida_cerrada else matriz_base
        d_km, t_base = _mz.get((row["restaurant_zone"], row["delivery_zone"]), (5.0, 15.0))
        
        tarifa = round(((row["base_fee_mxn"] + (d_km * 4.0)) * estado_m.factor_surge) + row["tip_mxn"], 2)
        pedidos_minuto[m_llegada].append(Pedido(
            id_pedido=int(row["order_id"]), minuto_aparicion=m_llegada, minuto_deadline=int(row["deadline_minute"]),
            origen=row["restaurant_zone"], destino=row["delivery_zone"], demanda_paquete=int(row["solomon_demand"]),
            tiempo_preparacion_min=int(row["prep_time_min"]), distancia_km=d_km, tiempo_viaje_min=round(t_base * estado_m.factor_trafico, 1),
            tarifa_final_mxn=tarifa, propina_mxn=float(row["tip_mxn"]), gasolina_viaje_mxn=round(d_km * 0.90, 2)
        ))

    pool_activas = []
    print("\n🏁 INICIANDO SIMULACIÓN...")
    for minuto in range(1, DURACION_TURNO + 1):
        estado_actual = entorno_motor.obtener_estado(minuto)
        pool_activas = [p for p in pool_activas + pedidos_minuto.get(minuto, []) if (minuto - p.minuto_aparicion) <= 4 and minuto < p.minuto_deadline]
        
        greedy.ejecutar_turno(list(pool_activas), estado_actual, DURACION_TURNO - minuto, matriz_base, matrices_cierre)
        log = optigo.ejecutar_turno(list(pool_activas), estado_actual, DURACION_TURNO - minuto, matriz_base, matrices_cierre)
        if log: print(f"⏱️ [Minuto {minuto:03d}] {log}")
        time.sleep(0.01)

    print("\n🏆 RESULTADOS FINALES")
    print(f"Greedy Neto: ${greedy.ganancia_neta_total:.2f} | OptiGo Neto: ${optigo.ganancia_neta_total:.2f}")

if __name__ == "__main__":
    main()