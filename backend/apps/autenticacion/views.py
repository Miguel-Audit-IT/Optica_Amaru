from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista de autenticación JWT que utiliza CustomTokenObtainPairSerializer
    para inyectar username, is_staff y rol.

    HU-SEC-01: throttle_classes con AnonRateThrottle para evitar ataques
    de diccionario y fuerza bruta contra las contraseñas de los operadores.
    """
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AnonRateThrottle]

