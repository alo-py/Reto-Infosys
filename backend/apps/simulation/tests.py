from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import Usuario
from apps.simulation.models import BloqueTurno
from apps.telemetry.models import EstadoEntornoSnapshot

class OptiGoAPITestCase(APITestCase):
    def setUp(self):
        # Crear usuario repartidor de prueba
        self.user = Usuario.objects.create_user(
            email="repartidor.mty@optigo.mx",
            password="Password123!",
            nombre="Carlos",
            apellidos="González",
            tipo_vehiculo="MOTO",
            consumo_gasolina_km=0.90,
            zona_base="Centro MTY (Barrio Antiguo)"
        )

    def test_auth_login_and_profile(self):
        """Verifica login con JWT y obtención de perfil."""
        login_url = reverse("token_obtain_pair")
        res = self.client.post(login_url, {"email": "repartidor.mty@optigo.mx", "password": "Password123!"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

        # Usar token para perfil
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        me_url = reverse("auth-profile")
        res_me = self.client.get(me_url)
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.data["email"], "repartidor.mty@optigo.mx")
        self.assertEqual(res_me.data["tipo_vehiculo"], "MOTO")

    def test_shift_lifecycle_and_telemetry(self):
        """Verifica inicio de turno, avance de pasos y registro de telemetría."""
        self.client.force_authenticate(user=self.user)

        # 1. Iniciar Bloque de Turno (Almuerzo 120 min)
        start_url = reverse("shift-start")
        payload = {
            "modalidad": "BLOQUE_RESERVADO",
            "franja_horaria": "ALMUERZO",
            "duracion_programada_min": 120,
            "zona_cobertura": "Centro MTY (Barrio Antiguo)",
            "tipo_agente": "OPTIGO_AI",
            "meta_pedidos_incentivo": 5,
            "bono_garantizado_mxn": 80.0
        }
        res_start = self.client.post(start_url, payload, format="json")
        self.assertEqual(res_start.status_code, status.HTTP_201_CREATED)
        shift_id = res_start.data["id"]
        self.assertEqual(res_start.data["estado_turno"], "EN_CURSO")

        # 2. Consultar detalle del turno
        detail_url = reverse("shift-detail", kwargs={"pk": shift_id})
        res_detail = self.client.get(detail_url)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data["minuto_progreso"], 0)

        # 3. Finalizar turno
        end_url = reverse("shift-end", kwargs={"pk": shift_id})
        res_end = self.client.post(end_url)
        self.assertEqual(res_end.status_code, status.HTTP_200_OK)
        self.assertEqual(res_end.data["estado_turno"], "FINALIZADO")
        self.assertEqual(res_end.data["estado_conexion"], "DESCONECTADO")
