from typing import Dict, List, Optional, Tuple
from src.models import Pedido, EstadoEntorno
from src.optimization import resolver_batching_ortools
from src.ai import ExplicadorOptiGo

class Repartidor:
    def __init__(self, nombre: str, tipo_agente: str, ubicacion_inicial: str, explicador: ExplicadorOptiGo):
        self.nombre = nombre
        self.tipo_agente = tipo_agente
        self.ubicacion_actual = ubicacion_inicial
        self.explicador = explicador
        self.disponible_en_minuto = 0
        self.pedidos_completados = 0
        self.batches_realizados = 0
        self.pedidos_rechazados = 0
        self.ingresos_brutos = 0.0
        self.gasto_gasolina_total = 0.0
        self.ganancia_neta_total = 0.0
        self.km_totales = 0.0
        self.km_en_vacio = 0.0

    def ejecutar_turno(self, pedidos_disponibles: List[Pedido], entorno: EstadoEntorno, tiempo_restante: int, matriz_base: Dict, matrices_cierre: Dict) -> Optional[str]:
        if entorno.minuto_turno < self.disponible_en_minuto or not pedidos_disponibles:
            return None

        _mz = matrices_cierre.get(entorno.avenida_cerrada, matriz_base) if entorno.avenida_cerrada else matriz_base

        if self.tipo_agente == "GREEDY":
            p = pedidos_disponibles[0]
            dist_pickup, t_pickup = _mz.get((self.ubicacion_actual, p.origen), (3.0, 8.0))
            t_pickup_real = round(t_pickup * entorno.factor_trafico, 1)
            
            minuto_llegada_restaurante = entorno.minuto_turno + t_pickup_real
            tiempo_espera = max(0, (p.minuto_aparicion + p.tiempo_preparacion_min) - minuto_llegada_restaurante)
            t_total_viaje = t_pickup_real + tiempo_espera + p.tiempo_viaje_min + 3.0

            if t_total_viaje > tiempo_restante: return None

            c_gasolina = round((dist_pickup + p.distancia_km) * 0.90, 2)
            self.ubicacion_actual = p.destino
            self.disponible_en_minuto = entorno.minuto_turno + int(t_total_viaje)
            self.pedidos_completados += 1
            self.ingresos_brutos += p.tarifa_final_mxn
            self.gasto_gasolina_total += c_gasolina
            self.ganancia_neta_total += round(p.tarifa_final_mxn - c_gasolina, 2)
            self.km_totales += (dist_pickup + p.distancia_km)
            self.km_en_vacio += dist_pickup
            return None

        elif self.tipo_agente == "OPTIGO_AI":
            mejor_batch, mejor_rent = None, 0.0
            max_ev = min(len(pedidos_disponibles), 8)
            
            for i in range(max_ev):
                for j in range(i + 1, max_ev):
                    c1, c2 = pedidos_disponibles[i], pedidos_disponibles[j]
                    if _mz.get((c1.origen, c2.origen), (10, 20))[0] > 6.0: continue
                    
                    sol = resolver_batching_ortools(self.ubicacion_actual, c1, c2, entorno.factor_trafico, entorno.minuto_turno, tiempo_restante, _mz)
                    if sol:
                        sec, d_batch, t_rutas = sol
                        t_batch = t_rutas + max(c1.tiempo_preparacion_min, c2.tiempo_preparacion_min) + 6.0
                        if t_batch > tiempo_restante: continue
                        
                        t_tot = c1.tarifa_final_mxn + c2.tarifa_final_mxn - 18.0
                        c_gas = round(d_batch * 0.90, 2)
                        g_neta = round(t_tot - c_gas, 2)
                        r_hr = (g_neta / max(t_batch, 1)) * 60
                        
                        if r_hr > mejor_rent:
                            mejor_rent = r_hr
                            mejor_batch = (c1, c2, sec, d_batch, t_batch, t_tot, c_gas, g_neta, r_hr)

            if mejor_batch and mejor_rent >= 90.0:
                p1, p2, sec, d_batch, t_batch, t_tot, c_gas, g_neta, r_hr = mejor_batch
                self.ubicacion_actual = sec[-1]
                self.disponible_en_minuto = entorno.minuto_turno + int(t_batch)
                self.pedidos_completados += 2
                self.batches_realizados += 1
                self.ingresos_brutos += t_tot
                self.gasto_gasolina_total += c_gas
                self.ganancia_neta_total += g_neta
                self.km_totales += d_batch
                exp = self.explicador.explicar("BATCH_ORTOOLS", f"Batch #{p1.id_pedido}+#{p2.id_pedido}", r_hr, 16.0)
                return f"🔥 [BATCH OR-TOOLS]: Agrupó #{p1.id_pedido} y #{p2.id_pedido} | ${r_hr:.1f}/hr | {exp}"

            candidatos = []
            for p in pedidos_disponibles:
                d_pick, t_pick = _mz.get((self.ubicacion_actual, p.origen), (3.0, 8.0))
                if d_pick > 4.5 and entorno.factor_surge < 1.6: continue
                
                t_pick_real = round(t_pick * entorno.factor_trafico, 1)
                t_espera = max(0, (p.minuto_aparicion + p.tiempo_preparacion_min) - (entorno.minuto_turno + t_pick_real))
                t_tot = t_pick_real + t_espera + p.tiempo_viaje_min + 3.0
                if t_tot > tiempo_restante: continue
                
                c_gas = round((d_pick + p.distancia_km) * 0.90, 2)
                g_neta = round(p.tarifa_final_mxn - c_gas, 2)
                r_hr = (g_neta / max(t_tot, 1)) * 60
                if r_hr >= 85.0: candidatos.append((p, d_pick, t_tot, c_gas, g_neta, r_hr))

            if candidatos:
                candidatos.sort(key=lambda x: x[5], reverse=True)
                p_opt, d_pick, t_tot, c_gas, g_neta, r_hr = candidatos[0]
                self.ubicacion_actual = p_opt.destino
                self.disponible_en_minuto = entorno.minuto_turno + int(t_tot)
                self.pedidos_completados += 1
                self.ingresos_brutos += p_opt.tarifa_final_mxn
                self.gasto_gasolina_total += c_gas
                self.ganancia_neta_total += g_neta
                self.km_totales += (d_pick + p_opt.distancia_km)
                self.km_en_vacio += d_pick
                
                if entorno.factor_surge >= 1.5:
                    exp = self.explicador.explicar("SURGE_LLUVIA", f"Aceptado #{p_opt.id_pedido}", g_neta, t_tot)
                    return f"⚡ [OPTIGO SURGE]: Pedido #{p_opt.id_pedido} | Surge {entorno.factor_surge}x | ${r_hr:.1f}/hr | {exp}"
        return None