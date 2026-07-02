"""Normalización y validación de documentos de cédula profesional (upload)."""
from __future__ import annotations

import io
from typing import Optional, Tuple

MAX_IMAGE_EDGE = 2400
JPEG_QUALITY = 88

PDF_SIGNATURE = b"%PDF"
JPEG_SIGNATURE = b"\xff\xd8\xff"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def _is_webp(data: bytes) -> bool:
    return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"


def _is_heic(data: bytes) -> bool:
    if len(data) < 12 or data[4:8] != b"ftyp":
        return False
    brand = data[8:12]
    return brand in (b"heic", b"heix", b"hevc", b"hevx", b"mif1", b"msf1", b"avif")


def detect_cedula_media_type(data: bytes) -> Optional[Tuple[str, str]]:
    """Detecta MIME y extensión reales leyendo los bytes del archivo."""
    if not data:
        return None
    if data.startswith(PDF_SIGNATURE):
        return "application/pdf", ".pdf"
    if data.startswith(JPEG_SIGNATURE):
        return "image/jpeg", ".jpg"
    if data.startswith(PNG_SIGNATURE):
        return "image/png", ".png"
    if _is_webp(data):
        return "image/webp", ".webp"
    if _is_heic(data):
        return "image/heic", ".heic"
    return None


def _try_convert_heic_to_jpeg(data: bytes) -> Optional[bytes]:
    try:
        import pillow_heif  # type: ignore
        from PIL import Image

        pillow_heif.register_heif_opener()
        image = Image.open(io.BytesIO(data))
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        return output.getvalue()
    except Exception:
        return None


def _optimize_raster_image(data: bytes) -> Tuple[bytes, str, str]:
    from PIL import Image, ImageOps

    image = Image.open(io.BytesIO(data))
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass

    width, height = image.size
    if max(width, height) > MAX_IMAGE_EDGE:
        scale = MAX_IMAGE_EDGE / max(width, height)
        image = image.resize(
            (int(width * scale), int(height * scale)),
            Image.Resampling.LANCZOS,
        )

    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    output = io.BytesIO()
    image.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return output.getvalue(), "image/jpeg", ".jpg"


def prepare_cedula_upload(data: bytes, claimed_type: str = "") -> Tuple[bytes, str, str]:
    """
    Valida el documento por contenido real (no solo Content-Type del navegador).
    Convierte HEIC/WebP y fotos muy grandes a JPEG legible en admin y navegadores.
    """
    detected = detect_cedula_media_type(data)
    if not detected:
        raise ValueError(
            "No pudimos leer el archivo. Usa PDF, JPG o PNG nítido. "
            "Si es foto de iPhone (HEIC), guárdala como JPG o activa "
            "Ajustes → Cámara → Formatos → Más compatible."
        )

    mime, ext = detected

    if mime == "image/heic":
        converted = _try_convert_heic_to_jpeg(data)
        if not converted:
            raise ValueError(
                "Formato HEIC no se pudo convertir. Exporta la imagen como JPG o PDF e intenta de nuevo."
            )
        return converted, "image/jpeg", ".jpg"

    if mime == "application/pdf":
        return data, mime, ext

    if mime in ("image/jpeg", "image/png", "image/webp"):
        should_optimize = (
            mime in ("image/png", "image/webp")
            or len(data) > 1_500_000
        )
        if should_optimize:
            try:
                return _optimize_raster_image(data)
            except Exception:
                if mime == "image/jpeg":
                    return data, mime, ext
                raise ValueError(
                    "No pudimos procesar la imagen. Intenta con JPG o PDF más nítido."
                ) from None
        return data, mime, ext

    raise ValueError("Tipo de archivo no permitido. Sube PDF, JPG o PNG.")
