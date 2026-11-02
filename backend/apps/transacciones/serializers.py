from rest_framework import serializers
from .models import (
    ArmazonInventario,
    SolicitudEntrega,
    Presupuesto,
    CuotaDescuento,
    DocumentoRespaldo,
    RecepcionDespacho
)


class ArmazonCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArmazonInventario
        fields = [
            'sku_armazon',
            'modelo_lente',
            'caracteristicas_tecnicas',
            'certificaciones_multiples',
            'stock_disponible',
            'precio_clp'
        ]


class CuotaDescuentoInputSerializer(serializers.Serializer):
    numero_cuota = serializers.IntegerField(min_value=1)
    monto_cuota = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    mes_ejecucion = serializers.DateField()


class SolicitudSyncItemSerializer(serializers.Serializer):
    folio_unico_qr = serializers.CharField(max_length=100)
    rut_paciente = serializers.CharField(max_length=12)
    id_receta = serializers.UUIDField(required=False, allow_null=True)
    sku_armazon = serializers.CharField(max_length=50)
    rut_titular_pago = serializers.CharField(max_length=12, required=False, allow_null=True)
    version_seq = serializers.IntegerField(default=1)
    monto_total = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    cuotas = CuotaDescuentoInputSerializer(many=True, required=False, default=list)


class SyncBatchInputSerializer(serializers.Serializer):
    pedidos = SolicitudSyncItemSerializer(many=True)


class ComprobanteUploadSerializer(serializers.Serializer):
    archivo = serializers.FileField()


class AcelerarFiniquitoSerializer(serializers.Serializer):
    rut_solicitante = serializers.CharField(max_length=12)