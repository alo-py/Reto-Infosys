from rest_framework import serializers
from apps.users.models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            "id",
            "email",
            "nombre",
            "apellidos",
            "telefono",
            "tipo_vehiculo",
            "consumo_gasolina_km",
            "zona_base",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = [
            "id",
            "email",
            "password",
            "nombre",
            "apellidos",
            "telefono",
            "tipo_vehiculo",
            "consumo_gasolina_km",
            "zona_base",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)
