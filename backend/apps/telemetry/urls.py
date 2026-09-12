from django.urls import path
from apps.telemetry.views import (
    EnvironmentHistoryView,
    DecisionHistoryView,
    LiquidationHistoryView,
)

urlpatterns = [
    path("shifts/<uuid:shift_id>/environment/", EnvironmentHistoryView.as_view(), name="shift-environment"),
    path("shifts/<uuid:shift_id>/decisions/", DecisionHistoryView.as_view(), name="shift-decisions"),
    path("shifts/<uuid:shift_id>/liquidations/", LiquidationHistoryView.as_view(), name="shift-liquidations"),
]
