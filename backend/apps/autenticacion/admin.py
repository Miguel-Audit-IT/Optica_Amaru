from django.contrib import admin
from .models import Paciente, TitularPago

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    pass

@admin.register(TitularPago)
class TitularPagoAdmin(admin.ModelAdmin):
    pass