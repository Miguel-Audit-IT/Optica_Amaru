import magic
from django.core.exceptions import ValidationError


def validar_magic_bytes(file):
    """
    HU-SEC-02: Validador de tipo MIME real por firma de bytes (magic bytes).
    Verifica que los primeros 2048 bytes correspondan estrictamente a PDF, JPEG o PNG.
    Incluye fallback manual por firma binaria si libmagic no está disponible.
    """
    # Tipos MIME permitidos
    valid_mime_types = ['application/pdf', 'image/jpeg', 'image/png']
    
    # Leer los primeros 2048 bytes
    file_bytes = file.read(2048)
    file.seek(0)  # Devolver el puntero al inicio para que Django pueda guardarlo
    
    try:
        # Intentar validación con libmagic
        mime_type = magic.from_buffer(file_bytes, mime=True)
    except Exception:
        # Fallback manual básico si falla libmagic en el SO
        if file_bytes.startswith(b'%PDF'):
            mime_type = 'application/pdf'
        elif file_bytes.startswith(b'\xFF\xD8\xFF'):
            mime_type = 'image/jpeg'
        elif file_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
            mime_type = 'image/png'
        else:
            mime_type = 'unknown'

    if mime_type not in valid_mime_types:
        raise ValidationError(f"Formato de archivo corrupto o inválido. Detectado: {mime_type}")


# Alias para compatibilidad
validar_tipo_archivo_permitido = validar_magic_bytes
