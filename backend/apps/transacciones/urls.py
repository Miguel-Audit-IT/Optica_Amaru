from django.urls import path
from .views import (
    CatalogoInventarioView,
    SyncBatchPedidosView,
    SubirComprobanteView,
    AcelerarFiniquitoView,
    AcelerarFiniquitoPDFView,
    ComprobanteEntregaPDFView,
)
from .dashboard_views import (
    DashboardResumenView,
    StockCriticoView,
    ConveniosResumenView,
)

urlpatterns = [
    # ── Catálogo e inventario ──────────────────────────────────────────────────
    path('inventario/catalogo/', CatalogoInventarioView.as_view(), name='catalogo_inventario'),

    # ── Sincronización offline (FIFO queue) ───────────────────────────────────
    path('transacciones/sync-batch/', SyncBatchPedidosView.as_view(), name='sync_batch_pedidos'),

    # ── Gestión documental y finanzas ─────────────────────────────────────────
    path('pedidos/<str:folio_unico_qr>/comprobante/', SubirComprobanteView.as_view(), name='subir_comprobante'),
    path('finanzas/pedidos/<str:folio_qr>/acelerar-finiquito/', AcelerarFiniquitoPDFView.as_view(), name='acelerar_finiquito'),

    # ── Generación de Documentos PDF Oficiales (Semana 3) ──────────────────────
    path('transacciones/pedidos/<str:folio_qr>/comprobante-pdf/', ComprobanteEntregaPDFView.as_view(), name='comprobante_entrega_pdf'),
    path('pedidos/<str:folio_qr>/comprobante-pdf/', ComprobanteEntregaPDFView.as_view(), name='pedidos_comprobante_pdf_compat'),

    # ── Dashboard analítico (Semana 2) ────────────────────────────────────────
    path('dashboard/resumen/', DashboardResumenView.as_view(), name='dashboard-resumen'),
    path('dashboard/stock-critico/', StockCriticoView.as_view(), name='dashboard-stock-critico'),
    path('dashboard/convenios-resumen/', ConveniosResumenView.as_view(), name='dashboard-convenios-resumen'),

    # Rutas alias / compatibles con prefijo 'transacciones/dashboard/'
    path('transacciones/dashboard/resumen/', DashboardResumenView.as_view(), name='transacciones-dashboard-resumen'),
    path('transacciones/dashboard/stock-critico/', StockCriticoView.as_view(), name='transacciones-dashboard-stock-critico'),
    path('transacciones/dashboard/convenios-resumen/', ConveniosResumenView.as_view(), name='transacciones-dashboard-convenios-resumen'),
]
