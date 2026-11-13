"""
setup_roles.py
Configuración de Grupos (Roles) y Permisos RBAC para Óptica Amaru.
Roles creados:
  - Administrador: Acceso total al Dashboard, reportes y trazabilidad.
  - Auditor: Acceso a auditoría y trazabilidad DS 594 (SIN acceso al Dashboard Gerencial).
  - Operador: Acceso operativo a terminal y despacho (SIN acceso al Dashboard Gerencial).
"""
import os
import sys
import django

# Asegurar path al backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amaru_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.autenticacion.models import Usuario, PersonalOptica

User = get_user_model()


def setup_rbac():
    print("=" * 60)
    print("CONFIGURANDO ROLES Y PERMISOS RBAC - ÓPTICA AMARU")
    print("=" * 60)

    # 1. Obtener o crear ContentType para la app autenticación
    ct_personal, _ = ContentType.objects.get_or_create(
        app_label='autenticacion',
        model='personaloptica'
    )

    # 2. Crear permisos personalizados
    perm_dashboard, _ = Permission.objects.get_or_create(
        codename='ver_dashboard',
        content_type=ct_personal,
        defaults={'name': 'Puede ver Dashboard Gerencial'}
    )
    perm_trazabilidad, _ = Permission.objects.get_or_create(
        codename='ver_trazabilidad',
        content_type=ct_personal,
        defaults={'name': 'Puede ver Trazabilidad y Seguimiento'}
    )
    print(f"[OK] Permisos verificados: '{perm_dashboard.codename}', '{perm_trazabilidad.codename}'")

    # 3. Crear o actualizar los Grupos (Roles)
    grupo_admin, _ = Group.objects.get_or_create(name='Administrador')
    grupo_auditor, _ = Group.objects.get_or_create(name='Auditor')
    grupo_operador, _ = Group.objects.get_or_create(name='Operador')

    # Asignar permisos específicos:
    # - Administrador: ver_dashboard y ver_trazabilidad
    grupo_admin.permissions.add(perm_dashboard, perm_trazabilidad)
    print("[OK] Grupo 'Administrador' configurado con permisos: [ver_dashboard, ver_trazabilidad]")

    # - Auditor: ver_trazabilidad (SIN ver_dashboard)
    grupo_auditor.permissions.remove(perm_dashboard)
    grupo_auditor.permissions.add(perm_trazabilidad)
    print("[OK] Grupo 'Auditor' configurado con permisos: [ver_trazabilidad]")

    # - Operador: ver_trazabilidad (SIN ver_dashboard)
    grupo_operador.permissions.remove(perm_dashboard)
    grupo_operador.permissions.add(perm_trazabilidad)
    print("[OK] Grupo 'Operador' configurado con permisos: [ver_trazabilidad]")

    # 4. Vincular usuarios a sus respectivos grupos y roles en PersonalOptica
    asignaciones = [
        ('15890123-4', 'admin@opticaamaru.cl', 'Carlos', 'Mendoza', 'Administrador', PersonalOptica.RolSistema.ADMIN, True, True),
        ('17456789-2', 'operador1@opticaamaru.cl', 'Juanita', 'Araya', 'Operador', PersonalOptica.RolSistema.OPERADOR, True, False),
        ('16345678-K', 'auditor@opticaamaru.cl', 'Rodrigo', 'Sanhueza', 'Auditor', PersonalOptica.RolSistema.AUDITOR, True, False),
    ]

    for rut, email, nombre, apellido, rol_grupo, rol_personal, is_staff, is_superuser in asignaciones:
        # Asegurar existencia en tabla Usuario
        Usuario.objects.update_or_create(
            rut_usuario=rut,
            defaults={
                'nombres': nombre,
                'apellidos': apellido,
                'correo_electronico': email,
                'contrasena_hash': 'sha256$placeholder'
            }
        )

        user, created = User.objects.get_or_create(username=rut)
        user.first_name = nombre
        user.last_name = apellido
        user.email = email
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.set_password('Amaru2026*')
        user.save()
        user.groups.clear()
        if rol_grupo == 'Administrador':
            user.groups.add(grupo_admin)
        elif rol_grupo == 'Auditor':
            user.groups.add(grupo_auditor)
        elif rol_grupo == 'Operador':
            user.groups.add(grupo_operador)

        # Sincronizar en PersonalOptica
        PersonalOptica.objects.update_or_create(
            rut_usuario_id=rut,
            defaults={'rol_sistema': rol_personal}
        )
        print(f"  -> Usuario {rut} ({nombre} {apellido}) asignado a Grupo '{rol_grupo}' (Rol sistema: {rol_personal})")

    print("\n" + "=" * 60)
    print("RBAC CONFIGURADO CON ÉXITO")
    print("=" * 60)


if __name__ == '__main__':
    setup_rbac()
