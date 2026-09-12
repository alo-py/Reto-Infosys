from django.db import models
from apps.simulation.models import BloqueTurno

class EstadoEntornoSnapshot(models.Model):
    """Instantánea minuto a minuto de la telemetría urbana (clima, tráfico, surge, cierres viales)."""
    turno = models.ForeignKey(BloqueTurno, on_delete=models.CASCADE, related_name="estados_entorno")
    minuto = models.PositiveIntegerField()
    hora_reloj = models.CharField(max_length=15)
    clima = models.CharField(max_length=100)
    temperatura_c = models.IntegerField()
    factor_trafico = models.FloatField()
    factor_surge = models.FloatField()
    avenida_cerrada = models.CharField(max_length=100, null=True, blank=True)
    zonas_afectadas = models.JSONField(default=list)

    class Meta:
        ordering = ["minuto"]
        indexes = [
            models.Index(fields=["turno", "minuto"]),
        ]

    def __str__(self):
        return f"Minuto {self.minuto} [{self.clima} | Surge {self.factor_surge}x]"

class Pedido(models.Model):
    """Catálogo y registro de pedidos de entrega con especificaciones de ruta y ventanas de tiempo."""
    order_id_externo = models.PositiveIntegerField()
    minuto_aparicion = models.PositiveIntegerField()
    minuto_deadline = models.PositiveIntegerField()
    zona_origen = models.CharField(max_length=100)
    zona_destino = models.CharField(max_length=100)
    solomon_demand = models.PositiveIntegerField(default=1)
    prep_time_min = models.PositiveIntegerField()
    distancia_km = models.DecimalField(max_digits=6, decimal_places=2)
    tiempo_viaje_min = models.DecimalField(max_digits=6, decimal_places=2)
    tarifa_base_mxn = models.DecimalField(max_digits=8, decimal_places=2)
    tarifa_final_mxn = models.DecimalField(max_digits=8, decimal_places=2)
    propina_mxn = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"Pedido #{self.order_id_externo} ({self.zona_origen} -> {self.zona_destino})"

class RegistroDecisionIA(models.Model):
    """Trazabilidad explicable de las deliberaciones y rutas de DeepSeek Dual-Agent y Google OR-Tools."""
    turno = models.ForeignKey(BloqueTurno, on_delete=models.CASCADE, related_name="decisiones_ia")
    minuto = models.PositiveIntegerField()
    tipo_agente = models.CharField(max_length=20, default="OPTIGO_AI")
    tipo_accion = models.CharField(max_length=30)  # BATCH_ORTOOLS, INDIVIDUAL, ESPERAR
    opcion_id = models.CharField(max_length=50)

    # Deliberación Dual DeepSeek
    propuesta_estratega = models.JSONField(default=dict)
    dictamen_supervisor = models.JSONField(default=dict)
    log_explicativo = models.TextField()

    # Telemetría de Ruta
    pedidos_ids = models.JSONField(default=list)
    ruta_secuencia = models.JSONField(default=list)
    ganancia_neta_proyectada = models.DecimalField(max_digits=8, decimal_places=2)
    tiempo_estimado_min = models.DecimalField(max_digits=6, decimal_places=2)
    distancia_total_km = models.DecimalField(max_digits=6, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["minuto"]
        indexes = [
            models.Index(fields=["turno", "minuto"]),
        ]

    def __str__(self):
        return f"Minuto {self.minuto} - {self.tipo_accion} ({self.opcion_id})"

class LiquidacionEntrega(models.Model):
    """Registro financiero de cada entrega con auditoría de SLA por puntualidad."""
    turno = models.ForeignKey(BloqueTurno, on_delete=models.CASCADE, related_name="liquidaciones")
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE)
    minuto_entrega = models.PositiveIntegerField()
    retraso_minutos = models.IntegerField()
    
    ESTADO_SLA_CHOICES = [
        ("A_TIEMPO", "A Tiempo"),
        ("RETRASO_MODERADO", "Retraso Moderado (>5m - Pérdida Propina)"),
        ("RETRASO_CRITICO", "Retraso Crítico (>15m - Multa Tarifa Base)"),
    ]
    estado_sla = models.CharField(max_length=30, choices=ESTADO_SLA_CHOICES)
    ingreso_final_mxn = models.DecimalField(max_digits=8, decimal_places=2)
    propina_cobrada_mxn = models.DecimalField(max_digits=8, decimal_places=2)
    penalizacion_sla_mxn = models.DecimalField(max_digits=8, decimal_places=2)
    gasolina_mxn = models.DecimalField(max_digits=8, decimal_places=2)
    ganancia_neta_mxn = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"Entrega #{self.pedido.order_id_externo} - SLA: {self.estado_sla} (${self.ganancia_neta_mxn} MXN)"
