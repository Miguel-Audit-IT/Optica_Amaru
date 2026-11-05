from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import RecetaOptica, ReservaHora
from .serializers import RecetaOpticaSerializer, ReservaHoraSerializer


class RecetaOpticaListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/clinico/recetas/?rut_paciente=<rut>
    POST /api/v1/clinico/recetas/

    Permite listar y registrar recetas médicas oftalmológicas.
    Valida vigencia de máx. 365 días al momento de registro.
    """
    permission_classes = [IsAuthenticated]
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

