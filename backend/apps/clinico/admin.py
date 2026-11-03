from django.contrib import admin
from .models import RecetaOptica

@admin.register(RecetaOptica)
class RecetaOpticaAdmin(admin.ModelAdmin):
    pass