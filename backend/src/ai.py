import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dotenv import load_dotenv

# Cargar automáticamente variables de entorno desde backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class ExplicadorOptiGo:
    """
    Sistema Agéntico Dual OptiGo (Actor-Critic / Maker-Checker):
    - Instancia 1 (Estratega): Maximiza la rentabilidad neta por hora y optimiza rutas.
    - Instancia 2 (Supervisor de Riesgo): Evalúa la propuesta bajo criterios de clima severo,
      avenidas cerradas/inundadas y holgura de deadlines.
    """
    def __init__(self):
        self.client = None
        self.modelo = "deepseek-chat"
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=api_key,
                    base_url="https://api.deepseek.com"
                )
                print("   ✓ DeepSeek Dual-Agent conectado exitosamente (Estratega + Supervisor de Riesgo).")
            except Exception as e:
                print(f"   ⚠️ Error al inicializar cliente DeepSeek: {e}")

    def proponer_estrategia(
        self,
        estado_repartidor: Dict[str, Any],
        estado_mercado: Dict[str, Any],
        candidatos: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Instancia 1 (Estratega): Selecciona la opción más rentable y eficiente."""
        if not self.client:
            return self._fallback_estratega(candidatos)

        try:
            system_prompt = (
                "Eres el Estratega de Negocio de OptiGo para repartidores en Monterrey. "
                "Tu meta es maximizar la rentabilidad neta por hora ($/hr) y evitar viajes improductivos. "
                "Analiza las opciones candidatas (precalculadas por Google OR-Tools y OSMnx) y selecciona la mejor. "
                "Responde estrictamente en formato JSON con la siguiente estructura: "
                "{\"opcion_propuesta\": \"<id_opcion>\", \"accion\": \"EJECUTAR_BATCH\" | \"ACEPTAR_INDIVIDUAL\" | \"ESPERAR\", "
                "\"rentabilidad_hr\": <float>, \"justificacion\": \"<1 frase concisa>\"}"
            )

            user_prompt = json.dumps({
                "repartidor": estado_repartidor,
                "mercado": estado_mercado,
                "opciones_candidatas": candidatos
            }, ensure_ascii=False)

            response = self.client.chat.completions.create(
                model=self.modelo,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=150,
                temperature=0.4
            )
            raw = response.choices[0].message.content.strip()
            return json.loads(raw)
        except Exception as e:
            return self._fallback_estratega(candidatos)

    def supervisar_riesgo(
        self,
        propuesta: Dict[str, Any],
        candidatos: List[Dict[str, Any]],
        condiciones_entorno: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Instancia 2 (Supervisor de Riesgo): Válida o veta la propuesta por seguridad vial o deadlines."""
        if not self.client:
            return self._fallback_supervisor(propuesta, candidatos, condiciones_entorno)

        try:
            system_prompt = (
                "Eres el Supervisor de Seguridad y Riesgo Operativo de OptiGo en Monterrey. "
                "Tu prioridad es la integridad del repartidor ante clima extremo (tormentas, calor 40°C, granizo), "
                "evitar avenidas cerradas o inundadas (ej. Gonzalitos, Morones Prieto, Constitución) "
                "y garantizar que no se incumpla el deadline del cliente. "
                "Evalúa la propuesta del Estratega. Si es segura, apruébala. Si cruza avenidas bloqueadas o "
                "tiene riesgo crítico, vétala y selecciona una opción alternativa más segura de la lista o 'ESPERAR'. "
                "Responde estrictamente en formato JSON con la estructura: "
                "{\"veredicto\": \"APROBADO\" | \"VETADO_Y_CORREGIDO\", \"opcion_final\": \"<id_opcion>\", "
                "\"nivel_riesgo\": \"BAJO\" | \"MEDIO\" | \"ALTO\", \"motivo\": \"<1 frase concisa de justificación>\"}"
            )

            user_prompt = json.dumps({
                "propuesta_estratega": propuesta,
                "opciones_disponibles": candidatos,
                "condiciones_viales_y_clima": condiciones_entorno
            }, ensure_ascii=False)

            response = self.client.chat.completions.create(
                model=self.modelo,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=150,
                temperature=0.1
            )
            raw = response.choices[0].message.content.strip()
            return json.loads(raw)
        except Exception as e:
            return self._fallback_supervisor(propuesta, candidatos, condiciones_entorno)

    def evaluar_y_decidir(
        self,
        estado_repartidor: Dict[str, Any],
        estado_mercado: Dict[str, Any],
        candidatos: List[Dict[str, Any]],
        condiciones_entorno: Dict[str, Any]
    ) -> Tuple[Optional[Dict[str, Any]], str]:
        """
        Flujo de Decisión Dual:
        1. Estratega propone la opción de mayor rendimiento.
        2. Supervisor evalúa la seguridad y emite el veredicto final.
        """
        if not candidatos:
            return None, ""

        propuesta = self.proponer_estrategia(estado_repartidor, estado_mercado, candidatos)
        dictamen = self.supervisar_riesgo(propuesta, candidatos, condiciones_entorno)

        opcion_elegida_id = dictamen.get("opcion_final", propuesta.get("opcion_propuesta"))
        opcion_obj = next((c for c in candidatos if c["id_opcion"] == opcion_elegida_id), candidatos[0])

        # Formatear bitácora explicativa dual para consola
        veredicto = dictamen.get("veredicto", "APROBADO")
        motivo = dictamen.get("motivo", propuesta.get("justificacion", ""))
        rent_hr = opcion_obj.get("rentabilidad_hr", 0.0)

        if veredicto == "APROBADO":
            log = f"🤖 [ESTRATEGA]: Propuso {opcion_obj['id_opcion']} (${rent_hr:.1f}/hr) | 🛡️ [SUPERVISOR]: Aprobado ({dictamen.get('nivel_riesgo','BAJO')}) -> {motivo}"
        else:
            log = f"🛡️ [SUPERVISOR VETO]: {motivo} -> Ejecutando alternativa segura {opcion_obj['id_opcion']} (${rent_hr:.1f}/hr)"

        return opcion_obj, log

    def _fallback_estratega(self, candidatos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback determinista para el Estratega."""
        mejores = sorted(candidatos, key=lambda x: x.get("rentabilidad_hr", 0.0), reverse=True)
        elegido = mejores[0] if mejores else {"id_opcion": "ESPERAR", "rentabilidad_hr": 0.0}
        return {
            "opcion_propuesta": elegido["id_opcion"],
            "accion": "EJECUTAR_BATCH" if elegido.get("tipo") == "BATCH_ORTOOLS" else "ACEPTAR_INDIVIDUAL",
            "rentabilidad_hr": elegido.get("rentabilidad_hr", 0.0),
            "justificacion": f"Seleccionada por rentabilidad máxima de ${elegido.get('rentabilidad_hr',0.0):.1f}/hr."
        }

    def _fallback_supervisor(self, propuesta: Dict[str, Any], candidatos: List[Dict[str, Any]], entorno: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback determinista para el Supervisor de Riesgo."""
        opcion_propuesta = propuesta.get("opcion_propuesta")
        cand = next((c for c in candidatos if c["id_opcion"] == opcion_propuesta), None)
        
        avenida_cerrada = entorno.get("avenida_cerrada")
        zonas_afectadas = entorno.get("zonas_afectadas", [])

        if cand and avenida_cerrada and (cand.get("zona_destino") in zonas_afectadas or cand.get("zona_origen") in zonas_afectadas):
            # Veto por cruce de zona de avenida cerrada
            alternativas = [c for c in candidatos if c["id_opcion"] != opcion_propuesta and c.get("zona_destino") not in zonas_afectadas]
            if alternativas:
                segura = max(alternativas, key=lambda x: x.get("rentabilidad_hr", 0.0))
                return {
                    "veredicto": "VETADO_Y_CORREGIDO",
                    "opcion_final": segura["id_opcion"],
                    "nivel_riesgo": "ALTO",
                    "motivo": f"Cruce vetado por bloqueo vial en {avenida_cerrada}. Se desvía hacia {segura['id_opcion']}."
                }

        return {
            "veredicto": "APROBADO",
            "opcion_final": opcion_propuesta or candidatos[0]["id_opcion"],
            "nivel_riesgo": "BAJO" if not entorno.get("clima_adverso") else "MEDIO",
            "motivo": "Ruta y tiempos validados bajo condiciones operativas aceptables."
        }

    def explicar(self, tipo_decision: str, detalle: str, ganancia: float, ahorro_tiempo: float) -> str:
        """Compatibilidad hacia atrás con llamadas directas."""
        if tipo_decision == "BATCH_ORTOOLS":
            return f"Agrupamos 2 pedidos para ahorrar {ahorro_tiempo:.1f} min y escalar la ganancia a ${ganancia:.1f}/hr."
        elif tipo_decision == "SURGE_LLUVIA":
            return f"Maximizamos el viaje local por tarifa dinámica extremando precaución climática."
        return detalle