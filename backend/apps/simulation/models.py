import uuid
from django.conf import settings
from django.db import models

class BloqueTurno(models.Model):
    """
    Modela el sistema de planificación de turnos de las apps de delivery (Rappi/DiDi/Uber):
    - Reserva de slots por franjas horarias (Almuerzo, Cena, etc.).
    - Estados de conexión en tiempo real (Disponible, Pickup, En local, Delivery, Pausa).
    - Metas de bloque con bonos garantizados e indicadores de tasa de aceptación/finalización.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bloques_turno")

    MODALIDAD_CHOICES = [
        ("BLOQUE_RESERVADO", "Bloque Reservado (Scheduled Slot)"),
        ("CONEXION_LIBRE", "Conexión Libre (On-Demand)"),
    ]
    modalidad = models.CharField(max_length=25, choices=MODALIDAD_CHOICES, default="BLOQUE_RESERVADO")

    FRANJA_CHOICES = [
        ("DESAYUNO", "Desayuno (07:00 - 11:00)"),
        ("ALMUERZO", "Almuerzo Pico (12:00 - 16:00)"),
        ("CENA", "Cena Pico (19:00 - 23:00)"),
        ("MADRUGADA", "Madrugada (23:00 - 03:00)"),
        ("PERSONALIZADA", "Franja Libre Personalizada"),
    ]
    franja_horaria = models.CharField(max_length=20, choices=FRANJA_CHOICES, default="ALMUERZO")

    hora_inicio_programada = models.DateTimeField(null=True, blank=True)
    hora_fin_programada = models.DateTimeField(null=True, blank=True)
    duracion_programada_min = models.PositiveIntegerField(default=120, help_text="Duración en minutos (ej. 60, 120, 180)")
    minuto_progreso = models.PositiveIntegerField(default=0, help_text="Minuto actual en curso del bloque (0 a N)")
    zona_cobertura = models.CharField(max_length=100, default="Centro MTY (Barrio Antiguo)", help_text="Hotspot o zona asignada de inicio")

    ESTADO_TURNO_CHOICES = [
        ("PROGRAMADO", "Programado"),
        ("EN_CURSO", "En Curso"),
        ("PAUSADO", "En Pausa de Descanso"),
        ("FINALIZADO", "Finalizado"),
        ("CANCELADO", "Cancelado"),
    ]
    estado_turno = models.CharField(max_length=20, choices=ESTADO_TURNO_CHOICES, default="EN_CURSO")

    ESTADO_CONEXION_CHOICES = [
        ("DISPONIBLE", "Disponible / Esperando Órdenes"),
        ("EN_CAMINO_PICKUP", "En Camino a Restaurante"),
        ("EN_ESPERA_RESTAURANTE", "Esperando Preparación en Local"),
        ("EN_CAMINO_DELIVERY", "En Camino a Domicilio de Entrega"),
        ("EN_PAUSA", "Pausa Temporal de Conexión"),
        ("DESCONECTADO", "Desconectado"),
    ]
    estado_conexion = models.CharField(max_length=30, choices=ESTADO_CONEXION_CHOICES, default="DISPONIBLE")

    # Parámetros de Calidad y Cumplimiento de Apps de Delivery
    minutos_pausa_usados = models.PositiveIntegerField(default=0, help_text="Minutos acumulados en pausa (máx 20 min)")
    meta_pedidos_incentivo = models.PositiveIntegerField(default=5, help_text="Meta de entregas para bono de bloque")
    bono_garantizado_mxn = models.DecimalField(max_digits=8, decimal_places=2, default=80.0, help_text="Bono garantizado por completar la meta")
    tasa_aceptacion_pct = models.FloatField(default=100.0, help_text="Tasa de órdenes aceptadas")
    tasa_finalizacion_pct = models.FloatField(default=100.0, help_text="Tasa de entregas completadas con éxito")

    TIPO_AGENTE_CHOICES = [
        ("OPTIGO_AI", "OptiGo AI (Dual-Agent + OR-Tools)"),
        ("GREEDY", "Greedy Baseline (Tradicional)"),
    ]
    tipo_agente = models.CharField(max_length=20, choices=TIPO_AGENTE_CHOICES, default="OPTIGO_AI")

    # Métricas Financieras Acumuladas
    ganancia_neta_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    ingresos_brutos = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    gasto_gasolina_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)

    # Métricas Operativas y de SLA
    pedidos_completados = models.PositiveIntegerField(default=0)
    batches_realizados = models.PositiveIntegerField(default=0)
    pedidos_con_retraso = models.PositiveIntegerField(default=0)
    penalizaciones_sla_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    km_totales = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)
    km_en_vacio = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Bloque {self.franja_horaria} - {self.usuario.email} [{self.estado_turno}]"
