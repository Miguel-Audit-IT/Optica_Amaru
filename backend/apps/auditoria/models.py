from django.db import models
from apps.autenticacion.models import Usuario


class RegistroAuditoria(models.Model):
    id_evento = models.BigAutoField(primary_key=True)
    rut_usuario_accion = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        db_column='rut_usuario_accion',
        related_name='registros_auditoria'
    )
    accion_realizada = models.CharField(max_length=255)
    hash_integridad_sha256 = models.CharField(max_length=64)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'registro_auditoria'
        verbose_name = 'Registro de Auditoría'
        verbose_name_plural = 'Registros de Auditoría'

    def __str__(self) -> str:
        return f"Evento {self.id_evento} - {self.rut_usuario_accion_id} [{self.hash_integridad_sha256[:8]}]"