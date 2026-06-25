"""
Extracción de texto desde PDFs de laboratorio con MarkItDown.

Usa la misma biblioteca que el servidor MCP oficial (herramienta
``convert_to_markdown`` de markitdown-mcp). Convierte el PDF a Markdown
estructurado antes del análisis clínico con el LLM.
"""

from __future__ import annotations

import logging
import os
from io import BytesIO
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

MIN_USABLE_MARKDOWN_CHARS = 80
MAX_MARKDOWN_CHARS = 100_000


def _markitdown_enabled() -> bool:
    return os.getenv("LAB_PDF_USE_MARKITDOWN", "true").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )


def _truncate_markdown(text: str) -> str:
    text = (text or "").strip()
    if len(text) <= MAX_MARKDOWN_CHARS:
        return text
    return (
        text[:MAX_MARKDOWN_CHARS]
        + "\n\n[... contenido truncado por límite de tamaño ...]"
    )


def convert_pdf_bytes_to_markdown(pdf_bytes: bytes) -> Tuple[Optional[str], Optional[str]]:
    """
    Convierte bytes de PDF a Markdown con MarkItDown.

    Returns:
        (markdown, error): markdown si la extracción fue útil; error si no aplica.
    """
    if not pdf_bytes:
        return None, "PDF vacío"

    if not _markitdown_enabled():
        return None, "MarkItDown deshabilitado (LAB_PDF_USE_MARKITDOWN=false)"

    try:
        from markitdown import MarkItDown
    except ImportError:
        return None, "Paquete markitdown no instalado en el backend"

    try:
        converter = MarkItDown(enable_plugins=False)
        stream = BytesIO(pdf_bytes)
        result = converter.convert_stream(stream, file_extension=".pdf")
        text = (getattr(result, "text_content", None) or "").strip()

        if len(text) < MIN_USABLE_MARKDOWN_CHARS:
            return (
                None,
                f"Texto insuficiente en el PDF ({len(text)} caracteres); "
                "puede ser un escaneo — se usará análisis visual.",
            )

        return _truncate_markdown(text), None
    except Exception as exc:
        logger.warning("MarkItDown no pudo convertir el PDF: %s", exc)
        return None, str(exc)
