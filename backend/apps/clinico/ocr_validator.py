import logging
import re
from PIL import Image, UnidentifiedImageError
import pytesseract
from rest_framework.serializers import ValidationError

logger = logging.getLogger(__name__)


def validar_receta_ocr(archivo_imagen, rut_esperado, fecha_emision_esperada):
    """
    Validación Anti-Fraude con OCR Local (Tesseract - Costo $0).
    Verifica que la fotografía o escaneo de la receta médica contenga:
    1. El año de emisión esperado (ej: '2026').
    2. El cuerpo numérico del RUT del paciente (ej: '24533343' para '24.533.343-K').

    Si Tesseract no está instalado en el SO del servidor (TesseractNotFoundError),
    realiza un bypass elegante registrando un warning en logs para no interrumpir
    el flujo en entornos sin binarios locales de OCR instalados.
    """
    if not archivo_imagen:
        return

    # 1. Extraer año esperado (ej: '2026')
    if hasattr(fecha_emision_esperada, 'year'):
        anio_esperado = str(fecha_emision_esperada.year)
    elif isinstance(fecha_emision_esperada, str) and len(fecha_emision_esperada) >= 4:
        anio_esperado = fecha_emision_esperada[:4]
    else:
        anio_esperado = str(fecha_emision_esperada or '')

    # 2. Extraer cuerpo numérico del RUT (ej: '24533343' de '24.533.343-K')
    if hasattr(rut_esperado, 'rut_usuario_id'):
        rut_str = str(rut_esperado.rut_usuario_id)
    elif hasattr(rut_esperado, 'pk'):
        rut_str = str(rut_esperado.pk)
    else:
        rut_str = str(rut_esperado or '')

    rut_limpio = re.sub(r'[^0-9kK]', '', rut_str).upper()
    cuerpo_rut = rut_limpio[:-1] if len(rut_limpio) > 1 else rut_limpio

    # 3. Lectura de imagen en memoria y extracción OCR
    try:
        archivo_imagen.seek(0)
        try:
            img = Image.open(archivo_imagen)
        except (UnidentifiedImageError, OSError):
            # Archivo no soportado directamente por Pillow (ej. documento PDF)
            archivo_imagen.seek(0)
            return

        texto_extraido = pytesseract.image_to_string(img)
    except (pytesseract.TesseractNotFoundError, FileNotFoundError):
        logger.warning(
            "Tesseract OCR no está disponible o no se encuentra instalado en el sistema. "
            "Omitiendo validación OCR de receta para permitir la operación en este entorno."
        )
        return
    except Exception as e:
        logger.warning(
            f"Error no crítico durante el procesamiento OCR de receta: {e}. Omitiendo validación."
        )
        return
    finally:
        archivo_imagen.seek(0)

    # 4. Normalización y verificación de datos críticos
    texto_ocr_limpio = re.sub(r'[^0-9a-zA-Z]', '', texto_extraido.upper())

    coincide_rut = bool(cuerpo_rut and (cuerpo_rut in texto_ocr_limpio))
    coincide_anio = bool(anio_esperado and (anio_esperado in texto_ocr_limpio))

    if not coincide_rut or not coincide_anio:
        raise ValidationError(
            "Alerta de Fraude: El RUT o el año de emisión no coinciden con el documento físico adjunto"
        )

