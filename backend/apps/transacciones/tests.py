import io
import base64
import hashlib
from datetime import date
from PIL import Image
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.autenticacion.models import Usuario, Paciente, EmpresaConvenio, TitularPago
from apps.clinico.models import RecetaOptica
from apps.transacciones.models import (
    ArmazonInventario,
    SolicitudEntrega,
    RecepcionDespacho,
    MovimientoStock
)
from apps.transacciones.pdf_generator import (
    generar_comprobante_entrega_pdf,
    calcular_sello_integridad_pdf
)


class FirmaElectronicaSimpleDespachoTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Crear Empresa en Convenio
        self.empresa = EmpresaConvenio.objects.create(
            razon_social='Minera Escondida Ltda.',
            rut_empresa='77.123.456-7',
            convenio_vigente=True
        )

        # 2. Crear Usuario y Paciente
        self.usuario = Usuario.objects.create(
            rut_usuario='15.482.931-K',
            nombres='Mario',
            apellidos='Cárdenas',
            correo_electronico='mario.cardenas@escondida.cl',
            contrasena_hash='hash123'
        )
        self.paciente = Paciente.objects.create(
            rut_usuario=self.usuario,
            tipo_cliente=Paciente.TipoCliente.CONVENIO,
            id_empresa=self.empresa
        )

        # 3. Crear Titular
        self.titular = TitularPago.objects.create(
            rut_titular='15.482.931-K',
            nombre_completo='Mario Cárdenas',
            id_empresa=self.empresa,
            cupo_disponible=150000,
            estado_laboral=TitularPago.EstadoLaboral.ACTIVO
        )

        # 4. Crear Armazón
        self.armazon = ArmazonInventario.objects.create(
            sku_armazon='EPP-AMARU-001',
            modelo_lente='Lente Seguridad Titanio Pro',
            caracteristicas_tecnicas={'material': 'Policarbonato', 'filtro_uv': 'UV400'},
            certificaciones_multiples=['ANSI Z87.1', 'DS 594'],
            stock_disponible=25,
            precio_clp=85000
        )

        # 5. Crear Receta
        self.receta = RecetaOptica.objects.create(
            rut_paciente=self.paciente,
            fecha_emision=date.today(),
            parametros_oftalmologicos={
                'ojo_derecho': {'esfera': -1.5, 'cilindro': -0.5, 'eje': 90},
                'ojo_izquierdo': {'esfera': -1.25, 'cilindro': -0.75, 'eje': 85}
            }
        )

        # 6. Crear Solicitud de Entrega
        self.solicitud = SolicitudEntrega.objects.create(
            folio_unico_qr='FOLIO-TEST-DS594',
            rut_paciente=self.paciente,
            id_receta=self.receta,
            sku_armazon=self.armazon,
            rut_titular_pago=self.titular,
            estado_pedido=SolicitudEntrega.EstadoPedido.LISTA
        )

        # Generar firma transparente Base64 de prueba
        img = Image.new('RGBA', (120, 40), (0, 0, 0, 0))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        self.firma_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

    def test_generar_pdf_con_firma_y_sello_integridad(self):
        """Genera el PDF inyectando la firma y verifica que el hash SHA-256 sea válido."""
        pdf_bytes = generar_comprobante_entrega_pdf(
            solicitud=self.solicitud,
            receta=self.receta,
            firma_b64=self.firma_b64
        )
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(len(pdf_bytes) > 1000)
        self.assertTrue(pdf_bytes.startswith(b'%PDF'))

        # Calcular hash de integridad
        sello = calcular_sello_integridad_pdf(pdf_bytes)
        self.assertEqual(len(sello), 64)
        self.assertEqual(sello, hashlib.sha256(pdf_bytes).hexdigest())

    def test_endpoint_confirmar_despacho_con_firma_estampa_y_sella(self):
        """
        POST /api/v1/transacciones/despacho/confirmar/
        Recibe firma_trabajador_b64, actualiza estado a 'Entregada',
        descuenta stock, genera el PDF y almacena sello_integridad_pdf en BD.
        """
        url = '/api/v1/transacciones/despacho/confirmar/'
        payload = {
            'folio': 'FOLIO-TEST-DS594',
            'tipo_receptor': 'Titular',
            'rut_receptor': '15.482.931-K',
            'codigo_pdf417': 'PDF417_CEDULA_15482931K',
            'firma_trabajador_b64': self.firma_b64
        }

        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['estado'], 'Entregada')
        self.assertIn('sello_integridad_pdf', res.data)
        sello_respuesta = res.data['sello_integridad_pdf']
        self.assertEqual(len(sello_respuesta), 64)

        # Verificar actualización en Base de Datos
        self.solicitud.refresh_from_db()
        self.assertEqual(self.solicitud.estado_pedido, SolicitudEntrega.EstadoPedido.ENTREGADA)
        self.assertEqual(self.solicitud.sello_integridad_pdf, sello_respuesta)

        recepcion = RecepcionDespacho.objects.get(folio_unico_qr=self.solicitud)
        self.assertEqual(recepcion.rut_receptor, '15.482.931-K')
        self.assertEqual(recepcion.sello_integridad_pdf, sello_respuesta)
        self.assertEqual(recepcion.firma_digital_b64, self.firma_b64)

        # Verificar descuento de inventario
        mov = MovimientoStock.objects.filter(folio_unico_qr=self.solicitud).first()
        self.assertIsNotNone(mov)
        self.assertEqual(mov.cantidad, -1)

    def test_endpoint_descarga_pdf_incluye_header_sello(self):
        """
        GET /api/v1/transacciones/pedidos/<folio>/comprobante-pdf/
        Retorna el PDF oficial con el header X-Sello-Integridad-SHA256.
        """
        # Primero registrar recepción con firma
        RecepcionDespacho.objects.create(
            folio_unico_qr=self.solicitud,
            tipo_receptor=RecepcionDespacho.TipoReceptor.TITULAR,
            rut_receptor='15.482.931-K',
            codigo_barras_pdf417_leido='PDF417_TEST',
            firma_digital_b64=self.firma_b64
        )

        url = f'/api/v1/transacciones/pedidos/{self.solicitud.folio_unico_qr}/comprobante-pdf/'
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertTrue('X-Sello-Integridad-SHA256' in res.headers)
        self.assertEqual(len(res.headers['X-Sello-Integridad-SHA256']), 64)


class DashboardRBACTestCase(TestCase):
    """
    Pruebas de Control de Acceso Basado en Roles (RBAC) para el Dashboard Gerencial:
    - Administrador -> HTTP 200 OK
    - Operador -> HTTP 403 Forbidden
    - Auditor -> HTTP 403 Forbidden
    - Anónimo -> HTTP 401 Unauthorized
    """
    def setUp(self):
        from django.contrib.auth import get_user_model
        from django.contrib.auth.models import Group, Permission
        from django.contrib.contenttypes.models import ContentType
        from apps.autenticacion.models import PersonalOptica

        User = get_user_model()
        self.client = APIClient()

        # ContentType y Permiso
        ct, _ = ContentType.objects.get_or_create(app_label='autenticacion', model='personaloptica')
        perm_dash, _ = Permission.objects.get_or_create(
            codename='ver_dashboard', content_type=ct, defaults={'name': 'Puede ver dashboard'}
        )

        # Grupos
        self.grupo_admin, _ = Group.objects.get_or_create(name='Administrador')
        self.grupo_admin.permissions.add(perm_dash)

        self.grupo_operador, _ = Group.objects.get_or_create(name='Operador')
        self.grupo_auditor, _ = Group.objects.get_or_create(name='Auditor')

        # Usuarios
        self.user_admin = User.objects.create_user(username='admin_test', password='password123', is_staff=True)
        self.user_admin.groups.add(self.grupo_admin)

        self.user_operador = User.objects.create_user(username='operador_test', password='password123', is_staff=True)
        self.user_operador.groups.add(self.grupo_operador)

        self.user_auditor = User.objects.create_user(username='auditor_test', password='password123', is_staff=True)
        self.user_auditor.groups.add(self.grupo_auditor)

    def test_dashboard_permite_administrador(self):
        self.client.force_authenticate(user=self.user_admin)
        res = self.client.get('/api/v1/transacciones/dashboard/resumen/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_dashboard_bloquea_operador(self):
        self.client.force_authenticate(user=self.user_operador)
        res = self.client.get('/api/v1/transacciones/dashboard/resumen/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_bloquea_auditor(self):
        self.client.force_authenticate(user=self.user_auditor)
        res = self.client.get('/api/v1/transacciones/dashboard/resumen/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_bloquea_anonimo(self):
        res = self.client.get('/api/v1/transacciones/dashboard/resumen/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class SeguimientoTrazabilidadLey21719TestCase(TestCase):
    """
    Pruebas de Blindaje de Trazabilidad y Segregación de Roles (Ley 21.719):
    - Paciente dueño del pedido -> HTTP 200 OK
    - Paciente intentando consultar folio de OTRO paciente -> HTTP 403 Forbidden
    - Operador/Administrador consultando cualquier pedido -> HTTP 200 OK
    """
    def setUp(self):
        from django.contrib.auth import get_user_model
        from django.contrib.auth.models import Group
        User = get_user_model()
        self.client = APIClient()

        # Crear Grupos
        self.grupo_paciente, _ = Group.objects.get_or_create(name='Paciente')
        self.grupo_operador, _ = Group.objects.get_or_create(name='Operador')

        # Paciente 1 (dueño de la solicitud)
        self.usuario_paciente1 = Usuario.objects.create(
            rut_usuario='18234567-8',
            nombres='Carlos',
            apellidos='Prado',
            correo_electronico='carlos.prado@email.com',
            contrasena_hash='hash123'
        )
        self.paciente1 = Paciente.objects.create(
            rut_usuario=self.usuario_paciente1,
            tipo_cliente=Paciente.TipoCliente.PARTICULAR
        )
        self.user_paciente1 = User.objects.create_user(username='18234567-8', password='password123', is_staff=False)
        self.user_paciente1.groups.add(self.grupo_paciente)

        # Paciente 2 (intruso intentando ver pedido de Paciente 1)
        self.usuario_paciente2 = Usuario.objects.create(
            rut_usuario='24533343-9',
            nombres='Mario',
            apellidos='González',
            correo_electronico='mario.gonzalez@email.com',
            contrasena_hash='hash123'
        )
        self.paciente2 = Paciente.objects.create(
            rut_usuario=self.usuario_paciente2,
            tipo_cliente=Paciente.TipoCliente.PARTICULAR
        )
        self.user_paciente2 = User.objects.create_user(username='24533343-9', password='password123', is_staff=False)
        self.user_paciente2.groups.add(self.grupo_paciente)

        # Operador
        self.user_operador = User.objects.create_user(username='operador_amaru', password='password123', is_staff=True)
        self.user_operador.groups.add(self.grupo_operador)

        # Armazón de prueba
        self.armazon = ArmazonInventario.objects.create(
            sku_armazon='EPP-LEY-01',
            modelo_lente='Lente Proteccion Titanio',
            caracteristicas_tecnicas={'material': 'TR90'},
            certificaciones_multiples=['ANSI Z87.1'],
            stock_disponible=10,
            precio_clp=65000
        )

        # Pedido perteneciente a Paciente 1
        self.solicitud = SolicitudEntrega.objects.create(
            folio_unico_qr='FOLIO-PACIENTE1',
            rut_paciente=self.paciente1,
            sku_armazon=self.armazon,
            estado_pedido=SolicitudEntrega.EstadoPedido.EN_FABRICACION
        )

    def test_paciente_puede_consultar_su_propio_pedido(self):
        self.client.force_authenticate(user=self.user_paciente1)
        res = self.client.get(f'/api/v1/transacciones/pedidos/{self.solicitud.folio_unico_qr}/seguimiento/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['folio'], 'FOLIO-PACIENTE1')
        self.assertEqual(res.data['rutTitular'], '18234567-8')

    def test_paciente_bloqueado_al_consultar_pedido_ajeno_ley_21719(self):
        self.client.force_authenticate(user=self.user_paciente2)
        res = self.client.get(f'/api/v1/transacciones/pedidos/{self.solicitud.folio_unico_qr}/seguimiento/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Ley 21.719', res.data['detail'])

    def test_paciente_bloqueado_en_comprobante_pdf_ajeno(self):
        self.client.force_authenticate(user=self.user_paciente2)
        res = self.client.get(f'/api/v1/transacciones/pedidos/{self.solicitud.folio_unico_qr}/comprobante-pdf/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Ley 21.719', res.data['detail'])

    def test_operador_puede_consultar_seguimiento_de_cualquier_pedido(self):
        self.client.force_authenticate(user=self.user_operador)
        res = self.client.get(f'/api/v1/transacciones/pedidos/{self.solicitud.folio_unico_qr}/seguimiento/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['folio'], 'FOLIO-PACIENTE1')

