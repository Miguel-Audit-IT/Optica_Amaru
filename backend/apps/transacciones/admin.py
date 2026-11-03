from django.contrib import admin
from .models import (
    ArmazonInventario,
    SolicitudEntrega,
    MovimientoStock,
    Presupuesto,
    CuotaDescuento,
    DocumentoRespaldo,
    RecepcionDespacho,
)

@admin.register(ArmazonInventario)
class ArmazonInventarioAdmin(admin.ModelAdmin):
    list_display = ('sku_armazon', 'modelo_lente', 'stock_disponible', 'precio_clp')
    search_fields = ('sku_armazon', 'modelo_lente')

@admin.register(SolicitudEntrega)
class SolicitudEntregaAdmin(admin.ModelAdmin):
    list_display = ('folio_unico_qr', 'rut_paciente', 'sku_armazon', 'estado_pedido', 'version_seq', 'fecha_ingreso')
    list_filter = ('estado_pedido',)
    search_fields = ('folio_unico_qr', 'rut_paciente__rut')

@admin.register(Presupuesto)
class PresupuestoAdmin(admin.ModelAdmin):
    list_display = ('id_presupuesto', 'folio_unico_qr', 'monto_total', 'clausula_aceleracion_aceptada')

@admin.register(CuotaDescuento)
class CuotaDescuentoAdmin(admin.ModelAdmin):
    list_display = ('id_presupuesto', 'numero_cuota', 'monto_cuota', 'mes_ejecucion', 'estado_pago')
    list_filter = ('estado_pago',)

admin.site.register(MovimientoStock)
admin.site.register(DocumentoRespaldo)
admin.site.register(RecepcionDespacho)