import uuid
from django.db import models


class Usuario(models.Model):
    rut_usuario = models.CharField(max_length=12, primary_key=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    correo_electronico = models.EmailField(max_length=150, unique=True)
    contrasena_hash = models.CharField(max_length=255)
    creado_el = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self) -> str:
        return f"{self.rut_usuario} - {self.nombres} {self.apellidos}"


class PersonalOptica(models.Model):
    class RolSistema(models.TextChoices):
        ADMIN = 'Admin', 'Admin'
        OPERADOR = 'Operador', 'Operador'
        BODEGA = 'Bodega', 'Bodega'
        AUDITOR = 'Auditor', 'Auditor'

    rut_usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='rut_usuario',
        related_name='personal_optica'
    )
    rol_sistema = models.CharField(
        max_length=20,
        choices=RolSistema.choices
    )

    class Meta:
        db_table = 'personal_optica'
        verbose_name = 'Personal de Óptica'
        verbose_name_plural = 'Personal de Óptica'

    def __str__(self) -> str:
        return f"{self.rut_usuario_id} ({self.rol_sistema})"


class EmpresaConvenio(models.Model):
    id_empresa = models.AutoField(primary_key=True)
    razon_social = models.CharField(max_length=150)
    rut_empresa = models.CharField(max_length=12, unique=True)
    convenio_vigente = models.BooleanField(default=True)

    class Meta:
        db_table = 'empresa_convenio'
        verbose_name = 'Empresa en Convenio'
        verbose_name_plural = 'Empresas en Convenio'

    def __str__(self) -> str:
        return f"{self.razon_social} ({self.rut_empresa})"


class Paciente(models.Model):
    class TipoCliente(models.TextChoices):
        PARTICULAR = 'Particular', 'Particular'
        CONVENIO = 'Convenio', 'Convenio'

    rut_usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='rut_usuario',
        related_name='paciente'
    )
    tipo_cliente = models.CharField(
        max_length=20,
        choices=TipoCliente.choices
    )
    id_empresa = models.ForeignKey(
        EmpresaConvenio,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_empresa',
        related_name='pacientes'
    )
    consentimiento_biometrico = models.BooleanField(default=False)

    class Meta:
        db_table = 'paciente'
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'

    def __str__(self) -> str:
        return f"Paciente {self.rut_usuario_id} [{self.tipo_cliente}]"


class TitularPago(models.Model):
    class EstadoLaboral(models.TextChoices):
        ACTIVO = 'Activo', 'Activo'
        DESVINCULADO = 'Desvinculado', 'Desvinculado'
        LICENCIA = 'Licencia', 'Licencia'

    rut_titular = models.CharField(max_length=12, primary_key=True)
    nombre_completo = models.CharField(max_length=150)
    id_empresa = models.ForeignKey(
        EmpresaConvenio,
        on_delete=models.PROTECT,
        db_column='id_empresa',
        related_name='titulares_pago'
    )
    cupo_disponible = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )
    estado_laboral = models.CharField(
        max_length=20,
        choices=EstadoLaboral.choices,
        default=EstadoLaboral.ACTIVO
    )
    fecha_actualizacion_padron = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'titular_pago'
        verbose_name = 'Titular de Pago'
        verbose_name_plural = 'Titulares de Pago'

    def __str__(self) -> str:
        return f"{self.rut_titular} - {self.nombre_completo} (${self.cupo_disponible})"


class LoteNominaSindicato(models.Model):
    id_lote = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    id_empresa = models.ForeignKey(
        EmpresaConvenio,
        on_delete=models.PROTECT,
        db_column='id_empresa',
        related_name='lotes_nomina'
    )
    rut_responsable_carga = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        db_column='rut_responsable_carga',
        related_name='nominas_cargadas'
    )
    total_registros = models.IntegerField()
    hash_archivo_sha256 = models.CharField(max_length=64)
    fecha_carga = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lote_nomina_sindicato'
        verbose_name = 'Lote Nómina Sindicato'
        verbose_name_plural = 'Lotes Nóminas Sindicato'

    def __str__(self) -> str:
        return f"Lote {self.id_lote} ({self.total_registros} registros)"