import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar automáticamente variables de entorno desde backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class ExplicadorOptiGo:
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
                print("   ✓ DeepSeek API conectada exitosamente (modelo: deepseek-chat).")
            except Exception as e:
                print(f"   ⚠️ Error al inicializar cliente DeepSeek: {e}")

    def explicar(self, tipo_decision: str, detalle: str, ganancia: float, ahorro_tiempo: float) -> str:
        if self.client:
            try:
                prompt = (
                    f"Eres OptiGo, copiloto de IA para repartidores en Monterrey. "
                    f"Explica en una sola frase breve y profesional tu decisión: {tipo_decision}. "
                    f"Detalle operativo: {detalle}. Ganancia: ${ganancia:.2f}. Ahorro: {ahorro_tiempo:.1f} min."
                )
                response = self.client.chat.completions.create(
                    model=self.modelo,
                    messages=[
                        {"role": "system", "content": "Eres un asistente y copiloto inteligente de logística urbana de última milla."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=80,
                    temperature=0.6
                )
                if response.choices and len(response.choices) > 0:
                    return response.choices[0].message.content.strip()
            except Exception as e:
                # Log discreto de error y caída a fallback seguro
                pass

        if tipo_decision == "BATCH_ORTOOLS":
            return f"Agrupamos 2 pedidos para ahorrar {ahorro_tiempo:.1f} min y escalar la ganancia a ${ganancia:.1f}/hr."
        elif tipo_decision == "SURGE_LLUVIA":
            return f"Maximizamos el viaje local por tarifa dinámica extremando precaución climática."
        return detalle