import io
from unittest.mock import patch
from datetime import date
from PIL import Image
import pytesseract
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.serializers import ValidationError

from apps.autenticacion.models import NominaTrabajador, Usuario, Paciente
from apps.clinico.models import RecetaOptica
from apps.clinico.serializers import RecetaOpticaSerializer
from apps.clinico.ocr_validator import validar_receta_ocr


class NominaTrabajadorWhitelistTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/v1/clinico/admision-publica/'

        # Crear trabajador habilitado en nómina
        self.trabajador_ok = NominaTrabajador.objects.create(
            rut='12.345.678-9',
            nombre_completo='Juan Pérez Minero',
            empresa_sindicato='Minera Escondida',
            habilitado=True
        )

        # Crear trabajador inhabilitado
        self.trabajador_bloqueado = NominaTrabajador.objects.create(
            rut='98.765.432-1',
            nombre_completo='Pedro Desvinculado',
            empresa_sindicato='Minera Centinela',
            habilitado=False
        )

    def test_admision_rut_no_en_nomina_retorna_403(self):
        """Un trabajador que no está en la nómina debe recibir HTTP 403 Forbidden."""
        data = {
            'rut': '11.111.111-1',
            'nombre': 'Fantasma No Autorizado',
            'consentimiento_ley_21719': True
        }
        res = self.client.post(self.url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('RUT no habilitado en la nómina oficial de la faena. Contacte a RRHH.', res.data.get('error', ''))

    def test_admision_rut_inhabilitado_retorna_403(self):
        """Un trabajador en nómina pero con habilitado=False debe recibir HTTP 403 Forbidden."""
        data = {
            'rut': '98.765.432-1',
            'nombre': 'Pedro Desvinculado',
            'consentimiento_ley_21719': True
        }
        res = self.client.post(self.url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('RUT no habilitado en la nómina oficial de la faena. Contacte a RRHH.', res.data.get('error', ''))

    def test_admision_rut_habilitado_retorna_201(self):
        """Un trabajador habilitado en nómina debe registrar su pre-ingreso exitosamente."""
        data = {
            'rut': '12.345.678-9',
            'nombre': 'Juan Pérez Minero',
            'consentimiento_ley_21719': True
        }
        res = self.client.post(self.url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'success')
        self.assertTrue(res.data['codigo_preingreso'].startswith('PRE-'))
        self.assertEqual(res.data['empresa_sindicato'], 'Minera Escondida')

    def test_admision_formato_rut_flexible(self):
        """La búsqueda de nómina debe funcionar aun si el usuario escribe el RUT sin puntos."""
        data = {
            'rut': '12345678-9',  # En nómina está guardado como 12.345.678-9
            'nombre': 'Juan Pérez',
            'consentimiento_ley_21719': True
        }
        res = self.client.post(self.url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_get_admision_verificacion_onblur(self):
        """El endpoint GET /api/v1/clinico/admision-publica/?rut=... valida disponibilidad previa."""
        # Consulta de RUT habilitado
        res_ok = self.client.get(f"{self.url}?rut=12.345.678-9")
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertTrue(res_ok.data['habilitado'])

        # Consulta de RUT no habilitado
        res_no = self.client.get(f"{self.url}?rut=99.999.999-9")
        self.assertEqual(res_no.status_code, status.HTTP_403_FORBIDDEN)


class OCRValidatorAntiFraudeTestCase(TestCase):
    def _crear_imagen_dummy(self):
        img = Image.new('RGB', (100, 50), color=(255, 255, 255))
        byte_arr = io.BytesIO()
        img.save(byte_arr, format='JPEG')
        byte_arr.seek(0)
        return SimpleUploadedFile("receta.jpg", byte_arr.read(), content_type="image/jpeg")

    @patch('pytesseract.image_to_string')
    def test_ocr_coincidencia_exitosa(self, mock_ocr):
        """Cuando el OCR encuentra el RUT y el año de emisión, la validación pasa sin error."""
        mock_ocr.return_value = "CLINICA OFTALMOLOGICA\nPaciente RUT: 24.533.343-K\nFecha: 15/05/2026\nEsfera OD: -1.50"
        archivo = self._crear_imagen_dummy()

        # No debe levantar ninguna excepción
        try:
            validar_receta_ocr(
                archivo_imagen=archivo,
                rut_esperado='24.533.343-K',
                fecha_emision_esperada=date(2026, 5, 15)
            )
        except ValidationError:
            self.fail("validar_receta_ocr levantó ValidationError inesperadamente cuando los datos coinciden.")

    @patch('pytesseract.image_to_string')
    def test_ocr_alerta_fraude_rut_discrepante(self, mock_ocr):
        """Si el RUT del documento no coincide con el del paciente, debe levantar ValidationError."""
        mock_ocr.return_value = "RECETA MEDICA\nRUT: 11.222.333-4\nFecha: 10/02/2026"
        archivo = self._crear_imagen_dummy()

        with self.assertRaises(ValidationError) as ctx:
            validar_receta_ocr(
                archivo_imagen=archivo,
                rut_esperado='24.533.343-K',
                fecha_emision_esperada=date(2026, 2, 10)
            )
        self.assertIn("Alerta de Fraude", str(ctx.exception))

    @patch('pytesseract.image_to_string')
    def test_ocr_alerta_fraude_anio_discrepante(self, mock_ocr):
        """Si el año de emisión no coincide, debe levantar ValidationError."""
        mock_ocr.return_value = "RECETA MEDICA\nRUT: 24.533.343-K\nFecha: 10/02/2023"  # Año 2023 vs 2026
        archivo = self._crear_imagen_dummy()

        with self.assertRaises(ValidationError) as ctx:
            validar_receta_ocr(
                archivo_imagen=archivo,
                rut_esperado='24.533.343-K',
                fecha_emision_esperada=date(2026, 2, 10)
            )
        self.assertIn("Alerta de Fraude", str(ctx.exception))

    @patch('pytesseract.image_to_string')
    def test_ocr_tesseract_no_instalado_bypass_elegante(self, mock_ocr):
        """Si Tesseract no está instalado en el SO, debe realizar un bypass elegante sin romper la app."""
        mock_ocr.side_effect = pytesseract.TesseractNotFoundError()
        archivo = self._crear_imagen_dummy()

        # No debe levantar ValidationError
        try:
            validar_receta_ocr(
                archivo_imagen=archivo,
                rut_esperado='24.533.343-K',
                fecha_emision_esperada=date(2026, 2, 10)
            )
        except Exception as e:
            self.fail(f"validar_receta_ocr no manejó el bypass de TesseractNotFoundError: {e}")

    @patch('pytesseract.image_to_string')
    def test_serializer_ejecuta_validacion_ocr_con_archivo(self, mock_ocr):
        """El serializador RecetaOpticaSerializer invoca validar_receta_ocr y detiene fraude si no coincide."""
        mock_ocr.return_value = "RECETA CON RUT AJENO 11.222.333-4 Y ANIO 2026"
        usuario = Usuario.objects.create(
            rut_usuario='24.533.343-K',
            nombres='Carlos',
            apellidos='Cobre',
            correo_electronico='carlos@amaru.cl',
            contrasena_hash='hash123'
        )
        paciente = Paciente.objects.create(
            rut_usuario=usuario,
            tipo_cliente=Paciente.TipoCliente.PARTICULAR
        )
        archivo = self._crear_imagen_dummy()

        serializer = RecetaOpticaSerializer(data={
            'rut_paciente': paciente.pk,
            'fecha_emision': date.today().isoformat(),
            'parametros_oftalmologicos': {
                'ojo_derecho': {'esfera': -1.0},
                'ojo_izquierdo': {'esfera': -1.0}
            },
            'archivo_receta': archivo
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("Alerta de Fraude", str(serializer.errors))


class RecetaOpticaSerializerSanitizacionTestCase(TestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create(
            rut_usuario='24533343-9',
            nombres='Trabajador',
            apellidos='Optisalud',
            correo_electronico='trabajador@optisalud.cl',
            contrasena_hash='hash123'
        )
        self.paciente = Paciente.objects.create(
            rut_usuario=self.usuario,
            tipo_cliente=Paciente.TipoCliente.CONVENIO
        )

    def test_sanitizacion_completa_multipart_form_data(self):
        """
        Valida que to_internal_value normalice:
        1. fecha_emision en formato DD-MM-YYYY -> YYYY-MM-DD
        2. Valores con coma decimal '-1,50' -> -1.50
        3. rut_paciente enviado como string con puntos/guión -> paciente.pk
        """
        from django.http import QueryDict

        # Simular QueryDict generado por multipart/form-data
        qd = QueryDict('', mutable=True)
        qd['rut_paciente'] = '24.533.343-9'  # Viene con puntos, en DB es 24533343-9
        qd['fecha_emision'] = date.today().strftime('%d-%m-%Y')  # Formato DD-MM-YYYY
        qd['esfera_od'] = '-1,50'
        qd['cilindro_od'] = '-0,75'
        qd['eje_od'] = '90'
        qd['adicion_od'] = '+1,75'
        qd['dp_od'] = '31,5'
        qd['esfera_oi'] = '-1,25'
        qd['cilindro_oi'] = '-0,50'
        qd['eje_oi'] = '85'
        qd['adicion_oi'] = '+1,75'
        qd['dp_oi'] = '31,0'
        qd['observaciones'] = 'Trabajador requiere filtro azul'

        serializer = RecetaOpticaSerializer(data=qd)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        receta = serializer.save()

        self.assertEqual(receta.rut_paciente, self.paciente)
        self.assertEqual(receta.fecha_emision, date.today())
        params = receta.parametros_oftalmologicos
        self.assertEqual(params['ojo_derecho']['esfera'], -1.5)
        self.assertEqual(params['ojo_derecho']['cilindro'], -0.75)
        self.assertEqual(params['ojo_derecho']['adicion'], 1.75)
        self.assertEqual(params['ojo_derecho']['dp'], 31.5)
        self.assertEqual(params['ojo_izquierdo']['esfera'], -1.25)
        self.assertEqual(params['ojo_izquierdo']['cilindro'], -0.5)

    def test_sanitizacion_parametros_json_con_comas(self):
        """Valida que si parametros_oftalmologicos viaja como JSON string con comas, se sanitice."""
        import json
        payload = {
            'rut_paciente': '24533343-9',
            'fecha_emision': date.today().strftime('%d/%m/%Y'),
            'parametros_oftalmologicos': json.dumps({
                'ojo_derecho': {'esfera': '-2,25', 'cilindro': '-1,00', 'eje': 90},
                'ojo_izquierdo': {'esfera': '-2,00', 'cilindro': '-0,50', 'eje': 85}
            })
        }
        serializer = RecetaOpticaSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        validated = serializer.validated_data
        self.assertEqual(validated['parametros_oftalmologicos']['ojo_derecho']['esfera'], -2.25)
        self.assertEqual(validated['parametros_oftalmologicos']['ojo_derecho']['cilindro'], -1.0)

    @patch('pytesseract.image_to_string')
    def test_save_con_archivo_receta_no_lanza_typeerror(self, mock_ocr):
        """Valida que serializer.save() con archivo_receta no lance TypeError al persistir en BD."""
        mock_ocr.return_value = "RECETA MEDICA RUT: 24533343-9 FECHA 2026"
        archivo = SimpleUploadedFile("receta.pdf", b"%PDF-1.4 dummy content", content_type="application/pdf")

        serializer = RecetaOpticaSerializer(data={
            'rut_paciente': self.paciente.pk,
            'fecha_emision': date.today().isoformat(),
            'parametros_oftalmologicos': {
                'ojo_derecho': {'esfera': -1.0, 'cilindro': 0.0, 'eje': 0},
                'ojo_izquierdo': {'esfera': -1.0, 'cilindro': 0.0, 'eje': 0}
            },
            'archivo_receta': archivo
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        receta = serializer.save()
        self.assertIsNotNone(receta.id_receta)
        self.assertEqual(receta.rut_paciente, self.paciente)
        self.assertTrue(receta.archivo_url.startswith('/media/recetas/'))

