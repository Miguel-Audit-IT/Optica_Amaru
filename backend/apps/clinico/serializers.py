from datetime import date
from django.utils import timezone
from rest_framework import serializers
from .models import RecetaOptica, ReservaHora
from apps.autenticacion.models import Paciente


class RecetaOpticaSerializer(serializers.ModelSerializer):
    """
    Serializador para recetas ópticas con validación de vigencia (máx. 365 días).
    """
    rut_paciente = serializers.PrimaryKeyRelatedField(
        queryset=Paciente.objects.all()
    )
    es_vigente = serializers.SerializerMethodField(read_only=True)
    dias_antiguedad = serializers.SerializerMethodField(read_only=True)
    paciente_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RecetaOptica
        fields = [
            'id_receta',
            'rut_paciente',
            'paciente_nombre',
            'fecha_emision',
            'parametros_oftalmologicos',
            'archivo_url',
            'version_seq',
            'es_vigente',
            'dias_antiguedad',
        ]
        read_only_fields = ['id_receta', 'version_seq', 'es_vigente', 'dias_antiguedad']

    def get_es_vigente(self, obj: RecetaOptica) -> bool:
        if not obj.fecha_emision:
            return False
        hoy = timezone.now().date()
        dias = (hoy - obj.fecha_emision).days
        return 0 <= dias <= 365

    def get_dias_antiguedad(self, obj: RecetaOptica) -> int:
        if not obj.fecha_emision:
            return 9999
        hoy = timezone.now().date()
        return (hoy - obj.fecha_emision).days

    def get_paciente_nombre(self, obj: RecetaOptica) -> str:
        try:
            u = obj.rut_paciente.rut_usuario
            return f"{u.nombres} {u.apellidos}"
        except Exception:
            return str(obj.rut_paciente_id)

    def validate_fecha_emision(self, value: date) -> date:
        hoy = timezone.now().date()
        if value > hoy:
            raise serializers.ValidationError("La fecha de emisión no puede ser una fecha futura.")
        dias = (hoy - value).days
        if dias > 365:
            raise serializers.ValidationError(
                f"La receta médica está vencida ({dias} días de antigüedad). "
                "La normativa vigente exige un máximo de 365 días para la fabricación de EPP óptico certificado."
            )
        return value

    def validate_parametros_oftalmologicos(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Los parámetros oftalmológicos deben ser un objeto JSON.")
        return value


class ReservaHoraSerializer(serializers.ModelSerializer):
    rut_paciente = serializers.PrimaryKeyRelatedField(
        queryset=Paciente.objects.all()
    )

    class Meta:
        model = ReservaHora
        fields = [
            'id_reserva',
            'rut_paciente',
            'fecha_hora_reserva',
            'estado_reserva',
        ]
        read_only_fields = ['id_reserva']

