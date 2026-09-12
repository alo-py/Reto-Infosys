from rest_framework import serializers
from apps.telemetry.models import (
    EstadoEntornoSnapshot,
    Pedido,
    RegistroDecisionIA,
    LiquidacionEntrega,
)

class EstadoEntornoSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoEntornoSnapshot
        fields = "__all__"

class PedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = "__all__"

class RegistroDecisionIASerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroDecisionIA
        fields = "__all__"

class LiquidacionEntregaSerializer(serializers.ModelSerializer):
    pedido_detalle = PedidoSerializer(source="pedido", read_only=True)

    class Meta:
        model = LiquidacionEntrega
        fields = "__all__"
