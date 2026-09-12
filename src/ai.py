import os

class ExplicadorOptiGo:
    def __init__(self):
        self.client = None
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=api_key)
                print("   ✓ Gemini API conectada exitosamente.")
            except Exception:
                pass

    def explicar(self, tipo_decision: str, detalle: str, ganancia: float, ahorro_tiempo: float) -> str:
        if self.client:
            try:
                prompt = f"Eres OptiGo, copiloto de IA. Explica en 1 frase tu decisión: {tipo_decision}. Detalle: {detalle}. Ganancia: ${ganancia}. Ahorro: {ahorro_tiempo} min."
                response = self.client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
                return response.text.strip()
            except Exception:
                pass

        if tipo_decision == "BATCH_ORTOOLS":
            return f"Agrupamos 2 pedidos para ahorrar {ahorro_tiempo} min y escalar la ganancia a ${ganancia:.1f}/hr."
        elif tipo_decision == "SURGE_LLUVIA":
            return f"Maximizamos el viaje local por tarifa dinámica extremando precaución climática."
        return detalle