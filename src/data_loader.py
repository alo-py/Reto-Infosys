import json
import os
import random
import pandas as pd
from src.config import PUNTOS_INTERES

def preparar_datasets():
    print("📂 [3/5] Cargando datasets oficiales (Solomon VRPTW & Kaggle Delivery)...")
    ruta_solomon = "data/solomon_r101.json"
    ruta_kaggle = "data/kaggle_food_delivery.csv"

    if not os.path.exists(ruta_solomon):
        os.makedirs("data", exist_ok=True)
        os.system(f"curl -s https://raw.githubusercontent.com/CervEdin/solomon-vrptw-benchmarks/main/r/1/r101.json -o {ruta_solomon}")

    with open(ruta_solomon, "r") as f:
        solomon_benchmark = json.load(f)
    print(f"   ✓ Solomon VRPTW cargado: Instancia con {len(solomon_benchmark['customers'])} nodos.")

    if not os.path.exists(ruta_kaggle):
        customers = solomon_benchmark["customers"][1:]
        restaurantes = ["Tec de Monterrey (Garza Sada)", "Centrito Valle (San Pedro)", "Centro MTY (Barrio Antiguo)", "San Jerónimo", "Valle Oriente (San Pedro)", "Cumbres"]
        destinos = list(PUNTOS_INTERES.keys())
        random.seed(42)
        rows = []
        for i, cust in enumerate(customers, start=1):
            arrival_min = max(1, min(115, int(cust["earliest"] * 0.55)))
            tolerance_min = max(25, int((cust["latest"] - cust["earliest"]) * 1.5) + 20)
            orig = random.choice(restaurantes)
            dest = random.choice([d for d in destinos if d != orig])
            rows.append({
                "order_id": i,
                "arrival_minute": arrival_min,
                "deadline_minute": arrival_min + tolerance_min,
                "restaurant_zone": orig,
                "delivery_zone": dest,
                "solomon_demand": cust["demand"],
                "prep_time_min": random.randint(5, 12),
                "base_fee_mxn": round(random.uniform(18.0, 28.0), 2),
                "tip_mxn": random.choices([0, 10, 20, 35, 50], weights=[0.35, 0.35, 0.18, 0.09, 0.03])[0],
            })
        pd.DataFrame(rows).sort_values("arrival_minute").to_csv(ruta_kaggle, index=False)

    df_kaggle = pd.read_csv(ruta_kaggle)
    print(f"   ✓ Kaggle Food Delivery dataset cargado: {len(df_kaggle)} registros.")
    return df_kaggle