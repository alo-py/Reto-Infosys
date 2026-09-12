from django.urls import path
from apps.simulation.views import (
    StartShiftView,
    ShiftStepView,
    ShiftDetailView,
    ShiftEndView,
)

urlpatterns = [
    path("start/", StartShiftView.as_view(), name="shift-start"),
    path("<uuid:pk>/", ShiftDetailView.as_view(), name="shift-detail"),
    path("<uuid:pk>/step/", ShiftStepView.as_view(), name="shift-step"),
    path("<uuid:pk>/end/", ShiftEndView.as_view(), name="shift-end"),
]
