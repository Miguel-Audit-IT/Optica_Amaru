"""
Dashboard analítico para el panel administrativo de Óptica Amaru.
Todas las vistas están protegidas con autenticación JWT (IsAuthenticated).
Las consultas usan agregación ORM pura para evitar iteraciones en memoria.
"""
from decimal import Decimal
from django.db.models import Count, Sum, Q, F, Value, Case, When, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission

from .models import (
    SolicitudEntrega,
    ArmazonInventario,
    Presupuesto,
    CuotaDescuento,
)
from apps.autenticacion.models import EmpresaConvenio


class CanViewDashboard(BasePermission):
    """
    Control de Acceso Basado en Roles (RBAC):
    Restringe los endpoints del Dashboard Gerencial exclusivamente a
    usuarios del grupo 'Administrador', superusuarios o con el permiso 'autenticacion.ver_dashboard'.
    Operadores y Auditores recibirán HTTP 403 Forbidden.
    """
    message = "Acceso denegado: Se requieren permisos de Administrador para acceder al Dashboard Gerencial."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return (
            user.is_superuser or
            user.groups.filter(name__iexact='Administrador').exists() or
            user.has_perm('autenticacion.ver_dashboard')
        )


# Alias para retrocompatibilidad
IsStaffOrAdmin = CanViewDashboard


class DashboardResumenView(APIView):
    """
    GET /api/v1/transacciones/dashboard/resumen/

    Devuelve KPIs globales de operaciones:
      - total_solicitudes
      - solicitudes_hoy
      - solicitudes_mes
      - monto_total_valorizado (suma de Presupuesto.monto_total para solicitudes entregadas)
      - desglose_modalidad: {convenio, particular}
      - tasa_sincronizacion: % de solicitudes en estado final exitoso
    """
    permission_classes = [IsAuthenticated, CanViewDashboard]

    def get(self, request):
        ahora = timezone.now()
        hoy = ahora.date()

        # ── Conteos base ────────────────────────────────────────────────────────
        total_solicitudes = SolicitudEntrega.objects.count()

        solicitudes_hoy = SolicitudEntrega.objects.filter(
            fecha_ingreso__date=hoy
        ).count()

        solicitudes_mes = SolicitudEntrega.objects.filter(
            fecha_ingreso__year=ahora.year,
            fecha_ingreso__month=ahora.month,
        ).count()

        # ── Monto total valorizado (solo solicitudes con presupuesto registrado) ─
        monto_total_valorizado = (
            Presupuesto.objects
            .filter(
                folio_unico_qr__estado_pedido__in=[
                    SolicitudEntrega.EstadoPedido.ENTREGADA,
                    SolicitudEntrega.EstadoPedido.CERRADA,
                ]
            )
            .aggregate(total=Coalesce(Sum('monto_total'), Decimal('0.00'), output_field=DecimalField()))
        )['total']

        # ── Desglose por modalidad ───────────────────────────────────────────────
        # Convenio  → solicitudes que tienen titular_pago asignado (FK no nula)
        # Particular → titular_pago es NULL
        desglose = SolicitudEntrega.objects.aggregate(
            convenio=Count('folio_unico_qr', filter=Q(rut_titular_pago__isnull=False)),
            particular=Count('folio_unico_qr', filter=Q(rut_titular_pago__isnull=True)),
        )

        # ── Tasa de sincronización ───────────────────────────────────────────────
        # Estado final exitoso = Entregada | Cerrada
        # Pendientes/conflicto = cualquier otro estado
        estados_exitosos = [
            SolicitudEntrega.EstadoPedido.ENTREGADA,
            SolicitudEntrega.EstadoPedido.CERRADA,
        ]
        total_finalizadas = SolicitudEntrega.objects.filter(
            estado_pedido__in=estados_exitosos
        ).count()

        tasa_sincronizacion = round(
            (total_finalizadas / total_solicitudes * 100) if total_solicitudes > 0 else 0,
            1
        )

        # ── Pedidos recientes para gestión de comprobantes y finiquitos ──────────
        pedidos_recientes = []
        for sol in (
            SolicitudEntrega.objects
            .select_related('rut_paciente__rut_usuario', 'sku_armazon', 'presupuesto')
            .order_by('-fecha_ingreso')[:15]
        ):
            p_user = getattr(sol.rut_paciente, 'rut_usuario', None)
            nom = f"{p_user.nombres} {p_user.apellidos}" if p_user else sol.rut_paciente_id
            monto = sol.presupuesto.monto_total if hasattr(sol, 'presupuesto') else '0'
            pedidos_recientes.append({
                'folio_unico_qr': sol.folio_unico_qr,
                'rut_paciente': sol.rut_paciente_id,
                'nombre_paciente': nom,
                'sku_armazon': sol.sku_armazon_id,
                'modelo_armazon': sol.sku_armazon.modelo_lente if sol.sku_armazon else '',
                'estado_pedido': sol.estado_pedido,
                'monto_total': str(monto),
                'fecha_ingreso': sol.fecha_ingreso.strftime("%d/%m/%Y %H:%M") if hasattr(sol, 'fecha_ingreso') and sol.fecha_ingreso else '',
                'es_convenio': bool(sol.rut_titular_pago_id),
            })

        return Response({
            'total_solicitudes': total_solicitudes,
            'solicitudes_hoy': solicitudes_hoy,
            'solicitudes_mes': solicitudes_mes,
            'monto_total_valorizado': str(monto_total_valorizado),
            'desglose_modalidad': {
                'convenio': desglose['convenio'],
                'particular': desglose['particular'],
            },
            'tasa_sincronizacion': tasa_sincronizacion,
            'pedidos_recientes': pedidos_recientes,
        })


class StockCriticoView(APIView):
    """
    GET /api/v1/transacciones/dashboard/stock-critico/

    Devuelve armazones con stock_disponible == 0 o por debajo del umbral
    mínimo configurado en el modelo.  Ordenado de menor a mayor stock.

    Nota: ArmazonInventario no tiene campo `stock_minimo` en el modelo
    actual; se usa un umbral configurable vía query param `umbral` (default: 5).
    """
    permission_classes = [IsAuthenticated, CanViewDashboard]

    # Umbral mínimo por defecto si el modelo no tiene stock_minimo
    UMBRAL_DEFECTO = 5

    def get(self, request):
        umbral = int(request.query_params.get('umbral', self.UMBRAL_DEFECTO))

        armazones_criticos = (
            ArmazonInventario.objects
            .filter(stock_disponible__lte=umbral)
            .annotate(
                nivel_alerta=Case(
                    When(stock_disponible=0, then=Value('critico')),
                    default=Value('bajo'),
                )
            )
            .values(
                'nivel_alerta',
                sku=F('sku_armazon'),
                modelo=F('modelo_lente'),
                stock_actual=F('stock_disponible'),
            )
            .order_by('stock_disponible')
        )

        payload = [
            {
                'sku': item['sku'],
                'modelo': item['modelo'],
                'stock_actual': item['stock_actual'],
                'stock_minimo': umbral,
                'nivel_alerta': item['nivel_alerta'],
            }
            for item in armazones_criticos
        ]

        return Response({
            'umbral_aplicado': umbral,
            'total_alertas': len(payload),
            'items': payload,
        })


class ConveniosResumenView(APIView):
    """
    GET /api/v1/transacciones/dashboard/convenios-resumen/

    Agrupa solicitudes por empresa de convenio y devuelve:
      - empresa_nombre: razón social
      - total_pacientes_atendidos: cantidad de solicitudes vinculadas
      - monto_proyectado_descuento: suma de cuotas Pendiente + Mora (CLP)
    """
    permission_classes = [IsAuthenticated, CanViewDashboard]

    def get(self, request):
        # Empresas con al menos un paciente con solicitudes registradas
        empresas = (
            EmpresaConvenio.objects
            .filter(
                pacientes__solicitudes__isnull=False
            )
            .distinct()
        )

        resultado = []
        for empresa in empresas:
            # Conteo de solicitudes → Paciente.rut_usuario → SolicitudEntrega
            total_atendidos = SolicitudEntrega.objects.filter(
                rut_paciente__id_empresa=empresa
            ).count()

            # Cuotas pendientes/mora asociadas a esas solicitudes
            monto_proyectado = (
                CuotaDescuento.objects
                .filter(
                    id_presupuesto__folio_unico_qr__rut_paciente__id_empresa=empresa,
                    estado_pago__in=[
                        CuotaDescuento.EstadoPago.PENDIENTE,
                        CuotaDescuento.EstadoPago.MORA,
                    ]
                )
                .aggregate(total=Coalesce(Sum('monto_cuota'), Decimal('0.00'), output_field=DecimalField()))
            )['total']

            resultado.append({
                'id_empresa': empresa.id_empresa,
                'empresa_nombre': empresa.razon_social,
                'rut_empresa': empresa.rut_empresa,
                'convenio_vigente': empresa.convenio_vigente,
                'total_pacientes_atendidos': total_atendidos,
                'monto_proyectado_descuento': str(monto_proyectado),
            })

        # Ordenar por monto proyectado descendente (mayor exposición primero)
        resultado.sort(key=lambda x: float(x['monto_proyectado_descuento']), reverse=True)

        return Response({
            'total_empresas': len(resultado),
            'empresas': resultado,
        })
