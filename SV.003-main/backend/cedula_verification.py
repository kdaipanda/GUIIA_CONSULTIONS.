"""Verificación de registro profesional veterinario (Latinoamérica + SEP opcional MX)."""
from __future__ import annotations

import asyncio
import os
import re
import unicodedata
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import certifi
import httpx

import email_notifications

from supabase_client import get_profile, update_profile

try:
    import cedula_ocr
except ImportError:  # pragma: no cover
    cedula_ocr = None  # type: ignore[assignment]

try:
    import cedula_eligibility
except ImportError:  # pragma: no cover
    cedula_eligibility = None  # type: ignore[assignment]

CEDULA_STATUS_UNSUBMITTED = "unsubmitted"
CEDULA_STATUS_PENDING = "pending"
CEDULA_STATUS_VERIFIED = "verified"
CEDULA_STATUS_REJECTED = "rejected"

DEV_EMAILS = {
    "carlos.hernandez@vetmed.com",
    "mariana.lopez@vetmed.com",
    "basico@guiaa.vet",
    "profesional@guiaa.vet",
    "premium@guiaa.vet",
}

ALLOWED_VET_PROFESSIONS = {
    "MEDICO VETERINARIO ZOOTECNISTA",
    "MÉDICO VETERINARIO ZOOTECNISTA",
    "MEDICO VETERINARIO",
    "MÉDICO VETERINARIO",
    "VETERINARIA",
    "VETERINARIO",
}

PENDING_REVIEW_MESSAGE = (
    "Documento recibido. Nuestro equipo revisará tu registro profesional en 24–48 h. "
    "Puedes usar la plataforma mientras tanto."
)


def is_dev_user(email: str) -> bool:
    return (email or "").strip().lower() in DEV_EMAILS


def normalize_professional_id(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def professional_id_key(value: str) -> str:
    return re.sub(r"[\s.\-/_]", "", (value or "").strip().upper())


def is_mexico_country(country: Optional[str]) -> bool:
    code = (country or "").strip().upper()
    return code in {"MX", "MEX", "MEXICO", "MÉXICO"}


def _norm_text(s: str) -> str:
    s = (s or "").strip()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.upper()
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _name_matches(expected: str, actual: str) -> bool:
    e = _norm_text(expected)
    a = _norm_text(actual)
    if not e or not a:
        return False
    if e == a:
        return True
    e_tokens = {t for t in e.split(" ") if t}
    a_tokens = {t for t in a.split(" ") if t}
    return e_tokens.issubset(a_tokens) or a_tokens.issubset(e_tokens)


def _profession_is_vet(prof: str) -> bool:
    p = _norm_text(prof)
    if not p:
        return False
    allowed = {_norm_text(x) for x in ALLOWED_VET_PROFESSIONS}
    if p in allowed:
        return True
    return ("VETERINAR" in p) or ("ZOOTECN" in p and "VETERIN" in p)


async def _sep_dgp_lookup(cedula: str) -> Dict[str, Optional[str]]:
    cedula = (cedula or "").strip()
    if not cedula or not cedula.isdigit():
        raise ValueError("Registro inválido para consulta SEP (solo dígitos, México)")

    base = os.getenv("SEP_DGP_BASE_URL", "").strip() or "https://cedulaprofesional.sep.gob.mx"
    candidates = [
        f"{base}/cedula/buscaCedula?cedula={cedula}",
        f"{base}/cedula/buscaCedulaJson?cedula={cedula}",
        f"{base}/cedula/buscaCedula?cedula={cedula}&format=json",
        f"{base}/cedula/buscaCedulaProfesional?cedula={cedula}",
    ]

    timeout = httpx.Timeout(12.0, connect=8.0)
    headers = {
        "User-Agent": "GUIAA/1.0 (cedula-verifier)",
        "Accept": "text/html,application/json",
    }

    async with httpx.AsyncClient(
        timeout=timeout,
        verify=certifi.where(),
        follow_redirects=True,
    ) as client:
        last_exc: Optional[Exception] = None
        for url in candidates:
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code >= 400:
                    continue

                try:
                    data = resp.json()
                    if isinstance(data, list) and data:
                        item = data[0] if isinstance(data[0], dict) else {}
                    elif isinstance(data, dict):
                        item = data
                    else:
                        item = {}

                    nombre = (
                        item.get("nombre")
                        or item.get("NOMBRE")
                        or item.get("nombreCompleto")
                        or item.get("nombre_completo")
                    )
                    profesion = (
                        item.get("profesion")
                        or item.get("PROFESION")
                        or item.get("carrera")
                        or item.get("CARRERA")
                    )
                    if nombre or profesion:
                        return {"nombre": nombre, "profesion": profesion}
                except Exception:
                    pass

                html = resp.text or ""
                nombre = None
                profesion = None

                m_nombre = re.search(
                    r"(?:Nombre(?:\(\s*s\s*\))?|Nombre\s+Completo)\s*:?\s*</[^>]+>\s*<[^>]+>\s*([^<]+)\s*<",
                    html,
                    re.IGNORECASE,
                )
                if m_nombre:
                    nombre = m_nombre.group(1).strip()

                m_prof = re.search(
                    r"(?:Profesi\w+|Carrera)\s*:?\s*</[^>]+>\s*<[^>]+>\s*([^<]+)\s*<",
                    html,
                    re.IGNORECASE,
                )
                if m_prof:
                    profesion = m_prof.group(1).strip()

                if not (nombre or profesion):
                    m_json = re.search(
                        r"\"nombre\"\s*:\s*\"([^\"]+)\"[\s\S]{0,600}?\"profesion\"\s*:\s*\"([^\"]+)\"",
                        html,
                        re.IGNORECASE,
                    )
                    if m_json:
                        nombre = m_json.group(1)
                        profesion = m_json.group(2)

                if nombre or profesion:
                    return {"nombre": nombre, "profesion": profesion}
            except Exception as exc:
                last_exc = exc
                continue

        if last_exc:
            raise RuntimeError(f"No se pudo consultar SEP/DGP: {last_exc}") from last_exc
        return {"nombre": None, "profesion": None}


async def _sep_dgp_lookup_with_retries(cedula: str, attempts: int = 2) -> Dict[str, Optional[str]]:
    last_exc: Optional[Exception] = None
    for i in range(max(1, attempts)):
        try:
            return await _sep_dgp_lookup(cedula)
        except Exception as exc:
            last_exc = exc
            await asyncio.sleep(0.5 * (2**i))
    raise RuntimeError(str(last_exc or "Error desconocido consultando SEP/DGP"))


async def _try_mexico_sep_verify(
    profile_id: str,
    cedula: str,
    expected_name: str,
    profile: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """Intento opcional de auto-verificación vía SEP (solo México, numérico)."""
    if profile is None:
        profile, _ = get_profile(profile_id)
    previous_status = (profile or {}).get("cedula_verification_status") or ""

    try:
        sep = await _sep_dgp_lookup_with_retries(cedula, attempts=2)
    except Exception:
        return None

    sep_nombre = (sep.get("nombre") or "").strip()
    sep_profesion = (sep.get("profesion") or "").strip()
    if not sep_nombre and not sep_profesion:
        return None

    name_ok = _name_matches(expected_name, sep_nombre) if sep_nombre else False
    prof_ok = _profession_is_vet(sep_profesion) if sep_profesion else False
    now = datetime.now(timezone.utc).isoformat()

    if name_ok and prof_ok:
        err_upd = update_profile(
            profile_id,
            {
                "cedula_sep_nombre": sep_nombre or None,
                "cedula_sep_profesion": sep_profesion or None,
                "cedula_verification_status": CEDULA_STATUS_VERIFIED,
                "cedula_verification_checked_at": now,
                "cedula_verification_error": None,
            },
        )
        if err_upd:
            return {"ok": False, "error": err_upd}
        if profile:
            _maybe_notify_cedula_approved(profile, previous_status)
        return {
            "ok": True,
            "verification_status": CEDULA_STATUS_VERIFIED,
            "sep_nombre": sep_nombre or None,
            "sep_profesion": sep_profesion or None,
            "message": "Registro verificado automáticamente con SEP (México).",
        }
    return None


def _maybe_notify_cedula_approved(profile: Dict[str, Any], previous_status: str) -> None:
    """Envía correo solo en la primera transición a verificado (no dev, no re-aprobaciones)."""
    if (previous_status or "").strip() == CEDULA_STATUS_VERIFIED:
        return
    email = (profile.get("email") or "").strip()
    if not email or is_dev_user(email):
        return
    try:
        email_notifications.notify_user_cedula_approved(profile)
    except Exception as exc:  # noqa: BLE001
        print(f"[WARN] Email cédula aprobada: {exc}")


def _maybe_notify_cedula_rejected(
    profile: Dict[str, Any],
    previous_status: str,
    reason: str = "",
) -> None:
    """Envía correo solo en la primera transición a rechazado (no dev, no re-rechazos)."""
    if (previous_status or "").strip() == CEDULA_STATUS_REJECTED:
        return
    email = (profile.get("email") or "").strip()
    if not email or is_dev_user(email):
        return
    try:
        email_notifications.notify_user_cedula_rejected(profile, reason)
    except Exception as exc:  # noqa: BLE001
        print(f"[WARN] Email cédula rechazada: {exc}")


def _submit_for_manual_review(profile_id: str) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    err_upd = update_profile(
        profile_id,
        {
            "cedula_verification_status": CEDULA_STATUS_PENDING,
            "cedula_verification_checked_at": now,
            "cedula_verification_error": None,
        },
    )
    if err_upd:
        return {"ok": False, "error": err_upd}
    return {
        "ok": True,
        "verification_status": CEDULA_STATUS_PENDING,
        "message": PENDING_REVIEW_MESSAGE,
    }


async def verify_profile_cedula(profile_id: str) -> Dict[str, Any]:
    profile, err = get_profile(profile_id)
    if err:
        return {"ok": False, "error": err}
    if not profile:
        return {"ok": False, "error": "Perfil no encontrado"}

    cedula = normalize_professional_id(profile.get("cedula_profesional") or "")
    if not cedula:
        return {"ok": False, "error": "El usuario no tiene registro profesional"}

    expected_name = (profile.get("nombre") or "").strip()
    if not expected_name:
        return {"ok": False, "error": "El perfil no tiene nombre para validar"}

    if not profile.get("cedula_document_url"):
        return {
            "ok": False,
            "error": "Debes subir el documento de tu registro profesional (título, matrícula o licencia).",
        }

    ocr_result = None
    ocr_message = None
    if cedula_ocr and cedula_ocr.is_cedula_ocr_enabled():
        ocr_result = await cedula_ocr.ensure_cedula_ocr(profile_id, profile)
        if ocr_result.ok:
            if cedula_ocr.ocr_matches_profile(profile, ocr_result):
                ocr_message = "Documento leído: los datos coinciden con tu registro."
            elif ocr_result.confidence in ("high", "medium"):
                mismatch = []
                if ocr_result.registro_profesional:
                    mismatch.append(f"registro leído: {ocr_result.registro_profesional}")
                if ocr_result.nombre:
                    mismatch.append(f"nombre leído: {ocr_result.nombre}")
                hint = "; ".join(mismatch)
                ocr_message = (
                    "Leímos el documento pero algunos datos no coinciden con tu perfil. "
                    f"Revisa: {hint}."
                )
                update_profile(
                    profile_id,
                    {
                        "cedula_verification_error": (
                            "Los datos del documento no coinciden con el perfil. "
                            "Revisa número de registro y nombre."
                        ),
                    },
                )
            elif ocr_result.notes:
                ocr_message = f"No pudimos leer el documento con claridad: {ocr_result.notes}"
        elif ocr_result.error and ocr_result.error != "OCR deshabilitado":
            ocr_message = (
                "No pudimos leer automáticamente el documento; un revisor lo validará manualmente."
            )

    email = profile.get("email") or ""
    if is_dev_user(email):
        now = datetime.now(timezone.utc).isoformat()
        err_upd = update_profile(
            profile_id,
            {
                "cedula_sep_nombre": expected_name,
                "cedula_sep_profesion": "Médico Veterinario Zootecnista",
                "cedula_verification_status": CEDULA_STATUS_VERIFIED,
                "cedula_verification_checked_at": now,
                "cedula_verification_error": None,
            },
        )
        if err_upd:
            return {"ok": False, "error": err_upd}
        return {
            "ok": True,
            "verification_status": CEDULA_STATUS_VERIFIED,
            "sep_nombre": expected_name,
            "sep_profesion": "Médico Veterinario Zootecnista",
            "message": "Registro verificado (cuenta de desarrollo).",
        }

    country = profile.get("profesional_pais") or "MX"

    eligibility = None
    eligibility_message = None
    if cedula_eligibility:
        eligibility = await cedula_eligibility.assess_practice_eligibility(
            profile_id,
            profile,
            ocr_result=ocr_result,
        )
        cedula_eligibility.store_eligibility_assessment(profile_id, eligibility)
        eligibility_message = cedula_eligibility.eligibility_user_message(eligibility)

        if cedula_eligibility.should_auto_verify_from_eligibility(eligibility):
            now = datetime.now(timezone.utc).isoformat()
            err_upd = update_profile(
                profile_id,
                {
                    "cedula_sep_nombre": eligibility.sep_nombre or expected_name,
                    "cedula_sep_profesion": eligibility.sep_profesion or (
                        ocr_result.profesion if ocr_result and ocr_result.ok else None
                    ),
                    "cedula_verification_status": CEDULA_STATUS_VERIFIED,
                    "cedula_verification_checked_at": now,
                    "cedula_verification_error": None,
                },
            )
            if not err_upd:
                _maybe_notify_cedula_approved(
                    profile, profile.get("cedula_verification_status") or ""
                )
                return {
                    "ok": True,
                    "verification_status": CEDULA_STATUS_VERIFIED,
                    "sep_nombre": eligibility.sep_nombre,
                    "sep_profesion": eligibility.sep_profesion,
                    "message": eligibility_message,
                    "puede_ejercer": eligibility.puede_ejercer,
                    "eligibility_confianza": eligibility.confianza,
                    "eligibility_resumen": eligibility.resumen,
                    "eligibility_motivos": eligibility.motivos,
                    "ocr_nombre": ocr_result.nombre if ocr_result and ocr_result.ok else None,
                    "ocr_registro": ocr_result.registro_profesional
                    if ocr_result and ocr_result.ok
                    else None,
                    "ocr_match": cedula_ocr.ocr_matches_profile(profile, ocr_result)
                    if ocr_result and ocr_result.ok and cedula_ocr
                    else None,
                }

        if (
            eligibility.puede_ejercer == "no"
            and eligibility.confianza == "alta"
            and eligibility.recomendacion == "rechazar"
        ):
            now = datetime.now(timezone.utc).isoformat()
            err_upd = update_profile(
                profile_id,
                {
                    "cedula_verification_status": CEDULA_STATUS_REJECTED,
                    "cedula_verification_checked_at": now,
                    "cedula_verification_error": eligibility.resumen,
                },
            )
            if not err_upd:
                _maybe_notify_cedula_rejected(
                    profile,
                    profile.get("cedula_verification_status") or "",
                    eligibility.resumen,
                )
                return {
                    "ok": True,
                    "verification_status": CEDULA_STATUS_REJECTED,
                    "message": eligibility_message,
                    "puede_ejercer": eligibility.puede_ejercer,
                    "eligibility_confianza": eligibility.confianza,
                    "eligibility_resumen": eligibility.resumen,
                    "eligibility_motivos": eligibility.motivos,
                }

    # Fallback SEP directo (por si elegibilidad no está disponible)
    if is_mexico_country(country) and cedula.isdigit() and not cedula_eligibility:
        sep_result = await _try_mexico_sep_verify(
            profile_id, cedula, expected_name, profile=profile
        )
        if sep_result:
            if ocr_message and sep_result.get("ok"):
                sep_result["message"] = f"{sep_result.get('message', '')} {ocr_message}".strip()
            return sep_result

    manual = _submit_for_manual_review(profile_id)
    if manual.get("ok"):
        parts = [manual.get("message", ""), ocr_message, eligibility_message]
        manual["message"] = " ".join(p for p in parts if p).strip()
    if manual.get("ok") and ocr_result and ocr_result.ok:
        manual["ocr_nombre"] = ocr_result.nombre
        manual["ocr_registro"] = ocr_result.registro_profesional
        manual["ocr_match"] = cedula_ocr.ocr_matches_profile(profile, ocr_result) if cedula_ocr else None
        manual["ocr_confidence"] = ocr_result.confidence
    if manual.get("ok") and eligibility:
        manual["puede_ejercer"] = eligibility.puede_ejercer
        manual["eligibility_confianza"] = eligibility.confianza
        manual["eligibility_resumen"] = eligibility.resumen
        manual["eligibility_motivos"] = eligibility.motivos
    return manual


def manual_review_cedula(profile_id: str, action: str, note: Optional[str] = None) -> Dict[str, Any]:
    profile, err = get_profile(profile_id)
    if err:
        return {"ok": False, "error": err}
    if not profile:
        return {"ok": False, "error": "Perfil no encontrado"}

    action = (action or "").lower().strip()
    previous_status = (profile.get("cedula_verification_status") or "").strip()
    now = datetime.now(timezone.utc).isoformat()

    if action == "approve":
        fields = {
            "cedula_verification_status": CEDULA_STATUS_VERIFIED,
            "cedula_verification_checked_at": now,
            "cedula_verification_error": None,
        }
        msg = "Registro profesional aprobado manualmente."
    elif action == "reject":
        fields = {
            "cedula_verification_status": CEDULA_STATUS_REJECTED,
            "cedula_verification_checked_at": now,
            "cedula_verification_error": note or "Rechazado manualmente por administrador.",
        }
        msg = "Registro profesional rechazado."
    else:
        return {"ok": False, "error": "Acción inválida (approve o reject)"}

    err_upd = update_profile(profile_id, fields)
    if err_upd:
        return {"ok": False, "error": err_upd}

    if action == "approve":
        _maybe_notify_cedula_approved(profile, previous_status)
    elif action == "reject":
        _maybe_notify_cedula_rejected(
            profile,
            previous_status,
            fields.get("cedula_verification_error") or note or "",
        )

    return {
        "ok": True,
        "verification_status": fields["cedula_verification_status"],
        "message": msg,
    }
