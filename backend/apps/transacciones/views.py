import re
from decimal import Decimal
import base64
import hashlib
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .dashboard_views import CanViewDashboard

MENSAJE_BLOQUEO_LEY_21719 = (
    "Acceso denegado: Por protección de datos clínicos (Ley 21.719), solo puede consultar sus propios pedidos."
)


def es_usuario_paciente_o_externo(user) -> bool:
    """
    Retorna True si el usuario autenticado tiene rol de Paciente
    (o no pertenece a los grupos privilegiados Administrador, Operador, Auditor).
    """
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return False
    if user.groups.filter(name__in=['Administrador', 'Operador', 'Auditor', 'Bodega']).exists():
        return False
    from apps.autenticacion.models import PersonalOptica
    if PersonalOptica.objects.filter(rut_usuario_id=user.username).exists():
        return False
    return True


def validar_acceso_paciente_a_pedido(user, solicitud) -> bool:
    """
    Valida si un paciente tiene derecho a acceder a la solicitud indicada.
    Retorna True si tiene permiso, False si se viola la Ley 21.719.
    """
    if not es_usuario_paciente_o_externo(user):
        return True

    rut_usuario_limpio = re.sub(r'[^0-9kK]', '', str(user.username)).upper()
    rut_pedido_limpio = re.sub(r'[^0-9kK]', '', str(solicitud.rut_paciente_id)).upper()
    return rut_usuario_limpio == rut_pedido_limpio

from apps.autenticacion.throttles import QRPublicRateThrottle

from .models import (
    ArmazonInventario,
    SolicitudEntrega,
    Presupuesto,
    CuotaDescuento,
    DocumentoRespaldo,
    MovimientoStock,
    RecepcionDespacho
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
    """
    Catálogo de armazones disponibles en stock.
    HU-SEC-01: throttle_classes con QRPublicRateThrottle (10/min por IP)
    previene scraping masivo del inventario desde el flujo QR público.
    """
    permission_classes = [AllowAny]
    throttle_classes = [QRPublicRateThrottle]

    def get(self, request):
        armazones = ArmazonInventario.objects.filter(stock_disponible__gt=0)
        serializer = ArmazonCatalogoSerializer(armazones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SyncBatchPedidosView(APIView):
    """
    Sincronización de pedidos en lote desde el terminal offline.
    HU-SEC-01: throttle_classes con QRPublicRateThrottle (10/min por IP)
    limita la escritura masiva de pre-ingresos del flujo QR self-service.
    """
    permission_classes = [AllowAny]
    throttle_classes = [QRPublicRateThrottle]

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
    con branding corporativo de Óptica Amaru, firma electrónica simple (DS 594),
    parámetros ópticos, código QR del folio y sello de integridad SHA-256.
    """
    permission_classes = [AllowAny]

    def get(self, request, folio_qr: str):
        try:
            solicitud = (
                SolicitudEntrega.objects
                .select_related(
                    'rut_paciente__rut_usuario',
                    'sku_armazon',
                    'rut_titular_pago__id_empresa',
                    'id_receta',
                    'recepcion_despacho'
                )
                .get(folio_unico_qr=folio_qr)
            )
        except SolicitudEntrega.DoesNotExist:
            return Response(
                {'error': f'Pedido con folio {folio_qr} no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user.is_authenticated and not validar_acceso_paciente_a_pedido(request.user, solicitud):
            return Response(
                {'detail': MENSAJE_BLOQUEO_LEY_21719},
                status=status.HTTP_403_FORBIDDEN
            )

        recepcion = getattr(solicitud, 'recepcion_despacho', None)
        firma_b64 = recepcion.firma_digital_b64 if recepcion else None

        pdf_bytes = generar_comprobante_entrega_pdf(solicitud, receta=solicitud.id_receta, firma_b64=firma_b64)
        sello_sha256 = hashlib.sha256(pdf_bytes).hexdigest()

        # Asegurar persistencia del hash de integridad
        if recepcion and not recepcion.sello_integridad_pdf:
            recepcion.sello_integridad_pdf = sello_sha256
            recepcion.save(update_fields=['sello_integridad_pdf'])
        if not solicitud.sello_integridad_pdf:
            solicitud.sello_integridad_pdf = sello_sha256
            solicitud.save(update_fields=['sello_integridad_pdf'])

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="comprobante_{folio_qr}.pdf"'
        response['X-Sello-Integridad-SHA256'] = sello_sha256
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

        if request.user.is_authenticated and not validar_acceso_paciente_a_pedido(request.user, solicitud):
            return Response(
                {'detail': MENSAJE_BLOQUEO_LEY_21719},
                status=status.HTTP_403_FORBIDDEN
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

        if request.user.is_authenticated and not validar_acceso_paciente_a_pedido(request.user, solicitud):
            return Response(
                {'detail': MENSAJE_BLOQUEO_LEY_21719},
                status=status.HTTP_403_FORBIDDEN
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


class ConfirmarDespachoView(APIView):
    """
    POST /api/v1/transacciones/despacho/confirmar/
    Registra la recepción física del EPP óptico validado con código PDF417,
    firma electrónica simple (DS 594) y sellado criptográfico SHA-256 del comprobante.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        folio = request.data.get('folio') or request.data.get('folio_unico_qr')
        tipo_receptor = request.data.get('tipo_receptor', 'Titular')
        rut_receptor = request.data.get('rut_receptor') or request.data.get('rut')
        codigo_pdf417 = (
            request.data.get('codigo_pdf417')
            or request.data.get('hash_codigo')
            or request.data.get('codigo_barras_pdf417_leido')
            or 'PDF417_SIMULADO'
        )
        firma_b64 = (
            request.data.get('firma_trabajador_b64')
            or request.data.get('firma_b64')
            or request.data.get('firma')
        )

        # Decodificación y validación en memoria del trazo Base64
        firma_bytes = None
        if firma_b64:
            try:
                raw_b64 = firma_b64.split(',', 1)[1] if ',' in firma_b64 else firma_b64
                firma_bytes = base64.b64decode(raw_b64.strip())
            except Exception:
                firma_bytes = None

        if not folio or not rut_receptor:
            return Response(
                {'error': 'Debe proporcionar folio y rut_receptor.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        solicitud = SolicitudEntrega.objects.filter(folio_unico_qr=folio).first()
        if not solicitud:
            dummy_pdf = f"FOLIO:{folio}|RECEPTOR:{rut_receptor}|FIRMA:{bool(firma_bytes)}".encode('utf-8')
            sello_simulado = hashlib.sha256(dummy_pdf).hexdigest()
            return Response({
                'mensaje': f'Despacho simulado para folio {folio} (modo local / pendiente de sincronizar).',
                'folio': folio,
                'tipo_receptor': tipo_receptor,
                'rut_receptor': rut_receptor,
                'estado': 'Entregada',
                'sello_integridad_pdf': sello_simulado,
                'simulado': True
            }, status=status.HTTP_200_OK)

        tipo_enum = (
            RecepcionDespacho.TipoReceptor.TERCERO_AUTORIZADO
            if str(tipo_receptor).lower() in ['tercero_autorizado', 'tercero']
            else RecepcionDespacho.TipoReceptor.TITULAR
        )

        with transaction.atomic():
            recepcion, created = RecepcionDespacho.objects.update_or_create(
                folio_unico_qr=solicitud,
                defaults={
                    'tipo_receptor': tipo_enum,
                    'rut_receptor': rut_receptor,
                    'codigo_barras_pdf417_leido': codigo_pdf417,
                    'firma_digital_b64': firma_b64,
                }
            )
            solicitud.estado_pedido = SolicitudEntrega.EstadoPedido.ENTREGADA
            solicitud.version_seq += 1
            solicitud.save()

            # Descontar stock si es pertinente
            MovimientoStock.objects.create(
                sku_armazon=solicitud.sku_armazon,
                folio_unico_qr=solicitud,
                tipo_movimiento=MovimientoStock.TipoMovimiento.CONVENIO,
                cantidad=-1
            )

        # Generar comprobante PDF con firma estampada y calcular Sello de Integridad SHA-256
        pdf_bytes = generar_comprobante_entrega_pdf(
            solicitud=solicitud,
            receta=solicitud.id_receta,
            firma_b64=firma_b64
        )
        sello_sha256 = hashlib.sha256(pdf_bytes).hexdigest()

        # Guardar sello de integridad en la base de datos
        recepcion.sello_integridad_pdf = sello_sha256
        recepcion.save(update_fields=['sello_integridad_pdf'])

        solicitud.sello_integridad_pdf = sello_sha256
        solicitud.save(update_fields=['sello_integridad_pdf'])

        return Response({
            'mensaje': f'Despacho y entrega confirmados para folio {folio}. Comprobante sellado con SHA-256.',
            'id_recepcion': str(recepcion.id_recepcion),
            'folio': folio,
            'tipo_receptor': recepcion.tipo_receptor,
            'rut_receptor': recepcion.rut_receptor,
            'estado': solicitud.estado_pedido,
            'sello_integridad_pdf': sello_sha256,
            'simulado': False
        }, status=status.HTTP_200_OK)


class SeguimientoPedidoView(APIView):
    """
    GET /api/v1/transacciones/pedidos/<str:folio_qr>/seguimiento/
    GET /api/v1/transacciones/seguimiento/?folio=<folio>&rut=<rut>

    Consulta el seguimiento y estado de trazabilidad omnicanal de pedidos.
    Blindaje Ley 21.719: Si el usuario es 'Paciente', SOLO puede consultar
    pedidos asociados a su propio RUT. Intentos de consultar folios o RUTs ajenos
    retornan HTTP 403 Forbidden.
    """
    permission_classes = [AllowAny]

    def get(self, request, folio_qr: str = None):
        folio = folio_qr or request.query_params.get('folio')
        rut_param = request.query_params.get('rut')
        user = request.user

        # 1. Consulta por Folio específico
        if folio:
            folio = folio.strip()
            solicitud = (
                SolicitudEntrega.objects
                .select_related(
                    'rut_paciente__rut_usuario',
                    'rut_paciente__id_empresa',
                    'sku_armazon',
                    'rut_titular_pago',
                    'id_receta',
                    'recepcion_despacho',
                    'presupuesto'
                )
                .filter(folio_unico_qr__iexact=folio)
                .first()
            )

            if not solicitud:
                return Response(
                    {'error': f'Pedido con folio {folio} no encontrado.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Blindaje Ley 21.719 si el usuario está autenticado
            if user.is_authenticated and not validar_acceso_paciente_a_pedido(user, solicitud):
                return Response(
                    {'detail': MENSAJE_BLOQUEO_LEY_21719},
                    status=status.HTTP_403_FORBIDDEN
                )

            return Response(self._serializar_pedido(solicitud), status=status.HTTP_200_OK)

        # 2. Consulta por RUT o listado de pedidos del paciente autenticado
        if user.is_authenticated and es_usuario_paciente_o_externo(user):
            # Paciente autenticado: restringir estrictamente a su propio RUT
            if rut_param:
                rut_param_limpio = re.sub(r'[^0-9kK]', '', str(rut_param)).upper()
                rut_user_limpio = re.sub(r'[^0-9kK]', '', str(user.username)).upper()
                if rut_param_limpio != rut_user_limpio:
                    return Response(
                        {'detail': MENSAJE_BLOQUEO_LEY_21719},
                        status=status.HTTP_403_FORBIDDEN
                    )
            rut_busqueda = user.username
        else:
            rut_busqueda = rut_param

        if not rut_busqueda:
            return Response(
                {'error': 'Debe proporcionar un folio o un RUT para consultar el seguimiento.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        rut_clean = re.sub(r'[^0-9kK]', '', str(rut_busqueda)).upper()
        solicitudes = (
            SolicitudEntrega.objects
            .select_related(
                'rut_paciente__rut_usuario',
                'rut_paciente__id_empresa',
                'sku_armazon',
                'rut_titular_pago',
                'id_receta',
                'recepcion_despacho',
                'presupuesto'
            )
            .filter(rut_paciente_id__icontains=rut_clean)
            .order_by('-fecha_ingreso')
        )

        data = [self._serializar_pedido(s) for s in solicitudes]
        return Response(data, status=status.HTTP_200_OK)

    def _serializar_pedido(self, solicitud: SolicitudEntrega) -> dict:
        paciente = solicitud.rut_paciente
        usuario = getattr(paciente, 'rut_usuario', None) if paciente else None
        nombre = f"{usuario.nombres} {usuario.apellidos}" if usuario else str(solicitud.rut_paciente_id)
        empresa_nombre = (
            paciente.id_empresa.razon_social
            if (paciente and paciente.id_empresa)
            else "Atención Particular"
        )

        presupuesto = getattr(solicitud, 'presupuesto', None)
        saldo = float(presupuesto.monto_total) if presupuesto else 0.0
        aceleracion = bool(presupuesto.clausula_aceleracion_aceptada) if presupuesto else False

        # Generación de hitos según estado del pedido
        estado = solicitud.estado_pedido
        hitos = [
            {
                'id': 'hito-clinico',
                'nombre': 'Validación Clínica & Graduación',
                'subtitulo': 'Receta médica visada',
                'descripcion': 'Parámetros ópticos y refracción procesados en sistema.',
                'fecha': solicitud.fecha_ingreso.strftime('%d-%m-%Y %H:%M') if solicitud.fecha_ingreso else '',
                'estado': 'completed',
                'tipoIcono': 'clinica',
            },
            {
                'id': 'hito-laboratorio',
                'nombre': 'Laboratorio Óptico',
                'subtitulo': 'Fabricación de cristales y biselado',
                'descripcion': 'Biselado de alta precisión y control de filtros.',
                'estado': 'completed' if estado in ['En_Fabricacion', 'Transito', 'Lista', 'Entregada', 'Retencion_Laboral'] else 'active',
                'tipoIcono': 'laboratorio',
            },
            {
                'id': 'hito-despacho',
                'nombre': 'Despacho & Logística',
                'subtitulo': 'En tránsito a destino o sucursal',
                'descripcion': 'Embalaje de seguridad y transporte.',
                'estado': 'completed' if estado in ['Transito', 'Lista', 'Entregada', 'Retencion_Laboral'] else ('active' if estado == 'Transito' else 'pending'),
                'tipoIcono': 'despacho',
            },
            {
                'id': 'hito-entrega',
                'nombre': 'Entrega Conforme',
                'subtitulo': 'Recepción y firma del paciente',
                'descripcion': 'Acreditación presencial con firma digital y verificación.',
                'fecha': getattr(solicitud.recepcion_despacho, 'fecha_entrega', '').isoformat() if hasattr(solicitud, 'recepcion_despacho') else '',
                'estado': 'completed' if estado == 'Entregada' else 'pending',
                'tipoIcono': 'entrega',
                'selloSha256': solicitud.sello_integridad_pdf or '',
            },
            {
                'id': 'hito-financiero',
                'nombre': 'Estado Financiero',
                'subtitulo': 'Finiquito Laboral / Liquidación' if aceleracion else 'Modalidad de Pago Normal',
                'descripcion': 'Descuento consolidado por término laboral (Art. 177)' if aceleracion else 'Convenio y cuotas registradas.',
                'estado': 'alert' if aceleracion else 'completed',
                'tipoIcono': 'finanzas',
            }
        ]

        return {
            'folio': solicitud.folio_unico_qr,
            'rutTitular': solicitud.rut_paciente_id,
            'nombreTitular': nombre,
            'empresaEmpleadora': empresa_nombre,
            'sindicatoFaena': 'Plan Óptico Registrado',
            'saldoTotal': saldo,
            'modeloArmazon': (
                f"{solicitud.sku_armazon_id} - {solicitud.sku_armazon.modelo_lente}"
                if solicitud.sku_armazon
                else 'Armazón Óptico'
            ),
            'fechaIngreso': (
                solicitud.fecha_ingreso.strftime('%d de %B %Y, %H:%M hrs')
                if solicitud.fecha_ingreso
                else ''
            ),
            'estadoBadge': estado.upper(),
            'tieneAceleracionFiniquito': aceleracion,
            'hitos': hitos,
        }

