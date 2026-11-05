from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

print("Iniciando creación de perfiles y usuarios de prueba para Óptica Amaru...")

# 1. Grupos / Roles
roles = ['Administrador', 'Operador', 'Auditor']
grupos = {}
for rol in roles:
    grupo, _ = Group.objects.get_or_create(name=rol)
    grupos[rol] = grupo

# 2. Cuentas de Personal Interno
cuentas_personal = [
    {
        'username': '15890123-4',
        'rut': '15890123-4',
        'email': 'admin@opticaamaru.cl',
        'first_name': 'Carlos',
        'last_name': 'Mendoza',
        'rol': 'Administrador',
        'is_staff': True,
        'is_superuser': True,
        'cargo': 'Administrador de Sucursal Calama'
    },
    {
        'username': '17456789-2',
        'rut': '17456789-2',
        'email': 'operador1@opticaamaru.cl',
        'first_name': 'Juanita',
        'last_name': 'Araya',
        'rol': 'Operador',
        'is_staff': True,
        'is_superuser': False,
        'cargo': 'Operador de Terminal Faena'
    },
    {
        'username': '16345678-K',
        'rut': '16345678-K',
        'email': 'auditor@opticaamaru.cl',
        'first_name': 'Rodrigo',
        'last_name': 'Sanhueza',
        'rol': 'Auditor',
        'is_staff': True,
        'is_superuser': False,
        'cargo': 'Auditor de Seguridad y Cumplimiento DS 594'
    }
]

for cuenta in cuentas_personal:
    user, created = User.objects.get_or_create(username=cuenta['username'])
    user.first_name = cuenta['first_name']
    user.last_name = cuenta['last_name']
    user.email = cuenta['email']
    user.is_staff = cuenta['is_staff']
    user.is_superuser = cuenta['is_superuser']
    user.set_password('Amaru2026*')
    user.save()
    user.groups.clear()
    user.groups.add(grupos[cuenta['rol']])
    try:
        from apps.personal.models import PersonalOptica
        PersonalOptica.objects.update_or_create(
            usuario=user,
            defaults={
                'rut_personal': cuenta['rut'],
                'rol': cuenta['rol'],
                'cargo': cuenta['cargo'],
                'activo': True
            }
        )
    except Exception:
        pass
    estado = "creado" if created else "actualizado"
    print(f"[{cuenta['rol']}] Usuario {user.username} ({user.first_name} {user.last_name}) {estado}.")

# 3. Paciente Registrado
user_paciente, created = User.objects.get_or_create(username='18234567-8')
user_paciente.first_name = 'Manuel'
user_paciente.last_name = 'Gutiérrez'
user_paciente.email = 'mgutierrez.centinela@minera.cl'
user_paciente.is_staff = False
user_paciente.is_superuser = False
user_paciente.set_password('Paciente2026*')
user_paciente.save()

try:
    from apps.pacientes.models import Paciente
    Paciente.objects.update_or_create(
        rut_paciente='18234567-8',
        defaults={
            'nombre_completo': 'Manuel Gutiérrez',
            'empresa_sindicato': 'Minera Centinela',
            'tipo_usuario': 'Convenio Minero',
            'telefono': '+56912345678',
            'consentimiento_ley_19628': True
        }
    )
except Exception:
    pass

estado_pac = "creado" if created else "actualizado"
print(f"[Paciente Registrado] RUT 18234567-8 (Manuel Gutiérrez) {estado_pac}.")

print("\n---------------------------------------------")
print("USUARIOS CREADOS EXITOSAMENTE")
print("Admin:    15890123-4 | Pass: Amaru2026*")
print("Operador: 17456789-2 | Pass: Amaru2026*")
print("Auditor:  16345678-K | Pass: Amaru2026*")
print("Paciente: 18234567-8 | Pass: Paciente2026*")
print("---------------------------------------------")