from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.users.models import Usuario
from apps.simulation.models import BloqueTurno
from apps.simulation.serializers import BloqueTurnoSerializer, IniciarBloqueSerializer
from apps.simulation.services import ShiftExecutionService

class StartShiftView(generics.CreateAPIView):
    serializer_class = IniciarBloqueSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Associating with authenticated user or default demo driver user
        user = request.user if (request.user and request.user.is_authenticated) else Usuario.objects.first()
        if not user:
            user = Usuario.objects.create(email="driver@optigo.ai", nombre="OptiGo Driver")

        duracion = serializer.validated_data.get("duracion_programada_min", 120)
        bloque = serializer.save(
            usuario=user,
            hora_inicio_programada=timezone.now(),
            hora_fin_programada=timezone.now() + timezone.timedelta(minutes=duracion),
            estado_turno="EN_CURSO",
            estado_conexion="DISPONIBLE"
        )
        return Response(BloqueTurnoSerializer(bloque).data, status=status.HTTP_201_CREATED)

class ShiftStepView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        bloque = get_object_or_404(BloqueTurno, pk=pk)
        minutos = int(request.data.get("minutos", 1))
        
        service = ShiftExecutionService(bloque)
        resultado = service.ejecutar_paso(minutos_avance=minutos)
        
        return Response({
            "progreso": resultado,
            "turno": BloqueTurnoSerializer(bloque).data
        }, status=status.HTTP_200_OK)

class ShiftDetailView(generics.RetrieveAPIView):
    queryset = BloqueTurno.objects.all()
    serializer_class = BloqueTurnoSerializer
    permission_classes = [permissions.AllowAny]

class ShiftEndView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        bloque = get_object_or_404(BloqueTurno, pk=pk)
        bloque.estado_turno = "FINALIZADO"
        bloque.estado_conexion = "DESCONECTADO"
        bloque.save()
        return Response(BloqueTurnoSerializer(bloque).data, status=status.HTTP_200_OK)
