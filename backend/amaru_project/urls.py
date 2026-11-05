from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.autenticacion.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/clinico/', include('apps.clinico.urls')),
    path('api/v1/', include('apps.transacciones.urls')),
]
