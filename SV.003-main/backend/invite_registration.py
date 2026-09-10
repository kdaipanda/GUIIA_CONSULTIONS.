"""Alta por invitación endurecida: OTP al email invitado antes de emitir JWT."""
from __future__ import annotations

import asyncio
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Tuple

from fastapi import HTTPException

import auth_security
import cedula_verification
import clinic_db
import email_notifications
import password_auth


CEDULA_STATUS_UNSUBMITTED = "unsubmitted"
CEDULA_STATUS_VERIFIED = "verified"


def _build_pending_profile_payload(
    *,
    body: Any,
    email: str,
    role: str,
    requires_license: bool,
    is_dev_user: Callable[[str], bool],
    normalize_professional_id: Callable[[str], str],
    professional_id_key: Callable[[str], str],
    get_profile_by_cedula: Callable,
    generate_2fa_code: Callable[[], str],
) -> Tuple[Dict[str, Any], str]:
    phone = (body.telefono or "").strip()
    phone_digits = re.sub(r"\D", "", phone)
    if len(phone_digits) < 8:
        raise HTTPException(
            status_code=400,
            detail="Ingresa un número de teléfono válido (mínimo 8 dígitos).",
        )

    try:
        password_hash = password_auth.hash_password(body.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=400,
            detail=password_auth.PASSWORD_HASH_ERROR_MESSAGE,
        ) from exc

    pais = (body.profesional_pais or "MX").strip().upper()[:2]
    nombre = (body.nombre or "").strip()
    if len(nombre) < 2:
        raise HTTPException(status_code=400, detail="Ingresa tu nombre completo.")

    if requires_license:
        cedula_norm = normalize_professional_id(body.cedula_profesional or "")
        if len(cedula_norm) < 3:
            raise HTTPException(
                status_code=400,
                detail="Ingresa un número de matrícula, licencia o registro profesional válido.",
            )
        existing_cedula, _ = get_profile_by_cedula(cedula_norm)
        if existing_cedula:
            raise HTTPException(
                status_code=400, detail="Este registro profesional ya está registrado"
            )
        if not (body.especialidad or "").strip():
            raise HTTPException(status_code=400, detail="Selecciona una especialidad.")
        years = int(body.años_experiencia or 0)
        institucion = (body.institucion or "").strip()
        if not institucion:
            raise HTTPException(status_code=400, detail="Ingresa tu institución.")
        is_dev = is_dev_user(email)
        initial_status = CEDULA_STATUS_VERIFIED if is_dev else CEDULA_STATUS_UNSUBMITTED
        vet_data = {
            "nombre": nombre,
            "email": email,
            "telefono": phone,
            "cedula_profesional": cedula_norm,
            "cedula_profesional_key": professional_id_key(cedula_norm),
            "profesional_pais": pais,
            "especialidad": body.especialidad.strip(),
            "años_experiencia": years,
            "institucion": institucion,
            "membership_type": None,
            "consultations_remaining": 0,
            "membership_expires": None,
            "two_factor_enabled": False,
            "cedula_verification_status": initial_status,
            "cedula_document_url": None,
            "cedula_document_uploaded_at": datetime.now(timezone.utc).isoformat()
            if is_dev
            else None,
            "cedula_verification_checked_at": datetime.now(timezone.utc).isoformat()
            if is_dev
            else None,
            "cedula_verification_error": None,
            "cedula_sep_nombre": nombre if is_dev else None,
            "cedula_sep_profesion": "Médico Veterinario Zootecnista" if is_dev else None,
            "cedula_skip_count": 0,
            "password_hash": password_hash,
            "_requires_license": True,
        }
    else:
        vet_data = {
            "nombre": nombre,
            "email": email,
            "telefono": phone,
            "cedula_profesional": None,
            "cedula_profesional_key": None,
            "profesional_pais": pais,
            "especialidad": None,
            "años_experiencia": 0,
            "institucion": None,
            "membership_type": None,
            "consultations_remaining": 0,
            "membership_expires": None,
            "two_factor_enabled": False,
            "cedula_verification_status": CEDULA_STATUS_VERIFIED,
            "cedula_document_url": None,
            "cedula_document_uploaded_at": datetime.now(timezone.utc).isoformat(),
            "cedula_verification_checked_at": datetime.now(timezone.utc).isoformat(),
            "cedula_verification_error": None,
            "cedula_sep_nombre": None,
            "cedula_sep_profesion": None,
            "cedula_skip_count": 0,
            "password_hash": password_hash,
            "_requires_license": False,
        }

    code = generate_2fa_code()
    return vet_data, code


async def start_invite_registration(
    *,
    body: Any,
    get_profile_by_email: Callable,
    is_dev_user: Callable[[str], bool],
    normalize_professional_id: Callable[[str], str],
    professional_id_key: Callable[[str], str],
    get_profile_by_cedula: Callable,
    generate_2fa_code: Callable[[], str],
) -> Dict[str, Any]:
    invite, inv_err = clinic_db.get_invite_by_raw_token(body.token)
    if inv_err or not invite:
        raise HTTPException(status_code=400, detail=inv_err or "Invitación no válida")

    email = (invite.get("email") or "").strip().lower()
    role = (invite.get("role") or "veterinarian").strip().lower()
    org_id = invite.get("organization_id")
    invite_id = invite.get("id")
    requires_license = role not in clinic_db.STAFF_INVITE_ROLES
    raw_row = invite.get("_raw") or {}
    invite_token_hash = raw_row.get("token_hash") or clinic_db._hash_invite_token(
        body.token
    )

    existing, _ = get_profile_by_email(email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Ese email ya tiene cuenta. Inicia sesión y pide al dueño que te agregue "
                "desde Configuración → Equipo."
            ),
        )

    vet_data, code = _build_pending_profile_payload(
        body=body,
        email=email,
        role=role,
        requires_license=requires_license,
        is_dev_user=is_dev_user,
        normalize_professional_id=normalize_professional_id,
        professional_id_key=professional_id_key,
        get_profile_by_cedula=get_profile_by_cedula,
        generate_2fa_code=generate_2fa_code,
    )

    code_hash = clinic_db.hash_invite_email_code(code)
    pending_token = auth_security.create_invite_register_pending_token(
        invite_id=str(invite_id),
        invite_token_hash=str(invite_token_hash),
        email=email,
        code_hash=code_hash,
        profile_payload={
            **vet_data,
            "organization_id": org_id,
            "role": role,
            "organization_name": invite.get("organization_name") or "",
            "invited_by": raw_row.get("invited_by"),
        },
    )

    email_err = email_notifications.notify_invite_email_code(
        email=email,
        nombre=vet_data.get("nombre") or "",
        code=code,
        organization_name=invite.get("organization_name") or "",
    )
    if email_err:
        raise HTTPException(
            status_code=502,
            detail=(
                "No se pudo enviar el código de verificación al email invitado. "
                "Intenta de nuevo en unos minutos."
            ),
        )

    return {
        "status": "pending_email_verification",
        "nonce": pending_token,
        "email": email,
        "expires_in": auth_security.INVITE_REGISTER_PENDING_TTL_SECONDS,
        "message": (
            f"Enviamos un código de 6 dígitos a {email}. "
            "Confírmalo para crear tu cuenta y unirte al consultorio."
        ),
        "invite": {
            "organization_id": org_id,
            "role": role,
            "requires_license": requires_license,
            "organization_name": invite.get("organization_name") or "",
        },
    }


async def resend_invite_registration_code(
    *,
    nonce: str,
    generate_2fa_code: Callable[[], str],
) -> Dict[str, Any]:
    pending = auth_security.verify_invite_register_pending_token(nonce)
    email = (pending.get("email") or "").strip().lower()
    profile_payload = dict(pending.get("profile") or {})
    invite_id = str(pending.get("sub") or "")
    invite_token_hash = pending.get("invite_token_hash") or ""

    try:
        resp = (
            clinic_db._table("organization_invites")
            .select("id, status, email, token_hash")
            .eq("id", invite_id)
            .limit(1)
            .execute()
        )
        row = resp.data[0] if resp.data else None
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not row or row.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Esta invitación ya no está disponible")
    if invite_token_hash and row.get("token_hash") != invite_token_hash:
        raise HTTPException(status_code=400, detail="Invitación no válida")

    code = generate_2fa_code()
    code_hash = clinic_db.hash_invite_email_code(code)
    new_nonce = auth_security.create_invite_register_pending_token(
        invite_id=invite_id,
        invite_token_hash=str(row.get("token_hash") or invite_token_hash),
        email=email,
        code_hash=code_hash,
        profile_payload=profile_payload,
    )
    email_err = email_notifications.notify_invite_email_code(
        email=email,
        nombre=profile_payload.get("nombre") or "",
        code=code,
        organization_name=profile_payload.get("organization_name") or "",
    )
    if email_err:
        raise HTTPException(
            status_code=502,
            detail="No se pudo reenviar el código. Intenta de nuevo.",
        )
    return {
        "status": "pending_email_verification",
        "nonce": new_nonce,
        "email": email,
        "expires_in": auth_security.INVITE_REGISTER_PENDING_TTL_SECONDS,
        "message": f"Reenviamos el código a {email}.",
    }


async def complete_invite_registration(
    *,
    nonce: str,
    code: str,
    get_profile_by_email: Callable,
    get_profile: Callable,
    upsert_profile: Callable,
    is_dev_user: Callable[[str], bool],
    with_team_membership: Callable[[Dict[str, Any]], Dict[str, Any]],
    email_background: Callable,
) -> Dict[str, Any]:
    pending = auth_security.verify_invite_register_pending_token(nonce)
    expected_hash = pending.get("code_hash") or ""
    got_hash = clinic_db.hash_invite_email_code(code)
    if not expected_hash or got_hash != expected_hash:
        raise HTTPException(status_code=401, detail="Código inválido")

    profile_payload = dict(pending.get("profile") or {})
    email = (pending.get("email") or profile_payload.get("email") or "").strip().lower()
    invite_id = str(pending.get("sub") or "")
    org_id = profile_payload.pop("organization_id", None)
    role = (profile_payload.pop("role", None) or "veterinarian").strip().lower()
    org_name = profile_payload.pop("organization_name", "") or ""
    invited_by = profile_payload.pop("invited_by", None)
    requires_license = bool(profile_payload.pop("_requires_license", False))

    if not invite_id or not org_id or not email:
        raise HTTPException(status_code=400, detail="Sesión de verificación incompleta")

    existing, _ = get_profile_by_email(email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ese email ya tiene cuenta. Inicia sesión normalmente.",
        )

    invite_token_hash = pending.get("invite_token_hash") or ""
    try:
        resp = (
            clinic_db._table("organization_invites")
            .select("*")
            .eq("id", invite_id)
            .limit(1)
            .execute()
        )
        invite_row = resp.data[0] if resp.data else None
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not invite_row or invite_row.get("status") != "pending":
        raise HTTPException(
            status_code=400,
            detail="Esta invitación ya fue usada o ya no está disponible",
        )
    if invite_token_hash and invite_row.get("token_hash") != invite_token_hash:
        raise HTTPException(status_code=400, detail="Invitación no válida")
    if (invite_row.get("email") or "").strip().lower() != email:
        raise HTTPException(status_code=400, detail="El email no coincide con la invitación")

    profile_id = str(uuid.uuid4())
    vet_data = {
        **profile_payload,
        "id": profile_id,
        "email": email,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result, err = upsert_profile(vet_data)
    if err:
        raise HTTPException(status_code=500, detail=f"Error guardando perfil: {err}")

    member, mem_err = clinic_db.insert_organization_member_direct(org_id, profile_id, role)
    if mem_err:
        raise HTTPException(status_code=500, detail=f"No se pudo unir al consultorio: {mem_err}")

    mark_err = clinic_db.mark_invite_accepted(invite_id, profile_id)
    if mark_err:
        try:
            from supabase_client import get_supabase_client

            get_supabase_client().table("profiles").delete().eq("id", profile_id).execute()
            clinic_db._table("organization_members").delete().eq(
                "profile_id", profile_id
            ).execute()
        except Exception as cleanup_exc:  # noqa: BLE001
            print(f"[WARN] cleanup invite race: {cleanup_exc}")
        raise HTTPException(status_code=409, detail=mark_err)

    saved = result or vet_data
    result_data = auth_security.attach_auth_tokens(with_team_membership(saved))
    result_data["invite"] = {
        "organization_id": org_id,
        "role": role,
        "requires_license": requires_license,
        "organization_name": org_name,
    }
    result_data["membership"] = member

    if invited_by:
        try:
            inviter, _ = get_profile(str(invited_by))
            if inviter and inviter.get("email"):
                asyncio.create_task(
                    email_background(
                        email_notifications.notify_organization_invite_accepted,
                        {
                            "inviter_email": inviter.get("email"),
                            "member_nombre": saved.get("nombre"),
                            "member_email": email,
                            "role": role,
                            "organization_name": org_name,
                        },
                    )
                )
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] notify invite accepted: {exc}")

    if requires_license and not is_dev_user(email):
        cedula_verification.maybe_send_cedula_upload_reminder(saved, force=True)
        asyncio.create_task(
            email_background(email_notifications.notify_admins_new_registration, saved)
        )

    return result_data
