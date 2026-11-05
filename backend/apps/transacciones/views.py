from decimal import Decimal
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import (
    ArmazonInventario,
    SolicitudEntrega,
    Presupuesto,
    CuotaDescuento,
    DocumentoRespaldo,
    MovimientoStock
)
from .serializers import (
    ArmazonCatalogoSerializer,
    SyncBatchInputSerializer,
    ComprobanteUploadSerializer,
    AcelerarFiniquitoSerializer
)
from apps.autenticacion.models import Paciente, TitularPago
from apps.clinico.models import RecetaOptica
from apps.auditoria.services import AuditService
from .pdf_generator import (
    generar_comprobante_entrega_pdf,
    generar_liquidacion_finiquito_pdf
)


class CatalogoInventarioView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        armazones = ArmazonInventario.objects.filter(stock_disponible__gt=0)
        serializer = ArmazonCatalogoSerializer(armazones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SyncBatchPedidosView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SyncBatchInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        pedidos_data = serializer.validated_data['pedidos']
        procesados = []
        conflictos = []

        for item in pedidos_data:
            folio = item['folio_unico_qr']
            
            with transaction.atomic():
                pedido_existente = SolicitudEntrega.objects.filter(folio_unico_qr=folio).first()
                if pedido_existente:
                    # Detección de concurrencia optimista
                    if item['version_seq'] <= pedido_existente.version_seq:
                        conflictos.append({
                            'folio_unico_qr': folio,
                            'motivo': 'Versión desactualizada frente al servidor',
                            'version_servidor': pedido_existente.version_seq
                        })
                        continue

                try:
                    paciente = Paciente.objects.get(rut_usuario_id=item['rut_paciente'])
                    armazon = ArmazonInventario.objects.get(sku_armazon=item['sku_armazon'])
                except (Paciente.DoesNotExist, ArmazonInventario.DoesNotExist) as e:
                    conflictos.append({'folio_unico_qr': folio, 'motivo': str(e)})
                    continue

                receta = None
                if item.get('id_receta'):
                    receta = RecetaOptica.objects.filter(id_receta=item['id_receta']).first()

                titular = None
                if item.get('rut_titular_pago'):
                    titular = TitularPago.objects.filter(rut_titular=item['rut_titular_pago']).first()

                estado_inicial = SolicitudEntrega.EstadoPedido.PENDIENTE_RESPALDO if titular else SolicitudEntrega.EstadoPedido.RECIBIDA

                solicitud, _ = SolicitudEntrega.objects.update_or_create(
                    folio_unico_qr=folio,
                    defaults={
                        'rut_paciente': paciente,
                        'id_receta': receta,
                        'sku_armazon': armazon,
                        'rut_titular_pago': titular,
                        'estado_pedido': estado_inicial,
                        'version_seq': item['version_seq']
                    }
                )

                presupuesto, _ = Presupuesto.objects.update_or_create(
                    folio_unico_qr=solicitud,
                    defaults={'monto_total': item['monto_total']}
                )

                for cuota_data in item.get('cuotas', []):
                    CuotaDescuento.objects.update_or_create(
                        id_presupuesto=presupuesto,
                        numero_cuota=cuota_data['numero_cuota'],
                        defaults={
                            'monto_cuota': cuota_data['monto_cuota'],
                            'mes_ejecucion': cuota_data['mes_ejecucion']
                        }
                    )

                # Descuento en stock por movimiento (dispara trigger de BD)
                tipo_mov = MovimientoStock.TipoMovimiento.CONVENIO if titular else MovimientoStock.TipoMovimiento.VENTA_DIRECTA
                MovimientoStock.objects.create(
                    sku_armazon=armazon,
                    folio_unico_qr=solicitud,
                    tipo_movimiento=tipo_mov,
                    cantidad=1
                )

                procesados.append(folio)

        return Response({
            'procesados': procesados,
            'conflictos': conflictos
        }, status=status.HTTP_200_OK)


class SubirComprobanteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, folio_unico_qr: str):
        serializer = ComprobanteUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            solicitud = SolicitudEntrega.objects.get(folio_unico_qr=folio_unico_qr)
        except SolicitudEntrega.DoesNotExist:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Simulación de carga segura a S3 / MinIO
        archivo = serializer.validated_data['archivo']
        s3_url_ficticia = f"https://s3.amazonaws.com/amaru-comprobantes/{folio_unico_qr}_{archivo.name}"

        DocumentoRespaldo.objects.update_or_create(
            folio_unico_qr=solicitud,
            defaults={
                'url_imagen_s3': s3_url_ficticia,
                'validado_taller': True
            }
        )

        # Transición de estado permitida según State Machine
        solicitud.estado_pedido = SolicitudEntrega.EstadoPedido.EN_FABRICACION
        solicitud.version_seq += 1
        solicitud.save()

        return Response({
            'folio_unico_qr': folio_unico_qr,
            'nuevo_estado': solicitud.estado_pedido,
            'url_s3': s3_url_ficticia
        }, status=status.HTTP_200_OK)


class ComprobanteEntregaPDFView(APIView):
    """
    GET /api/v1/transacciones/pedidos/<str:folio_qr>/comprobante-pdf/

    Genera y descarga el Comprobante Oficial de Entrega de EPP en PDF
    con branding corporativo de Óptica Amaru, detalle de armazón,
    parámetros ópticos, código QR del folio y recuadro de firma física/huella.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, folio_qr: str):
        try:
            solicitud = (
                SolicitudEntrega.objects
                .select_related(
                    'rut_paciente__rut_usuario',
                    'sku_armazon',
                    'rut_titular_pago__id_empresa',
                    'id_receta'
                )
                .get(folio_unico_qr=folio_qr)
            )
        except SolicitudEntrega.DoesNotExist:
            return Response(
                {'error': f'Pedido con folio {folio_qr} no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        pdf_bytes = generar_comprobante_entrega_pdf(solicitud, receta=solicitud.id_receta)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="comprobante_{folio_qr}.pdf"'
        return response


class AcelerarFiniquitoPDFView(APIView):
    """
    POST /api/v1/finanzas/pedidos/<str:folio_qr>/acelerar-finiquito/
    GET  /api/v1/finanzas/pedidos/<str:folio_qr>/acelerar-finiquito/

    Consolida las cuotas pendientes del Presupuesto, actualiza estados
    a Cobrado_Finiquito, emite pista forense SHA-256 en RegistroAuditoria
    y genera el documento legal de liquidación en PDF.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, folio_qr: str):
        rut_solicitante = (
            request.data.get('rut_solicitante')
            or getattr(request.user, 'username', '12345678-9')
        )

        try:
            solicitud = (
                SolicitudEntrega.objects
                .select_related(
                    'rut_paciente__rut_usuario',
                    'rut_titular_pago__id_empresa',
                    'presupuesto'
                )
                .get(folio_unico_qr=folio_qr)
            )
            presupuesto = solicitud.presupuesto
        except (SolicitudEntrega.DoesNotExist, Presupuesto.DoesNotExist):
            return Response(
                {'error': f'Registro o presupuesto inexistente para folio {folio_qr}'},
                status=status.HTTP_404_NOT_FOUND
            )

        cuotas_pendientes = CuotaDescuento.objects.filter(
            id_presupuesto=presupuesto,
            estado_pago__in=[
                CuotaDescuento.EstadoPago.PENDIENTE,
                CuotaDescuento.EstadoPago.MORA,
            ]
        )

        saldo_total_acelerado = sum((c.monto_cuota for c in cuotas_pendientes), Decimal('0.00'))

        with transaction.atomic():
            cuotas_pendientes.update(estado_pago=CuotaDescuento.EstadoPago.COBRADO_FINIQUITO)
            solicitud.estado_pedido = SolicitudEntrega.EstadoPedido.RETENCION_LABORAL
            solicitud.version_seq += 1
            solicitud.save()

            # Emisión de pista forense SHA-256 inmutable
            evento_audit = AuditService.registrar_evento(
                rut_usuario=rut_solicitante,
                accion='ACELERACION_FINIQUITO',
                payload_data=f"Folio:{folio_qr}|Saldo:{saldo_total_acelerado}"
            )

        todas_cuotas = CuotaDescuento.objects.filter(id_presupuesto=presupuesto).order_by('numero_cuota')

        pdf_bytes = generar_liquidacion_finiquito_pdf(
            solicitud=solicitud,
            presupuesto=presupuesto,
            cuotas=todas_cuotas,
            saldo_total=saldo_total_acelerado,
            hash_sha256=evento_audit.hash_integridad_sha256,
            fecha_evento=evento_audit.fecha_hora,
            rut_solicitante=rut_solicitante,
        )

        if request.query_params.get('format') == 'json' or request.headers.get('Accept') == 'application/json':
            return Response({
                'folio': folio_qr,
                'saldo_acelerado_clp': str(saldo_total_acelerado),
                'cuotas_afectadas': cuotas_pendientes.count(),
                'estado_pedido': solicitud.estado_pedido,
                'hash_sha256': evento_audit.hash_integridad_sha256,
            }, status=status.HTTP_200_OK)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="finiquito_{folio_qr}.pdf"'
        return response

    def get(self, request, folio_qr: str):
        try:
            solicitud = (
                SolicitudEntrega.objects
                .select_related(
                    'rut_paciente__rut_usuario',
                    'rut_titular_pago__id_empresa',
                    'presupuesto'
                )
                .get(folio_unico_qr=folio_qr)
            )
            presupuesto = solicitud.presupuesto
        except (SolicitudEntrega.DoesNotExist, Presupuesto.DoesNotExist):
            return Response(
                {'error': f'Registro o presupuesto inexistente para folio {folio_qr}'},
                status=status.HTTP_404_NOT_FOUND
            )

        todas_cuotas = CuotaDescuento.objects.filter(id_presupuesto=presupuesto).order_by('numero_cuota')
        cuotas_finiquito = todas_cuotas.filter(estado_pago=CuotaDescuento.EstadoPago.COBRADO_FINIQUITO)
        if not cuotas_finiquito.exists():
            cuotas_finiquito = todas_cuotas.filter(
                estado_pago__in=[CuotaDescuento.EstadoPago.PENDIENTE, CuotaDescuento.EstadoPago.MORA]
            )

        saldo_total = sum((c.monto_cuota for c in cuotas_finiquito), Decimal('0.00'))

        from apps.auditoria.models import RegistroAuditoria
        ultimo_audit = RegistroAuditoria.objects.filter(
            accion_realizada='ACELERACION_FINIQUITO',
        ).order_by('-fecha_hora').first()

        hash_sha256 = (
            ultimo_audit.hash_integridad_sha256
            if ultimo_audit
            else "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        )
        fecha_evento = ultimo_audit.fecha_hora if ultimo_audit else timezone.now()

        pdf_bytes = generar_liquidacion_finiquito_pdf(
            solicitud=solicitud,
            presupuesto=presupuesto,
            cuotas=todas_cuotas,
            saldo_total=saldo_total,
            hash_sha256=hash_sha256,
            fecha_evento=fecha_evento,
            rut_solicitante=request.user.username or 'ADMIN',
        )

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="finiquito_{folio_qr}.pdf"'
        return response


# Alias para retrocompatibilidad
AcelerarFiniquitoView = AcelerarFiniquitoPDFView
