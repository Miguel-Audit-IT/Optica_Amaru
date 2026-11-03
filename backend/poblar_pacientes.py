import os
import django

# Configurar el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amaru_project.settings')
django.setup()

from apps.autenticacion.models import Paciente, Usuario

def poblar_db():
    print("Iniciando la creación de 10 pacientes de prueba...")
    
    paciente_referencia = Paciente.objects.first()
    empresa_ref = getattr(paciente_referencia, 'id_empresa', None) if paciente_referencia else None

    for i in range(1, 11):
        rut_test = f"9999999{i}-K"
        
        # 1. Crear el registro usando los nombres de columna correctos
        usuario, created = Usuario.objects.get_or_create(
            rut_usuario=rut_test, 
            defaults={
                'nombres': f'Trabajador Demo {i}',
                'apellidos': 'Automático',
                'correo_electronico': f'demo{i}@amaru.cl',
                'contrasena_hash': 'sin_acceso_web'
            }
        )

        # 2. Crear el perfil de Paciente asociando la instancia correcta
        paciente, p_created = Paciente.objects.get_or_create(
            rut_usuario=usuario,
            defaults={
                'tipo_cliente': 'Convenio',
                'consentimiento_biometrico': True,
                'id_empresa': empresa_ref
            }
        )
        
        if p_created:
            print(f"✅ Paciente {rut_test} (Trabajador Demo {i}) creado exitosamente.")
        else:
            print(f"⚠️ El paciente {rut_test} ya existía, se omitió.")

if __name__ == '__main__':
    poblar_db()
    print("¡Proceso finalizado!")