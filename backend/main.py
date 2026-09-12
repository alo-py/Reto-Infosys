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

    print("\n" + "="*60)
    print("🏆 RESULTADOS FINALES DE LA SIMULACIÓN (120 MINUTOS)")
    print("="*60)
    
    tasa_greedy = ((greedy.pedidos_completados - greedy.pedidos_con_retraso) / max(greedy.pedidos_completados, 1)) * 100
    tasa_optigo = ((optigo.pedidos_completados - optigo.pedidos_con_retraso) / max(optigo.pedidos_completados, 1)) * 100
    dif_neto = optigo.ganancia_neta_total - greedy.ganancia_neta_total
    pct_mejora = ((dif_neto) / max(greedy.ganancia_neta_total, 1)) * 100

    print(f"📊 MÉTRICA                   | GREEDY (Baseline)   | OPTIGO AI (Optimizado)")
    print(f"----------------------------+---------------------+-----------------------")
    print(f"💰 Ganancia Neta Total      | ${greedy.ganancia_neta_total:>8.2f} MXN       | ${optigo.ganancia_neta_total:>8.2f} MXN")
    print(f"💵 Ingresos Brutos          | ${greedy.ingresos_brutos:>8.2f} MXN       | ${optigo.ingresos_brutos:>8.2f} MXN")
    print(f"⛽ Gasto de Gasolina         | ${greedy.gasto_gasolina_total:>8.2f} MXN       | ${optigo.gasto_gasolina_total:>8.2f} MXN")
    print(f"📦 Pedidos Completados      | {greedy.pedidos_completados:>9d}           | {optigo.pedidos_completados:>9d}")
    print(f"👥 Batches Realizados       | {greedy.batches_realizados:>9d}           | {optigo.batches_realizados:>9d}")
    print(f"⚠️ Pedidos con Retraso SLA   | {greedy.pedidos_con_retraso:>9d}           | {optigo.pedidos_con_retraso:>9d}")
    print(f"🛑 Penalizaciones SLA       | ${greedy.penalizaciones_sla_total:>8.2f} MXN       | ${optigo.penalizaciones_sla_total:>8.2f} MXN")
    print(f"🎯 Cumplimiento a Tiempo    | {tasa_greedy:>8.1f}%          | {tasa_optigo:>8.1f}%")
    print(f"🛣️ Km Totales Recorridos    | {greedy.km_totales:>8.1f} km          | {optigo.km_totales:>8.1f} km")
    print(f"💨 Km en Vacío (Deadhead)   | {greedy.km_en_vacio:>8.1f} km          | {optigo.km_en_vacio:>8.1f} km")
    print("="*60)
    print(f"🚀 DIFERENCIAL OPTIGO: {'+' if dif_neto >= 0 else ''}${dif_neto:.2f} MXN ({'+' if pct_mejora >= 0 else ''}{pct_mejora:.1f}%)")
    print("="*60)

if __name__ == "__main__":
    main()