import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amaru_project.settings')
django.setup()

from django.apps import apps

print("Buscando el modelo Paciente y NominaTrabajador en el sistema...")

Paciente = None
NominaTrabajador = None
Usuario = None

for app in apps.get_app_configs():
    try:
        if not Paciente:
            Paciente = app.get_model('Paciente')
    except LookupError:
        pass
        
    try:
        if not NominaTrabajador:
            NominaTrabajador = app.get_model('NominaTrabajador')
    except LookupError:
        pass
        
    try:
        if not Usuario:
            Usuario = app.get_model('Usuario')
    except LookupError:
        pass

if not NominaTrabajador:
    print("❌ Error: No se encontró el modelo NominaTrabajador.")
else:
    print(f"✅ Modelo NominaTrabajador encontrado en la app: {NominaTrabajador._meta.app_label}")
    # Inyectamos en la nómina para que pase la validación 403
    obj, created = NominaTrabajador.objects.update_or_create(
        rut='24533343-9',
        defaults={
            'nombre_completo': 'Trabajador Optisalud Demo',
            'empresa_sindicato': 'Minera Escondida',
            'habilitado': True
        }
    )
    print("✅ RUT 24533343-9 habilitado en la Nómina de Faena.")

if not Paciente:
    print("❌ Error: No se encontró el modelo Paciente en ninguna de tus apps.")
else:
    print(f"✅ Modelo Paciente encontrado en la app: {Paciente._meta.app_label}")
    try:
        # 1. Crear el registro base en Usuario (requerido por tu SQL REFERENCES)
        if Usuario:
            usr, usr_created = Usuario.objects.get_or_create(
                rut_usuario='24533343-9',
                defaults={
                    'nombres': 'Trabajador',
                    'apellidos': 'Optisalud',
                    'correo_electronico': 'test@optisalud.cl',
                    'contrasena_hash': 'demo123'
                }
            )
            
        # 2. Crear el Paciente apuntando a Usuario usando 'rut_usuario'
        paciente, created = Paciente.objects.update_or_create(
            rut_usuario_id='24533343-9', # Usamos _id para evitar el require_model de Django
            defaults={
                'tipo_cliente': 'Convenio',
                'consentimiento_biometrico': True,
                'id_empresa_id': 1 # Asumimos ID 1 para minera escondida
            }
        )
        print("✅ Paciente 24533343-9 forzado con éxito usando 'rut_usuario_id'.")
    except Exception as e:
        print(f"❌ Error al crear paciente: {e}")