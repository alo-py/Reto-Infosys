# Contexto del Sistema: Arquitectura del Backend OptiGo

## 1. Visión General
OptiGo es un simulador de backend basado en Python diseñado para evaluar el rendimiento de agentes de enrutamiento estocástico en un entorno de entrega de alimentos (Food Delivery) en Monterrey. El sistema contrasta un agente tradicional (Greedy) contra un agente impulsado por IA (OptiGo AI) que utiliza optimización combinatoria (Google OR-Tools) y Modelos de Lenguaje (Gemini) para maximizar la rentabilidad neta por hora.

## 2. Arquitectura de Módulos (`src/`)
El backend está construido con un enfoque modular, eliminando variables globales y utilizando inyección de dependencias en el orquestador principal.

* **`config.py`**: Fuente única de verdad. Almacena catálogos estáticos (coordenadas de Puntos de Interés, diccionarios de probabilidad climática, modificadores de tráfico y rutas de impacto por avenidas cerradas).
* **`models.py`**: Define las estructuras de datos inmutables del sistema usando `@dataclass` (e.g., `EstadoEntorno`, `Pedido`, `EventoLluvia`). Previene dependencias circulares.
* **`routing.py`**: Capa de inteligencia geoespacial. Utiliza `osmnx` para construir el grafo vial, calcular las rutas más rápidas considerando restricciones de tráfico, y generar matrices dinámicas de desvío cuando ocurren incidentes viales.
* **`data_loader.py`**: Capa de ingesta. Convierte el benchmark Solomon VRPTW y genera un flujo (stream) sintético de pedidos locales con variables financieras reales (tarifa base reducida, gasolina, propinas, tiempos de preparación).
* **`environment.py`**: Motor estocástico (`MotorEntorno`). Genera y administra el estado del mundo en tiempo real. Aplica modificadores de hora pico, clima y accidentes viales de forma dinámica.
* **`optimization.py`**: Encapsula el solver matemático. Usa `ortools` para resolver problemas PDPTW (Pickup and Delivery Problem with Time Windows), determinando secuencias óptimas para agrupar múltiples pedidos (*batching*).
* **`ai.py`**: Interfaz de Modelos de Lenguaje. Conecta con la API de Gemini (`ExplicadorOptiGo`) para traducir la telemetría y las decisiones matemáticas del agente en lenguaje natural explicable.
* **`agents.py`**: Contiene la lógica de toma de decisiones (`Repartidor`). Define los algoritmos de aceptación/rechazo de pedidos (Greedy secuencial vs. Filtro Anti-Deadhead + Batching de IA).

## 3. Flujo de Ejecución (Ciclo de Vida)
El archivo raíz `main.py` actúa como el orquestador principal bajo un patrón de simulación de eventos discretos a lo largo de un turno de 120 minutos:

1. **Inicialización (Bootstrapping):** Se carga el grafo de la ciudad, se pre-calculan las matrices de tiempos (incluyendo matrices alternativas si el pronóstico indica avenidas cerradas) y se carga el stream de pedidos en memoria.
2. **Ciclo de Simulación (Minuto a Minuto):**
   * El orquestador avanza el reloj de $t=1$ a $t=120$.
   * **Estado del Mundo:** Se consulta a `environment.py` para obtener los modificadores climáticos y de tráfico exactos para el minuto $t$.
   * **Actualización del Mercado:** Se inyectan las nuevas órdenes disponibles en el minuto $t$ al "pool" de ofertas activas. Las ofertas expiran después de 4 minutos o si se supera el deadline del cliente.
   * **Toma de Decisiones:** El orquestador inyecta el pool de órdenes y las matrices de viaje actualizadas a los agentes. Los agentes evalúan la viabilidad temporal y la rentabilidad ($/hr) antes de aceptar.
   * **Avance de Estado:** Cuando un agente acepta una orden, su estado de disponibilidad (`disponible_en_minuto`) se bloquea temporalmente considerando el tiempo de viaje, tiempos muertos en restaurantes y tiempo de entrega en la puerta.
3. **Cierre:** Al finalizar el ciclo, se calcula el balance financiero (Ingresos Brutos - Gasto de Combustible) y se compara la eficiencia operativa por kilómetro recorrido.

## 4. Stack Tecnológico Principal
* **OSMnx / NetworkX:** Manipulación de grafos viales y cálculo de rutas geográficas reales.
* **Google OR-Tools:** Resolución de problemas de ruteo de vehículos (VRPTW).
* **Pandas:** Manipulación y transformación del stream de datos transaccionales.
* **Google GenAI SDK:** Generación de explicabilidad en tiempo de ejecución.