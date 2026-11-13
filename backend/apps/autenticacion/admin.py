from django.contrib import admin
from .models import Paciente, TitularPago, NominaTrabajador

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    pass

@admin.register(TitularPago)
class TitularPagoAdmin(admin.ModelAdmin):
    pass

@admin.register(NominaTrabajador)
class NominaTrabajadorAdmin(admin.ModelAdmin):
    list_display = ('rut', 'nombre_completo', 'empresa_sindicato', 'habilitado')
    search_fields = ('rut', 'nombre_completo', 'empresa_sindicato')
    list_filter = ('habilitado', 'empresa_sindicato')