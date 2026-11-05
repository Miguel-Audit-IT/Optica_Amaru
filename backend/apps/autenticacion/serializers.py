from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import PersonalOptica


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializador personalizado de SimpleJWT que inyecta claims de RBAC
    (username, is_staff, rol) tanto en el payload del token JWT como en la
    respuesta JSON al iniciar sesión.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Inyectar claims personalizados en el payload del access token
        token['username'] = user.username
        token['is_staff'] = user.is_staff

        rol = 'ADMIN' if (user.is_staff or user.is_superuser) else 'OPERADOR'
        try:
            personal = PersonalOptica.objects.filter(rut_usuario_id=user.username).first()
            if personal and personal.rol_sistema:
                rol = personal.rol_sistema.upper()
        except Exception:
            pass

        token['rol'] = rol
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        rol = 'ADMIN' if (user.is_staff or user.is_superuser) else 'OPERADOR'
        try:
            personal = PersonalOptica.objects.filter(rut_usuario_id=user.username).first()
            if personal and personal.rol_sistema:
                rol = personal.rol_sistema.upper()
        except Exception:
            pass

        # Agregar datos de usuario y rol en el cuerpo de la respuesta para el frontend
        data['username'] = user.username
        data['is_staff'] = user.is_staff
        data['rol'] = rol
        return data

