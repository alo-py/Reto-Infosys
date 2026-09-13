import os
import sys
import time
import json
import statistics
from src.config import DURACION_TURNO, IMPACTO_AVENIDAS
from src.models import Pedido
from src.routing import cargar_matriz_base, calcular_matriz_cierre
from src.data_loader import preparar_datasets
from src.environment import MotorEntorno
from src.ai import ExplicadorOptiGo
from src.agents import Repartidor

def run_single_simulation(run_id, matriz_base, df_kaggle, explicador):
    entorno_motor = MotorEntorno(duracion_turno=DURACION_TURNO)
    
    clima_str = entorno_motor.evento_lluvia.tipo if entorno_motor.evento_lluvia else "SIN_LLUVIA"
    incidente_str = f"{entorno_motor.incidente.tipo} ({entorno_motor.incidente.avenida_cerrada})" if entorno_motor.incidente else "NINGUNO"
    
    matrices_cierre = {}
    if entorno_motor.incidente and entorno_motor.incidente.avenida_cerrada:
        av = entorno_motor.incidente.avenida_cerrada
        matrices_cierre[av] = calcular_matriz_cierre(av, matriz_base)

    greedy = Repartidor("Greedy", "GREEDY", "Centro MTY (Barrio Antiguo)", explicador)
    optigo = Repartidor("OptiGo AI", "OPTIGO_AI", "Centro MTY (Barrio Antiguo)", explicador)

    pedidos_minuto = {m: [] for m in range(1, DURACION_TURNO + 1)}
    for _, row in df_kaggle.iterrows():
        m_llegada = int(row["arrival_minute"])
        if m_llegada > DURACION_TURNO:
            continue
        estado_m = entorno_motor.obtener_estado(m_llegada)
        _mz = matrices_cierre.get(estado_m.avenida_cerrada, matriz_base) if estado_m.avenida_cerrada else matriz_base
        d_km, t_base = _mz.get((row["restaurant_zone"], row["delivery_zone"]), (5.0, 15.0))
        
        tarifa = round(((row["base_fee_mxn"] + (d_km * 4.0)) * estado_m.factor_surge) + row["tip_mxn"], 2)
        pedidos_minuto[m_llegada].append(Pedido(
            id_pedido=int(row["order_id"]),
            minuto_aparicion=m_llegada,
            minuto_deadline=int(row["deadline_minute"]),
            origen=row["restaurant_zone"],
            destino=row["delivery_zone"],
            demanda_paquete=int(row["solomon_demand"]),
            tiempo_preparacion_min=int(row["prep_time_min"]),
            distancia_km=d_km,
            tiempo_viaje_min=round(t_base * estado_m.factor_trafico, 1),
            tarifa_final_mxn=tarifa,
            propina_mxn=float(row["tip_mxn"]),
            gasolina_viaje_mxn=round(d_km * 0.90, 2)
        ))

    pool_activas = []
    decisiones_optigo = []

    for minuto in range(1, DURACION_TURNO + 1):
        estado_actual = entorno_motor.obtener_estado(minuto)
        pool_activas = [p for p in pool_activas + pedidos_minuto.get(minuto, []) if (minuto - p.minuto_aparicion) <= 4 and minuto < p.minuto_deadline]
        
        greedy.ejecutar_turno(list(pool_activas), estado_actual, DURACION_TURNO - minuto, matriz_base, matrices_cierre)
        log = optigo.ejecutar_turno(list(pool_activas), estado_actual, DURACION_TURNO - minuto, matriz_base, matrices_cierre)
        if log:
            decisiones_optigo.append(f"[M{minuto:03d}] {log}")

    dif = optigo.ganancia_neta_total - greedy.ganancia_neta_total
    pct = ((dif) / max(greedy.ganancia_neta_total, 1.0)) * 100.0

    return {
        "run_id": run_id,
        "clima": clima_str,
        "incidente": incidente_str,
        "greedy_neto": round(greedy.ganancia_neta_total, 2),
        "optigo_neto": round(optigo.ganancia_neta_total, 2),
        "dif_mxn": round(dif, 2),
        "dif_pct": round(pct, 2),
        "greedy_pedidos": greedy.pedidos_completados,
        "optigo_pedidos": optigo.pedidos_completados,
        "greedy_retrasos": greedy.pedidos_con_retraso,
        "optigo_retrasos": optigo.pedidos_con_retraso,
        "greedy_penalizacion": round(greedy.penalizaciones_sla_total, 2),
        "optigo_penalizacion": round(optigo.penalizaciones_sla_total, 2),
        "greedy_gasolina": round(greedy.gasto_gasolina_total, 2),
        "optigo_gasolina": round(optigo.gasto_gasolina_total, 2),
        "decisiones": decisiones_optigo
    }

def main():
    print("="*75)
    print("🔬 INICIANDO BENCHMARK ESTADÍSTICO DE 10 PRUEBAS: GREEDY VS OPTIGO AI")
    print("="*75)
    
    matriz_base = cargar_matriz_base()
    df_kaggle = preparar_datasets()
    explicador = ExplicadorOptiGo()

    resultados = []
    
    for i in range(1, 11):
        print(f"\n▶ Ejecutando Prueba {i}/10...")
        t0 = time.time()
        res = run_single_simulation(i, matriz_base, df_kaggle, explicador)
        t_elapsed = time.time() - t0
        resultados.append(res)
        
        simbolo = "✅" if res["dif_mxn"] >= 0 else "❌"
        print(f"  {simbolo} Corrida #{i:02d} ({t_elapsed:.1f}s): Clima={res['clima']} | {res['incidente']}")
        print(f"     Greedy: ${res['greedy_neto']:.2f} ({res['greedy_pedidos']} ped, {res['greedy_retrasos']} ret, multas: ${res['greedy_penalizacion']})")
        print(f"     OptiGo: ${res['optigo_neto']:.2f} ({res['optigo_pedidos']} ped, {res['optigo_retrasos']} ret, multas: ${res['optigo_penalizacion']})")
        print(f"     Diferencial: {'+' if res['dif_mxn']>=0 else ''}${res['dif_mxn']:.2f} MXN ({'+' if res['dif_pct']>=0 else ''}{res['dif_pct']:.1f}%)")

    # Análisis Estadístico Consolidado
    g_netos = [r["greedy_neto"] for r in resultados]
    o_netos = [r["optigo_neto"] for r in resultados]
    difs = [r["dif_mxn"] for r in resultados]
    pcts = [r["dif_pct"] for r in resultados]
    victorias_optigo = sum(1 for d in difs if d > 0)
    empates = sum(1 for d in difs if d == 0)
    derrotas = sum(1 for d in difs if d < 0)

    print("\n" + "="*75)
    print("📊 REPORTE CONSOLIDADO DE 10 PRUEBAS ESTOCÁSTICAS")
    print("="*75)
    print(f"{'#':<3} | {'Clima':<15} | {'Incidente':<25} | {'Greedy':<10} | {'OptiGo':<10} | {'Diferencial':<12}")
    print("-"*75)
    for r in resultados:
        inc_short = (r['incidente'][:23] + '..') if len(r['incidente']) > 25 else r['incidente']
        dif_str = f"{'+' if r['dif_mxn']>=0 else ''}${r['dif_mxn']:.2f}"
        print(f"{r['run_id']:<3} | {r['clima']:<15} | {inc_short:<25} | ${r['greedy_neto']:<9.2f} | ${r['optigo_neto']:<9.2f} | {dif_str:<12}")

    print("="*75)
    print(f"🏆 Win Rate de OptiGo AI: {victorias_optigo}/10 ({(victorias_optigo/10)*100:.1f}%) | Derrotas: {derrotas} | Empates: {empates}")
    print(f"💰 Promedio Greedy:       ${statistics.mean(g_netos):.2f} MXN (σ = {statistics.stdev(g_netos):.2f})")
    print(f"💰 Promedio OptiGo AI:    ${statistics.mean(o_netos):.2f} MXN (σ = {statistics.stdev(o_netos):.2f})")
    print(f"🚀 Diferencial Promedio:  {'+' if statistics.mean(difs)>=0 else ''}${statistics.mean(difs):.2f} MXN ({statistics.mean(pcts):.1f}%)")
    print(f"📉 Peor caso OptiGo:      ${min(difs):.2f} MXN")
    print(f"📈 Mejor caso OptiGo:     +${max(difs):.2f} MXN")
    print(f"⚠️ Retrasos Totales SLA:  Greedy = {sum(r['greedy_retrasos'] for r in resultados)} vs OptiGo = {sum(r['optigo_retrasos'] for r in resultados)}")
    print(f"🛑 Multas Totales SLA:    Greedy = ${sum(r['greedy_penalizacion'] for r in resultados):.2f} MXN vs OptiGo = ${sum(r['optigo_penalizacion'] for r in resultados):.2f} MXN")
    print("="*75)

    with open("benchmark_results.json", "w") as f:
        json.dump({
            "resultados": resultados,
            "resumen": {
                "win_rate": victorias_optigo / 10,
                "promedio_greedy": statistics.mean(g_netos),
                "promedio_optigo": statistics.mean(o_netos),
                "diferencial_medio": statistics.mean(difs),
                "stdev_greedy": statistics.stdev(g_netos),
                "stdev_optigo": statistics.stdev(o_netos),
            }
        }, f, indent=2)

if __name__ == "__main__":
    main()
