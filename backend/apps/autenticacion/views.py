from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista de autenticación JWT que utiliza CustomTokenObtainPairSerializer
    para inyectar username, is_staff y rol.
    """
    serializer_class = CustomTokenObtainPairSerializer

