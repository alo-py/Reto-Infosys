from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("apps.users.urls")),
    path("api/v1/shifts/", include("apps.simulation.urls")),
    path("api/v1/telemetry/", include("apps.telemetry.urls")),
]
