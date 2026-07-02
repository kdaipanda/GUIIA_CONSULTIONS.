"""Dictamen de elegibilidad para ejercicio profesional (portal oficial + IA)."""
from __future__ import annotations

import asyncio
import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from cedula_verification import (
    CEDULA_STATUS_VERIFIED,
    _name_matches,
    _profession_is_vet,
    _sep_dgp_lookup_with_retries,
    is_mexico_country,
    normalize_professional_id,
)
from supabase_client import get_profile, update_profile

try:
    from anthropic import Anthropic  # type: ignore
    from anthropic._exceptions import APIStatusError  # type: ignore
except Exception:  # noqa: BLE001
    Anthropic = None  # type: ignore[assignment]
    APIStatusError = Exception  # type: ignore[assignment]

try:
    import cedula_ocr
except ImportError:  # pragma: no cover
    cedula_ocr = None  # type: ignore[assignment]


@dataclass
class EligibilityAssessment:
    puede_ejercer: str  # si | no | incierto
    confianza: str  # alta | media | baja
    resumen: str
    motivos: List[str] = field(default_factory=list)
    fuente_oficial: str = "ninguna"  # SEP | ninguna | solo_documento
    recomendacion: str = "revisar"  # aprobar | rechazar | revisar
    sep_consultado: bool = False
    sep_nombre: Optional[str] = None
    sep_profesion: Optional[str] = None
    raw: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


def is_eligibility_ai_enabled() -> bool:
    if not os.getenv("ANTHROPIC_API_KEY", "").strip():
        return False
    flag = os.getenv("CEDULA_ELIGIBILITY_AI_ENABLED", "true").strip().lower()
    return flag not in {"0", "false", "no", "off"}


def _resolve_model() -> str:
    raw = (
        os.getenv("CEDULA_ELIGIBILITY_MODEL")
        or os.getenv("CEDULA_OCR_MODEL")
        or os.getenv("ANTHROPIC_MODEL")
        or ""
    ).strip()
    return raw or "claude-sonnet-4-20250514"


def _parse_json_response(text: str) -> Dict[str, Any]:
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        raise ValueError("Respuesta sin JSON")
    return json.loads(match.group(0))


def _normalize_verdict(value: str, allowed: set[str], default: str) -> str:
    key = (value or "").strip().lower()
    return key if key in allowed else default


async def _lookup_sep_for_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    country = profile.get("profesional_pais") or "MX"
    if not is_mexico_country(country):
        return {"consultado": False, "motivo": "País fuera de México; no hay portal SEP aplicable."}

    candidates: List[str] = []
    profile_cedula = normalize_professional_id(profile.get("cedula_profesional") or "")
    if profile_cedula.isdigit():
        candidates.append(profile_cedula)
    ocr_registro = (profile.get("cedula_ocr_registro") or "").strip()
    if ocr_registro.isdigit() and ocr_registro not in candidates:
        candidates.append(ocr_registro)

    if not candidates:
        return {
            "consultado": False,
            "motivo": "Registro no numérico; el portal SEP de México requiere cédula numérica.",
        }

    last_error = None
    for cedula in candidates:
        try:
            sep = await _sep_dgp_lookup_with_retries(cedula, attempts=2)
            nombre = (sep.get("nombre") or "").strip() or None
            profesion = (sep.get("profesion") or "").strip() or None
            if nombre or profesion:
                return {
                    "consultado": True,
                    "cedula_consultada": cedula,
                    "nombre": nombre,
                    "profesion": profesion,
                    "profesion_veterinaria": _profession_is_vet(profesion or ""),
                    "nombre_coincide": _name_matches(
                        profile.get("nombre") or "", nombre or ""
                    )
                    if nombre
                    else None,
                }
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)
            continue

    return {
        "consultado": False,
        "motivo": last_error or "SEP no devolvió datos para el registro consultado.",
    }


def _rule_based_assessment(
    profile: Dict[str, Any],
    sep_data: Dict[str, Any],
    ocr_data: Optional[Dict[str, Any]],
) -> EligibilityAssessment:
    motivos: List[str] = []
    puede = "incierto"
    confianza = "baja"
    fuente = "ninguna"
    recomendacion = "revisar"

    if sep_data.get("consultado"):
        fuente = "SEP"
        sep_nombre = sep_data.get("nombre")
        sep_profesion = sep_data.get("profesion")
        if sep_data.get("profesion_veterinaria") and sep_data.get("nombre_coincide"):
            puede = "si"
            confianza = "alta"
            recomendacion = "aprobar"
            motivos.append("SEP confirma profesión veterinaria y el nombre coincide.")
        elif sep_data.get("profesion_veterinaria") and not sep_data.get("nombre_coincide"):
            puede = "incierto"
            confianza = "media"
            recomendacion = "revisar"
            motivos.append("SEP confirma profesión veterinaria pero el nombre no coincide del todo.")
        elif sep_profesion and not sep_data.get("profesion_veterinaria"):
            puede = "no"
            confianza = "alta"
            recomendacion = "rechazar"
            motivos.append(f"SEP registra otra profesión: {sep_profesion}.")
        else:
            motivos.append("SEP respondió pero faltan datos claros de profesión o nombre.")
    elif ocr_data and ocr_data.get("ok"):
        fuente = "solo_documento"
        if (
            ocr_data.get("match")
            and ocr_data.get("confidence") == "high"
            and _profession_is_vet(ocr_data.get("profesion") or "")
        ):
            puede = "incierto"
            confianza = "media"
            recomendacion = "revisar"
            motivos.append(
                "Sin consulta oficial disponible; el documento leído coincide y muestra profesión veterinaria."
            )
        else:
            motivos.append("Documento leído pero sin validación en portal oficial.")
    else:
        motivos.append("No hay datos del portal oficial ni lectura confiable del documento.")

    resumen = (
        "Puede ejercer como MVZ según portal oficial."
        if puede == "si" and fuente == "SEP"
        else "No se confirma elegibilidad veterinaria en portal oficial."
        if puede == "no"
        else "Se requiere revisión manual para confirmar si puede ejercer."
    )

    return EligibilityAssessment(
        puede_ejercer=puede,
        confianza=confianza,
        resumen=resumen,
        motivos=motivos,
        fuente_oficial=fuente,
        recomendacion=recomendacion,
        sep_consultado=bool(sep_data.get("consultado")),
        sep_nombre=sep_data.get("nombre"),
        sep_profesion=sep_data.get("profesion"),
    )


async def _ai_assessment(
    profile: Dict[str, Any],
    sep_data: Dict[str, Any],
    ocr_data: Optional[Dict[str, Any]],
) -> EligibilityAssessment:
    if not is_eligibility_ai_enabled() or Anthropic is None:
        return _rule_based_assessment(profile, sep_data, ocr_data)

    payload = {
        "perfil": {
            "nombre": profile.get("nombre"),
            "registro_profesional": profile.get("cedula_profesional"),
            "pais": profile.get("profesional_pais"),
            "especialidad_declarada": profile.get("especialidad"),
        },
        "portal_oficial_sep": sep_data,
        "lectura_documento_ocr": ocr_data or {},
        "instrucciones": (
            "Evalúa si esta persona puede ejercer como médico veterinario en Latinoamérica. "
            "Prioriza el portal SEP (México) cuando esté disponible. "
            "No afirmes 'sí' con alta confianza sin fuente oficial o documento muy claro. "
            "Responde solo JSON."
        ),
    }

    prompt = f"""Analiza la elegibilidad profesional veterinaria con esta evidencia:

{json.dumps(payload, ensure_ascii=False, indent=2)}

Responde ÚNICAMENTE JSON:
{{
  "puede_ejercer": "si | no | incierto",
  "confianza": "alta | media | baja",
  "resumen": "1-2 oraciones en español para el MVZ",
  "motivos": ["razón 1", "razón 2"],
  "fuente_oficial": "SEP | ninguna | solo_documento",
  "recomendacion": "aprobar | rechazar | revisar"
}}"""

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", "").strip())

    def _call() -> str:
        response = client.messages.create(
            model=_resolve_model(),
            max_tokens=900,
            temperature=0,
            system=(
                "Eres un verificador de elegibilidad profesional veterinaria en Latinoamérica. "
                "Sé conservador: solo marca puede_ejercer=si con confianza alta si SEP confirma "
                "profesión veterinaria y el nombre coincide, o si no hay SEP pero el documento es "
                "inequívoco. Si hay duda, usa incierto y revisar."
            ),
            messages=[{"role": "user", "content": prompt}],
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
        fallback = _rule_based_assessment(profile, sep_data, ocr_data)
        fallback.error = f"IA no disponible: {exc}"
        return fallback
    except Exception as exc:  # noqa: BLE001
        fallback = _rule_based_assessment(profile, sep_data, ocr_data)
        fallback.error = str(exc)
        return fallback

    return EligibilityAssessment(
        puede_ejercer=_normalize_verdict(
            parsed.get("puede_ejercer"), {"si", "no", "incierto"}, "incierto"
        ),
        confianza=_normalize_verdict(
            parsed.get("confianza"), {"alta", "media", "baja"}, "baja"
        ),
        resumen=(parsed.get("resumen") or "").strip()
        or "Dictamen de elegibilidad generado.",
        motivos=[str(m) for m in (parsed.get("motivos") or []) if m],
        fuente_oficial=_fix_fuente_oficial(parsed.get("fuente_oficial")),
        recomendacion=_normalize_verdict(
            parsed.get("recomendacion"),
            {"aprobar", "rechazar", "revisar"},
            "revisar",
        ),
        sep_consultado=bool(sep_data.get("consultado")),
        sep_nombre=sep_data.get("nombre"),
        sep_profesion=sep_data.get("profesion"),
        raw=parsed,
    )


def _fix_fuente_oficial(parsed_fuente: str) -> str:
    key = (parsed_fuente or "").strip().lower()
    if key == "sep":
        return "SEP"
    if key == "solo_documento":
        return "solo_documento"
    return "ninguna"


async def assess_practice_eligibility(
    profile_id: str,
    profile: Optional[Dict[str, Any]] = None,
    *,
    ocr_result: Any = None,
) -> EligibilityAssessment:
    if profile is None:
        profile, _ = get_profile(profile_id)
    if not profile:
        return EligibilityAssessment(
            puede_ejercer="incierto",
            confianza="baja",
            resumen="Perfil no encontrado.",
            error="Perfil no encontrado",
        )

    sep_data = await _lookup_sep_for_profile(profile)

    ocr_data: Optional[Dict[str, Any]] = None
    if ocr_result is not None and getattr(ocr_result, "ok", False):
        ocr_data = {
            "ok": True,
            "nombre": ocr_result.nombre,
            "registro": ocr_result.registro_profesional,
            "profesion": ocr_result.profesion,
            "confidence": ocr_result.confidence,
            "match": cedula_ocr.ocr_matches_profile(profile, ocr_result) if cedula_ocr else None,
        }
    elif profile.get("cedula_ocr_at"):
        ocr_data = {
            "ok": True,
            "nombre": profile.get("cedula_ocr_nombre"),
            "registro": profile.get("cedula_ocr_registro"),
            "profesion": profile.get("cedula_ocr_profesion"),
            "confidence": profile.get("cedula_ocr_confidence"),
            "match": profile.get("cedula_ocr_match"),
        }

    if is_eligibility_ai_enabled():
        assessment = await _ai_assessment(profile, sep_data, ocr_data)
    else:
        assessment = _rule_based_assessment(profile, sep_data, ocr_data)

    return assessment


def store_eligibility_assessment(profile_id: str, assessment: EligibilityAssessment) -> None:
    now = datetime.now(timezone.utc).isoformat()
    update_profile(
        profile_id,
        {
            "cedula_eligibility_puede_ejercer": assessment.puede_ejercer,
            "cedula_eligibility_confianza": assessment.confianza,
            "cedula_eligibility_resumen": assessment.resumen,
            "cedula_eligibility_motivos": json.dumps(assessment.motivos, ensure_ascii=False),
            "cedula_eligibility_fuente": assessment.fuente_oficial,
            "cedula_eligibility_recomendacion": assessment.recomendacion,
            "cedula_eligibility_checked_at": now,
            "cedula_sep_nombre": assessment.sep_nombre or None,
            "cedula_sep_profesion": assessment.sep_profesion or None,
        },
    )


def eligibility_user_message(assessment: EligibilityAssessment) -> str:
    icon = {"si": "✓", "no": "✗", "incierto": "?"}.get(assessment.puede_ejercer, "?")
    fuente = (
        "consultamos el portal oficial SEP"
        if assessment.fuente_oficial == "SEP"
        else "no hubo consulta en portal oficial"
        if assessment.fuente_oficial == "ninguna"
        else "solo analizamos el documento subido"
    )
    return (
        f"{icon} Dictamen: {'Puede ejercer' if assessment.puede_ejercer == 'si' else 'No confirmado para ejercer' if assessment.puede_ejercer == 'no' else 'Elegibilidad por confirmar'}. "
        f"{assessment.resumen} ({fuente}; confianza {assessment.confianza})."
    )


def should_auto_verify_from_eligibility(assessment: EligibilityAssessment) -> bool:
    return (
        assessment.puede_ejercer == "si"
        and assessment.confianza == "alta"
        and assessment.recomendacion == "aprobar"
        and (assessment.fuente_oficial == "SEP" or assessment.fuente_oficial == "solo_documento")
    )
