import uuid
import re
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import AnonRateThrottle
from .models import RecetaOptica, ReservaHora
from .serializers import RecetaOpticaSerializer, ReservaHoraSerializer
from apps.autenticacion.models import NominaTrabajador


def obtener_variantes_rut(rut_str: str) -> list[str]:
    """
    Retorna variantes de formato para un RUT chileno (con/sin puntos, con/sin guión)
    para búsqueda flexible e infalible en la nómina oficial.
    """
    if not rut_str:
        return []
    raw = str(rut_str).strip()
    clean = re.sub(r'[^0-9kK]', '', raw).upper()
    variants = {raw, clean}
    if len(clean) >= 2:
        cuerpo = clean[:-1]
        dv = clean[-1]
        variants.add(f"{cuerpo}-{dv}")
        try:
            cuerpo_con_puntos = f"{int(cuerpo):,}".replace(",", ".")
            variants.add(f"{cuerpo_con_puntos}-{dv}")
        except ValueError:
            pass
    return list(variants)


class RecetaOpticaListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/clinico/recetas/?rut_paciente=<rut>
    POST /api/v1/clinico/recetas/

    Permite listar y registrar recetas médicas oftalmológicas.
    Valida vigencia de máx. 365 días al momento de registro.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = RecetaOpticaSerializer

    def get_queryset(self):
        qs = RecetaOptica.objects.select_related('rut_paciente__rut_usuario').order_by('-fecha_emision')
        rut = self.request.query_params.get('rut_paciente') or self.request.query_params.get('rut')
        if rut:
            qs = qs.filter(rut_paciente_id=rut.strip())
        return qs


class RecetaOpticaDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/clinico/recetas/<uuid:id_receta>/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = RecetaOpticaSerializer
    queryset = RecetaOptica.objects.select_related('rut_paciente__rut_usuario').all()
    lookup_field = 'id_receta'


class ReservaHoraCreateView(generics.CreateAPIView):
    """
    POST /api/v1/clinico/reservas/

    Permite agendar una evaluación oftalmológica para retención de pacientes
    cuya receta óptica superó los 365 días de vigencia.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ReservaHoraSerializer


class AdmisionPublicaView(APIView):
    """
    POST /api/v1/clinico/admision-publica/
    GET  /api/v1/clinico/admision-publica/?rut=<rut>

    HU-SEC-01: Escudo perimetral contra scraping y ataques de fuerza bruta
    de RUTs en el portal público de auto-atención (/qr) mediante AnonRateThrottle (10/min).
    HU-SEC-04: Validación de Identidad por Nómina Interna (Whitelist Oficial de Faena).
    """
    throttle_classes = [AnonRateThrottle]
    permission_classes = [AllowAny]

    def get(self, request):
        rut = request.query_params.get('rut') or request.query_params.get('rut_paciente')
        if not rut:
            return Response(
                {'error': 'Parámetro RUT requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        variantes = obtener_variantes_rut(rut)
        trabajador = NominaTrabajador.objects.filter(rut__in=variantes, habilitado=True).first()
        if not trabajador:
            return Response(
                {'error': 'RUT no habilitado en la nómina oficial de la faena. Contacte a RRHH.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response({
            'habilitado': True,
            'rut': trabajador.rut,
            'nombre_completo': trabajador.nombre_completo,
            'empresa_sindicato': trabajador.empresa_sindicato
        }, status=status.HTTP_200_OK)

    def post(self, request):
        rut = request.data.get('rut') or request.data.get('rut_paciente')
        nombre = request.data.get('nombre') or request.data.get('nombre_completo')
        consentimiento = request.data.get('consentimiento_ley_21719', False) or request.data.get('consentimiento', False)

        if not rut or not nombre:
            return Response(
                {'error': 'RUT y Nombre Completo son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not consentimiento:
            return Response(
                {'error': 'Debe aceptar el consentimiento informado según Ley N° 21.719.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validación Whitelist Nómina Oficial Faena (Anti-Fraude Costo $0)
        variantes = obtener_variantes_rut(rut)
        trabajador = NominaTrabajador.objects.filter(rut__in=variantes, habilitado=True).first()
        if not trabajador:
            return Response(
                {'error': 'RUT no habilitado en la nómina oficial de la faena. Contacte a RRHH.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Captura de IP para trazabilidad legal (HU-SEC-03)
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_origen = x_forwarded_for.split(',')[0].strip()
        else:
            ip_origen = request.META.get('REMOTE_ADDR')

        # Generar código único de pre-atención
        codigo_preingreso = f"PRE-{uuid.uuid4().hex[:6].upper()}"

        return Response({
            'status': 'success',
            'codigo_preingreso': codigo_preingreso,
            'rut': trabajador.rut,
            'nombre': trabajador.nombre_completo or str(nombre).strip(),
            'empresa_sindicato': trabajador.empresa_sindicato,
            'fecha_consentimiento': timezone.now().isoformat(),
            'ip_origen': ip_origen,
            'mensaje': 'Pre-ingreso registrado exitosamente en portal faena.'
        }, status=status.HTTP_201_CREATED)


