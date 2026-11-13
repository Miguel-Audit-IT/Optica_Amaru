from django.urls import path
from .views import (
    RecetaOpticaListCreateView,
    RecetaOpticaDetailView,
    ReservaHoraCreateView,
    AdmisionPublicaView,
)

urlpatterns = [
    path('recetas/', RecetaOpticaListCreateView.as_view(), name='receta-list-create'),
    path('recetas/<uuid:id_receta>/', RecetaOpticaDetailView.as_view(), name='receta-detail'),
    path('reservas/', ReservaHoraCreateView.as_view(), name='reserva-hora-create'),
    path('admision-publica/', AdmisionPublicaView.as_view(), name='admision-publica'),
]

