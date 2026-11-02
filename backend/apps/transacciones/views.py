from decimal import Decimal
from django.db import transaction
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


class AcelerarFiniquitoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, folio: str):
        serializer = AcelerarFiniquitoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rut_solicitante = serializer.validated_data['rut_solicitante']

        try:
            solicitud = SolicitudEntrega.objects.get(folio_unico_qr=folio)
            presupuesto = solicitud.presupuesto
        except (SolicitudEntrega.DoesNotExist, Presupuesto.DoesNotExist):
            return Response({'error': 'Registro o presupuesto inexistente'}, status=status.HTTP_404_NOT_FOUND)

        cuotas_pendientes = CuotaDescuento.objects.filter(
            id_presupuesto=presupuesto,
            estado_pago__in=[CuotaDescuento.EstadoPago.PENDIENTE, CuotaDescuento.EstadoPago.MORA]
        )

        saldo_total_acelerado = sum((c.monto_cuota for c in cuotas_pendientes), Decimal('0.00'))

        with transaction.atomic():
            cuotas_pendientes.update(estado_pago=CuotaDescuento.EstadoPago.COBRADO_FINIQUITO)
            solicitud.estado_pedido = SolicitudEntrega.EstadoPedido.RETENCION_LABORAL
            solicitud.version_seq += 1
            solicitud.save()

            # Emisión de pista forense SHA-256 inmutable
            AuditService.registrar_evento(
                rut_usuario=rut_solicitante,
                accion='ACELERACION_FINIQUITO',
                payload_data=f"Folio:{folio}|Saldo:{saldo_total_acelerado}"
            )

        return Response({
            'folio': folio,
            'saldo_acelerado_clp': str(saldo_total_acelerado),
            'cuotas_afectadas': cuotas_pendientes.count(),
            'estado_pedido': solicitud.estado_pedido
        }, status=status.HTTP_200_OK)