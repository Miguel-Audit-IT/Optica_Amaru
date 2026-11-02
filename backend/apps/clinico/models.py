import uuid
from django.db import models
from apps.autenticacion.models import Paciente


class RecetaOptica(models.Model):
    id_receta = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    rut_paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        db_column='rut_paciente',
        related_name='recetas'
    )
    fecha_emision = models.DateField()
    parametros_oftalmologicos = models.JSONField()
    archivo_url = models.CharField(max_length=500, null=True, blank=True)
    version_seq = models.IntegerField(default=1)

    class Meta:
        db_table = 'receta_optica'
        verbose_name = 'Receta Óptica'
        verbose_name_plural = 'Recetas Ópticas'

    def __str__(self) -> str:
        return f"Receta {self.id_receta} - Paciente: {self.rut_paciente_id} (v{self.version_seq})"


class ReservaHora(models.Model):
    class EstadoReserva(models.TextChoices):
        PENDIENTE = 'Pendiente', 'Pendiente'
        CONFIRMADA = 'Confirmada', 'Confirmada'
        ATENDIDO = 'Atendido', 'Atendido'
        CANCELADA = 'Cancelada', 'Cancelada'

    id_reserva = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    rut_paciente = models.ForeignKey(
        Paciente,
        on_delete=models.PROTECT,
        db_column='rut_paciente',
        related_name='reservas_horas'
    )
    fecha_hora_reserva = models.DateTimeField()
    estado_reserva = models.CharField(
        max_length=20,
        choices=EstadoReserva.choices,
        default=EstadoReserva.PENDIENTE
    )

    class Meta:
        db_table = 'reserva_hora'
        verbose_name = 'Reserva de Hora'
        verbose_name_plural = 'Reservas de Horas'

    def __str__(self) -> str:
        return f"Reserva {self.id_reserva} - {self.rut_paciente_id} [{self.estado_reserva}]"