"""OCR de documentos de cédula profesional con visión (Claude / Anthropic)."""
from __future__ import annotations

import asyncio
import base64
import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import certifi
import httpx

from cedula_document import detect_cedula_media_type
from supabase_client import get_profile, resolve_cedula_document_url, update_profile

try:
    from anthropic import Anthropic  # type: ignore
    from anthropic._exceptions import APIStatusError  # type: ignore
except Exception:  # noqa: BLE001
    Anthropic = None  # type: ignore[assignment]
    APIStatusError = Exception  # type: ignore[assignment]

CEDULA_OCR_PROMPT = """Analiza este documento de registro profesional veterinario (cédula, título, matrícula o licencia de ejercicio en Latinoamérica).

Extrae SOLO lo que puedas leer con claridad en el documento. Si un campo no es legible, usa null.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con esta forma exacta:
{
  "nombre_completo": "string o null",
  "registro_profesional": "string o null",
  "profesion": "string o null",
  "institucion": "string o null",
  "pais": "código ISO-2, nombre de país o null",
  "confidence": "high | medium | low",
  "notes": "breve nota si la imagen está borrosa, recortada o ilegible"
}

Reglas:
- registro_profesional: número de cédula, matrícula, licencia o folio (solo el valor, sin etiquetas).
- profesion: título o profesión que aparece en el documento.
- confidence=high solo si nombre Y registro son claramente legibles.
- No inventes datos que no estén en el documento.
"""


@dataclass
class CedulaOcrResult:
    ok: bool
    nombre: Optional[str] = None
    registro_profesional: Optional[str] = None
    profesion: Optional[str] = None
    institucion: Optional[str] = None
    pais: Optional[str] = None
    confidence: Optional[str] = None
    notes: Optional[str] = None
    raw: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


def is_cedula_ocr_enabled() -> bool:
    if not os.getenv("ANTHROPIC_API_KEY", "").strip():
        return False
    flag = os.getenv("CEDULA_OCR_ENABLED", "true").strip().lower()
    return flag not in {"0", "false", "no", "off"}


def _resolve_model() -> str:
    raw = (os.getenv("CEDULA_OCR_MODEL") or os.getenv("ANTHROPIC_MODEL") or "").strip()
    return raw or "claude-sonnet-4-20250514"


def _parse_json_response(text: str) -> Dict[str, Any]:
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        raise ValueError("La respuesta del modelo no contiene JSON")
    return json.loads(match.group(0))


def _build_vision_blocks(data: bytes, media_type: str) -> List[Dict[str, Any]]:
    blocks: List[Dict[str, Any]] = [{"type": "text", "text": CEDULA_OCR_PROMPT}]
    detected = detect_cedula_media_type(data)
    mime = media_type or (detected[0] if detected else "")

    if mime == "application/pdf" or data.startswith(b"%PDF"):
        try:
            import fitz
        except ImportError as exc:
            raise RuntimeError("El servidor no puede leer PDFs de cédula (falta PyMuPDF).") from exc
        doc = fitz.open(stream=data, filetype="pdf")
        max_pages = min(len(doc), 2)
        for page_num in range(max_pages):
            page = doc[page_num]
            pix = page.get_pixmap(matrix=fitz.Matrix(180 / 72, 180 / 72))
            img_b64 = base64.b64encode(pix.tobytes("png")).decode("utf-8")
            blocks.append(
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": img_b64,
                    },
                }
            )
        doc.close()
        return blocks

    media = mime if mime.startswith("image/") else "image/jpeg"
    if media == "image/png":
        encoded = base64.b64encode(data).decode("utf-8")
    else:
        encoded = base64.b64encode(data).decode("utf-8")
        if media not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
            media = "image/jpeg"
    blocks.append(
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media,
                "data": encoded,
            },
        }
    )
    return blocks


async def extract_cedula_from_document(data: bytes, media_type: str = "") -> CedulaOcrResult:
    if not is_cedula_ocr_enabled():
        return CedulaOcrResult(ok=False, error="OCR de cédula no disponible")
    if Anthropic is None:
        return CedulaOcrResult(ok=False, error="Paquete anthropic no instalado")
    if not data:
        return CedulaOcrResult(ok=False, error="Documento vacío")

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    model = _resolve_model()

    try:
        content = _build_vision_blocks(data, media_type)
    except Exception as exc:  # noqa: BLE001
        return CedulaOcrResult(ok=False, error=str(exc))

    client = Anthropic(api_key=api_key)

    def _call() -> str:
        response = client.messages.create(
            model=model,
            max_tokens=700,
            temperature=0,
            system=(
                "Eres un extractor de datos de documentos oficiales veterinarios en Latinoamérica. "
                "Devuelve solo JSON válido."
            ),
            messages=[{"role": "user", "content": content}],
        )
        parts = [
            block.text
            for block in response.content
            if getattr(block, "type", "") == "text"
        ]
        return "".join(parts).strip()

    try:
        raw_text = await asyncio.to_thread(_call)
        parsed = _parse_json_response(raw_text)
    except APIStatusError as exc:
        return CedulaOcrResult(ok=False, error=f"Error Anthropic: {exc}")
    except Exception as exc:  # noqa: BLE001
        return CedulaOcrResult(ok=False, error=f"No se pudo leer el documento: {exc}")

    nombre = (parsed.get("nombre_completo") or "").strip() or None
    registro = (parsed.get("registro_profesional") or "").strip() or None
    profesion = (parsed.get("profesion") or "").strip() or None
    institucion = (parsed.get("institucion") or "").strip() or None
    pais = (parsed.get("pais") or "").strip() or None
    confidence = (parsed.get("confidence") or "").strip().lower() or None
    notes = (parsed.get("notes") or "").strip() or None

    if not any([nombre, registro, profesion]):
        return CedulaOcrResult(
            ok=False,
            error="No se pudo leer texto legible en el documento",
            notes=notes,
            confidence=confidence,
            raw=parsed,
        )

    return CedulaOcrResult(
        ok=True,
        nombre=nombre,
        registro_profesional=registro,
        profesion=profesion,
        institucion=institucion,
        pais=pais,
        confidence=confidence,
        notes=notes,
        raw=parsed,
    )


def _norm_registro(value: str) -> str:
    return re.sub(r"[\s.\-/_]", "", (value or "").strip().upper())


def _norm_name(value: str) -> str:
    from cedula_verification import _norm_text

    return _norm_text(value)


def ocr_matches_profile(profile: Dict[str, Any], ocr: CedulaOcrResult) -> bool:
    if not ocr.ok:
        return False
    stored_registro = profile.get("cedula_profesional") or ""
    stored_name = profile.get("nombre") or ""
    registro_ok = True
    name_ok = True
    if ocr.registro_profesional and stored_registro:
        registro_ok = _norm_registro(ocr.registro_profesional) == _norm_registro(stored_registro)
    if ocr.nombre and stored_name:
        from cedula_verification import _name_matches

        name_ok = _name_matches(stored_name, ocr.nombre)
    if ocr.registro_profesional and ocr.nombre:
        return registro_ok and name_ok
    if ocr.registro_profesional:
        return registro_ok
    if ocr.nombre:
        return name_ok
    return False


def ocr_profile_update_fields(profile_id: str, ocr: CedulaOcrResult, profile: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    fields: Dict[str, Any] = {
        "cedula_ocr_at": now,
        "cedula_ocr_nombre": ocr.nombre,
        "cedula_ocr_registro": ocr.registro_profesional,
        "cedula_ocr_profesion": ocr.profesion,
        "cedula_ocr_institucion": ocr.institucion,
        "cedula_ocr_confidence": ocr.confidence,
        "cedula_ocr_notes": ocr.notes or ocr.error,
        "cedula_ocr_match": ocr_matches_profile(profile, ocr) if ocr.ok else False,
    }
    return fields


async def download_cedula_document_bytes(stored_url: str) -> Tuple[bytes, str]:
    access_url, err = resolve_cedula_document_url(stored_url)
    if not access_url:
        raise RuntimeError(err or "No se pudo acceder al documento")
    timeout = httpx.Timeout(20.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout, verify=certifi.where(), follow_redirects=True) as client:
        response = await client.get(access_url)
        response.raise_for_status()
        data = response.content
    detected = detect_cedula_media_type(data)
    media_type = detected[0] if detected else (response.headers.get("content-type") or "application/octet-stream")
    return data, media_type.split(";")[0].strip().lower()


async def store_cedula_ocr_result(profile_id: str, ocr: CedulaOcrResult) -> None:
    profile, err = get_profile(profile_id)
    if err or not profile:
        return
    fields = ocr_profile_update_fields(profile_id, ocr, profile)
    update_profile(profile_id, fields)


async def run_cedula_ocr_for_profile(profile_id: str, data: bytes, media_type: str) -> CedulaOcrResult:
    ocr = await extract_cedula_from_document(data, media_type)
    await store_cedula_ocr_result(profile_id, ocr)
    return ocr


async def ensure_cedula_ocr(profile_id: str, profile: Optional[Dict[str, Any]] = None) -> CedulaOcrResult:
    if not is_cedula_ocr_enabled():
        return CedulaOcrResult(ok=False, error="OCR deshabilitado")
    if profile is None:
        profile, _ = get_profile(profile_id)
    if not profile:
        return CedulaOcrResult(ok=False, error="Perfil no encontrado")
    stored_url = profile.get("cedula_document_url")
    if not stored_url:
        return CedulaOcrResult(ok=False, error="Sin documento")

    if profile.get("cedula_ocr_at") and (
        profile.get("cedula_ocr_registro") or profile.get("cedula_ocr_nombre")
    ):
        return CedulaOcrResult(
            ok=True,
            nombre=profile.get("cedula_ocr_nombre"),
            registro_profesional=profile.get("cedula_ocr_registro"),
            profesion=profile.get("cedula_ocr_profesion"),
            institucion=profile.get("cedula_ocr_institucion"),
            confidence=profile.get("cedula_ocr_confidence"),
            notes=profile.get("cedula_ocr_notes"),
        )

    try:
        data, media_type = await download_cedula_document_bytes(stored_url)
    except Exception as exc:  # noqa: BLE001
        return CedulaOcrResult(ok=False, error=str(exc))
    return await run_cedula_ocr_for_profile(profile_id, data, media_type)
