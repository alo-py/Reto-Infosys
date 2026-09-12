from rest_framework import serializers
from apps.simulation.models import BloqueTurno
from apps.telemetry.serializers import (
    EstadoEntornoSnapshotSerializer,
    RegistroDecisionIASerializer,
    LiquidacionEntregaSerializer,
)

class BloqueTurnoSerializer(serializers.ModelSerializer):
    ultimas_decisiones = serializers.SerializerMethodField()
    ultimo_estado_entorno = serializers.SerializerMethodField()

    class Meta:
        model = BloqueTurno
        fields = "__all__"
        read_only_fields = ["id", "usuario", "created_at", "updated_at"]

    def get_ultimas_decisiones(self, obj):
        decisiones = obj.decisiones_ia.order_by("-minuto")[:5]
        return RegistroDecisionIASerializer(decisiones, many=True).data

    def get_ultimo_estado_entorno(self, obj):
        estado = obj.estados_entorno.order_by("-minuto").first()
        if estado:
            return EstadoEntornoSnapshotSerializer(estado).data
        return None

class IniciarBloqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloqueTurno
        fields = [
            "modalidad",
            "franja_horaria",
            "duracion_programada_min",
            "zona_cobertura",
            "tipo_agente",
            "meta_pedidos_incentivo",
            "bono_garantizado_mxn",
        ]
