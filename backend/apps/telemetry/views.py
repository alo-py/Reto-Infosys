from rest_framework import generics, permissions
from apps.telemetry.models import EstadoEntornoSnapshot, RegistroDecisionIA, LiquidacionEntrega
from apps.telemetry.serializers import (
    EstadoEntornoSnapshotSerializer,
    RegistroDecisionIASerializer,
    LiquidacionEntregaSerializer,
)

class EnvironmentHistoryView(generics.ListAPIView):
    serializer_class = EstadoEntornoSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        turno_id = self.kwargs["shift_id"]
        return EstadoEntornoSnapshot.objects.filter(turno__id=turno_id, turno__usuario=self.request.user)

class DecisionHistoryView(generics.ListAPIView):
    serializer_class = RegistroDecisionIASerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        turno_id = self.kwargs["shift_id"]
        return RegistroDecisionIA.objects.filter(turno__id=turno_id, turno__usuario=self.request.user)

class LiquidationHistoryView(generics.ListAPIView):
    serializer_class = LiquidacionEntregaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        turno_id = self.kwargs["shift_id"]
        return LiquidacionEntrega.objects.filter(turno__id=turno_id, turno__usuario=self.request.user)
