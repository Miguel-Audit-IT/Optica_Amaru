import uuid
from django.db import models
from apps.autenticacion.models import Paciente, TitularPago
from apps.clinico.models import RecetaOptica


class ArmazonInventario(models.Model):
    sku_armazon = models.CharField(max_length=50, primary_key=True)
    modelo_lente = models.CharField(max_length=100)
    caracteristicas_tecnicas = models.JSONField(default=dict)
    certificaciones_multiples = models.JSONField(default=list)
    stock_disponible = models.IntegerField()
    precio_clp = models.IntegerField(default=0)

    class Meta:
        db_table = 'armazon_inventario'
        verbose_name = 'Armazón en Inventario'
        verbose_name_plural = 'Armazones en Inventario'

    def __str__(self) -> str:
        return f"{self.sku_armazon} - {self.modelo_lente} (Stock: {self.stock_disponible})"


class SolicitudEntrega(models.Model):
    class EstadoPedido(models.TextChoices):
        RECIBIDA = 'Recibida', 'Recibida'
        PENDIENTE_RESPALDO = 'Pendiente_Respaldo', 'Pendiente_Respaldo'
        EN_FABRICACION = 'En_Fabricacion', 'En_Fabricacion'
        TRANSITO = 'Transito', 'Transito'
        LISTA = 'Lista', 'Lista'
        ENTREGADA = 'Entregada', 'Entregada'
        RETENCION_LABORAL = 'Retencion_Laboral', 'Retencion_Laboral'
        CERRADA = 'Cerrada', 'Cerrada'

    folio_unico_qr = models.CharField(max_length=100, primary_key=True)
    rut_paciente = models.ForeignKey(
        Paciente,
        on_delete=models.PROTECT,
        db_column='rut_paciente',
        related_name='solicitudes'
    )
    id_receta = models.ForeignKey(
        RecetaOptica,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_receta',
        related_name='solicitudes'
    )
    sku_armazon = models.ForeignKey(
        ArmazonInventario,
        on_delete=models.PROTECT,
        db_column='sku_armazon',
        related_name='solicitudes'
    )
    rut_titular_pago = models.ForeignKey(
        TitularPago,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='rut_titular_pago',
        related_name='solicitudes_afectas'
    )
    estado_pedido = models.CharField(
        max_length=30,
        choices=EstadoPedido.choices,
        default=EstadoPedido.RECIBIDA
    )
    version_seq = models.IntegerField(default=1)
    fecha_ingreso = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'solicitud_entrega'
        verbose_name = 'Solicitud de Entrega'
        verbose_name_plural = 'Solicitudes de Entrega'

    def __str__(self) -> str:
        return f"Pedido {self.folio_unico_qr} [{self.estado_pedido}]"


class MovimientoStock(models.Model):
    class TipoMovimiento(models.TextChoices):
        VENTA_DIRECTA = 'VENTA_DIRECTA', 'VENTA_DIRECTA'
        CONVENIO = 'CONVENIO', 'CONVENIO'
        DEVOLUCION_GARANTIA = 'DEVOLUCION_GARANTIA', 'DEVOLUCION_GARANTIA'
        AJUSTE_ENTRADA = 'AJUSTE_ENTRADA', 'AJUSTE_ENTRADA'
        MERMA = 'MERMA', 'MERMA'

    id_movimiento = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    sku_armazon = models.ForeignKey(
        ArmazonInventario,
        on_delete=models.PROTECT,
        db_column='sku_armazon',
        related_name='movimientos'
    )
    folio_unico_qr = models.ForeignKey(
        SolicitudEntrega,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='folio_unico_qr',
        related_name='movimientos_stock'
    )
    tipo_movimiento = models.CharField(
        max_length=20,
        choices=TipoMovimiento.choices
    )
    cantidad = models.IntegerField()
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'movimiento_stock'
        verbose_name = 'Movimiento de Stock'
        verbose_name_plural = 'Movimientos de Stock'

    def __str__(self) -> str:
        return f"{self.tipo_movimiento} ({self.cantidad}) - SKU {self.sku_armazon_id}"


class Presupuesto(models.Model):
    id_presupuesto = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    folio_unico_qr = models.OneToOneField(
        SolicitudEntrega,
        on_delete=models.CASCADE,
        db_column='folio_unico_qr',
        related_name='presupuesto'
    )
    monto_total = models.DecimalField(max_digits=12, decimal_places=2)
    clausula_aceleracion_aceptada = models.BooleanField(default=True)

    class Meta:
        db_table = 'presupuesto'
        verbose_name = 'Presupuesto'
        verbose_name_plural = 'Presupuestos'

    def __str__(self) -> str:
        return f"Presupuesto {self.id_presupuesto} - ${self.monto_total}"


class CuotaDescuento(models.Model):
    class EstadoPago(models.TextChoices):
        PENDIENTE = 'Pendiente', 'Pendiente'
        PAGADO = 'Pagado', 'Pagado'
        MORA = 'Mora', 'Mora'
        COBRADO_FINIQUITO = 'Cobrado_Finiquito', 'Cobrado_Finiquito'
        RETENCION_PENDIENTE = 'Retencion_Pendiente', 'Retencion_Pendiente'

    id_cuota = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    id_presupuesto = models.ForeignKey(
        Presupuesto,
        on_delete=models.CASCADE,
        db_column='id_presupuesto',
        related_name='cuotas'
    )
    numero_cuota = models.IntegerField()
    monto_cuota = models.DecimalField(max_digits=12, decimal_places=2)
    mes_ejecucion = models.DateField()
    estado_pago = models.CharField(
        max_length=25,
        choices=EstadoPago.choices,
        default=EstadoPago.PENDIENTE
    )

    class Meta:
        db_table = 'cuota_descuento'
        verbose_name = 'Cuota de Descuento'
        verbose_name_plural = 'Cuotas de Descuento'
        constraints = [
            models.UniqueConstraint(
                fields=['id_presupuesto', 'numero_cuota'],
                name='uq_presupuesto_cuota'
            )
        ]

    def __str__(self) -> str:
        return f"Cuota {self.numero_cuota} ({self.estado_pago}) - ${self.monto_cuota}"


class DocumentoRespaldo(models.Model):
    id_documento = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    folio_unico_qr = models.OneToOneField(
        SolicitudEntrega,
        on_delete=models.CASCADE,
        db_column='folio_unico_qr',
        related_name='documento_respaldo'
    )
    url_imagen_s3 = models.CharField(max_length=500)
    validado_taller = models.BooleanField(default=False)

    class Meta:
        db_table = 'documento_respaldo'
        verbose_name = 'Documento de Respaldo'
        verbose_name_plural = 'Documentos de Respaldo'

    def __str__(self) -> str:
        return f"Respaldo {self.id_documento} - Folio {self.folio_unico_qr_id}"


class RecepcionDespacho(models.Model):
    class TipoReceptor(models.TextChoices):
        TITULAR = 'Titular', 'Titular'
        TERCERO_AUTORIZADO = 'Tercero_Autorizado', 'Tercero_Autorizado'

    id_recepcion = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    folio_unico_qr = models.OneToOneField(
        SolicitudEntrega,
        on_delete=models.PROTECT,
        db_column='folio_unico_qr',
        related_name='recepcion_despacho'
    )
    tipo_receptor = models.CharField(
        max_length=20,
        choices=TipoReceptor.choices
    )
    rut_receptor = models.CharField(max_length=12)
    codigo_barras_pdf417_leido = models.CharField(max_length=255)
    fecha_entrega = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recepcion_despacho'
        verbose_name = 'Recepción y Despacho'
        verbose_name_plural = 'Recepciones y Despachos'

    def __str__(self) -> str:
        return f"Recepción {self.folio_unico_qr_id} por {self.rut_receptor}"