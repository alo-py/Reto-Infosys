import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El correo electrónico es obligatorio.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)

class Usuario(AbstractUser):
    username = None  # Deshabilitar username tradicional en favor de email
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("Correo electrónico", unique=True)
    nombre = models.CharField("Nombre", max_length=150)
    apellidos = models.CharField("Apellidos", max_length=150)
    telefono = models.CharField("Teléfono", max_length=20, blank=True)

    TIPO_VEHICULO_CHOICES = [
        ("MOTO", "Motocicleta"),
        ("BICI", "Bicicleta"),
        ("AUTO", "Automóvil"),
    ]
    tipo_vehiculo = models.CharField("Tipo de Vehículo", max_length=20, choices=TIPO_VEHICULO_CHOICES, default="MOTO")
    consumo_gasolina_km = models.DecimalField("Costo Combustible ($/km)", max_digits=5, decimal_places=2, default=0.90)
    zona_base = models.CharField("Zona Base", max_length=100, default="Centro MTY (Barrio Antiguo)")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nombre", "apellidos"]
    objects = CustomUserManager()

    def __str__(self):
        return f"{self.nombre} {self.apellidos} ({self.email})"
