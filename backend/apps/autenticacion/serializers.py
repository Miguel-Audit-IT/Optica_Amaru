from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import PersonalOptica, Paciente


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializador personalizado de SimpleJWT que inyecta claims de RBAC
    (username, is_staff, rol) tanto en el payload del token JWT como en la
    respuesta JSON al iniciar sesión.
    """

    @classmethod
    def _determinar_rol(cls, user) -> str:
        """
        Determina con precisión el rol RBAC del usuario.
        Roles admitidos: Administrador, Auditor, Operador, Paciente.
        """
        if user.is_superuser or user.groups.filter(name__iexact='Administrador').exists():
            return 'Administrador'
        elif user.groups.filter(name__iexact='Auditor').exists():
            return 'Auditor'
        elif user.groups.filter(name__iexact='Operador').exists():
            return 'Operador'
        elif user.groups.filter(name__iexact='Paciente').exists():
            return 'Paciente'
        else:
            try:
                personal = PersonalOptica.objects.filter(rut_usuario_id=user.username).first()
                if personal and personal.rol_sistema:
                    return 'Administrador' if personal.rol_sistema.lower() == 'admin' else personal.rol_sistema.capitalize()
                elif user.is_staff:
                    return 'Administrador'
                elif Paciente.objects.filter(rut_usuario_id=user.username).exists():
                    return 'Paciente'
            except Exception:
                pass
        return 'Paciente'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Inyectar claims personalizados en el payload del access token
        rol = cls._determinar_rol(user)
        token['username'] = user.username
        token['rut'] = user.username
        token['is_staff'] = user.is_staff
        token['rol'] = rol
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        rol = self._determinar_rol(user)

        # Agregar datos de usuario y rol en el cuerpo de la respuesta para el frontend
        data['username'] = user.username
        data['rut'] = user.username
        data['is_staff'] = user.is_staff
        data['rol'] = rol
        return data


class PacienteSerializer(serializers.ModelSerializer):
    """
    HU-SEC-03: Serializador de Paciente con captura de IP de origen y timestamp
    para cumplimiento de consentimiento según la Ley N° 21.719.
    """
    class Meta:
        model = Paciente
        fields = [
            'rut_usuario',
            'tipo_cliente',
            'id_empresa',
            'consentimiento_biometrico',
            'consentimiento_ley_21719',
            'fecha_consentimiento',
            'ip_origen',
        ]
        read_only_fields = ['fecha_consentimiento', 'ip_origen']

    def create(self, validated_data):
        # Captura de IP desde request.META (soporta proxy/reverse-proxy con X-Forwarded-For)
        request = self.context.get('request')
        if request and hasattr(request, 'META'):
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')
            validated_data['ip_origen'] = ip

        # Timestamp automático al momento del consentimiento Ley 21.719
        if validated_data.get('consentimiento_ley_21719'):
            validated_data['fecha_consentimiento'] = timezone.now()

        return super().create(validated_data)
