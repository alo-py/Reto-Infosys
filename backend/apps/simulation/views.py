from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.simulation.models import BloqueTurno
from apps.simulation.serializers import BloqueTurnoSerializer, IniciarBloqueSerializer
from apps.simulation.services import ShiftExecutionService

class StartShiftView(generics.CreateAPIView):
    serializer_class = IniciarBloqueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Crear bloque de turno asociado al usuario autenticado
        bloque = serializer.save(
            usuario=request.user,
            hora_inicio_programada=timezone.now(),
            hora_fin_programada=timezone.now() + timezone.timedelta(minutes=serializer.validated_data.get("duracion_programada_min", 120)),
            estado_turno="EN_CURSO",
            estado_conexion="DISPONIBLE"
        )
        return Response(BloqueTurnoSerializer(bloque).data, status=status.HTTP_201_CREATED)

class ShiftStepView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        bloque = get_object_or_404(BloqueTurno, pk=pk, usuario=request.user)
        minutos = int(request.data.get("minutos", 5))
        
        service = ShiftExecutionService(bloque)
        resultado = service.ejecutar_paso(minutos_avance=minutos)
        
        return Response({
            "progreso": resultado,
            "turno": BloqueTurnoSerializer(bloque).data
        }, status=status.HTTP_200_OK)

class ShiftDetailView(generics.RetrieveAPIView):
    queryset = BloqueTurno.objects.all()
    serializer_class = BloqueTurnoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BloqueTurno.objects.filter(usuario=self.request.user)

class ShiftEndView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        bloque = get_object_or_404(BloqueTurno, pk=pk, usuario=request.user)
        bloque.estado_turno = "FINALIZADO"
        bloque.estado_conexion = "DESCONECTADO"
        bloque.save()
        return Response(BloqueTurnoSerializer(bloque).data, status=status.HTTP_200_OK)
