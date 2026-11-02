from django.urls import path
from .views import (
    CatalogoInventarioView,
    SyncBatchPedidosView,
    SubirComprobanteView,
    AcelerarFiniquitoView
)

urlpatterns = [
    path('inventario/catalogo/', CatalogoInventarioView.as_view(), name='catalogo_inventario'),
    path('transacciones/sync-batch/', SyncBatchPedidosView.as_view(), name='sync_batch_pedidos'),
    path('pedidos/<str:folio_unico_qr>/comprobante/', SubirComprobanteView.as_view(), name='subir_comprobante'),
    path('finanzas/pedidos/<str:folio>/acelerar-finiquito/', AcelerarFiniquitoView.as_view(), name='acelerar_finiquito'),
]