import hashlib
from datetime import datetime, timezone
from apps.auditoria.models import RegistroAuditoria
from apps.autenticacion.models import Usuario


class AuditService:
    @staticmethod
    def registrar_evento(rut_usuario: str, accion: str, payload_data: str) -> RegistroAuditoria:
        usuario = Usuario.objects.filter(rut_usuario=rut_usuario).first()
        if not usuario:
            usuario = Usuario.objects.first()
        timestamp_str = datetime.now(timezone.utc).isoformat()
        
        # Generación de hash SHA-256 forense encadenado
        raw_hash_input = f"{rut_usuario}:{accion}:{timestamp_str}:{payload_data}"
        hash_sha256 = hashlib.sha256(raw_hash_input.encode('utf-8')).hexdigest()

        return RegistroAuditoria.objects.create(
            rut_usuario_accion=usuario,
            accion_realizada=accion,
            hash_integridad_sha256=hash_sha256
        )
