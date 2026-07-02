"""Rutas FastAPI — módulo clínico Fase 1."""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, field_validator

import clinic_db
import cedula_verification
import cedula_ocr
import cedula_eligibility
import auth_security
import email_notifications
from membership_access import require_feature_for_profile
from supabase_client import (
    get_profile,
    get_profile_by_email,
    list_profiles,
    update_profile,
    list_consultations,
    resolve_cedula_document_url,
    fetch_cedula_document_bytes,
    create_support_ticket,
    insert_support_message,
    list_support_tickets_for_user,
    list_support_tickets_admin,
    get_support_ticket,
    list_support_messages,
    update_support_ticket,
)

clinic_router = APIRouter(prefix="/api", tags=["clinic"])

WRITE_ROLES = {"owner", "admin", "veterinarian", "receptionist"}
ADMIN_ROLES = {"owner", "admin"}


def _is_platform_admin(profile: Optional[dict]) -> bool:
    return auth_security.is_platform_admin_profile(profile)


async def _require_platform_admin(vet_id: str) -> dict:
    profile, err = get_profile(vet_id)
    if err or not profile:
        raise HTTPException(status_code=404, detail="Veterinario no encontrado")
    if not _is_platform_admin(profile):
        raise HTTPException(status_code=403, detail="Acceso restringido a administradores de plataforma")
    return profile


class OrganizationPatch(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None


class MemberAdd(BaseModel):
    email: str
    role: str = "veterinarian"


class AdminDeleteUserBody(BaseModel):
    email: str


class AdminCedulaReview(BaseModel):
    action: str  # approve | reject
    note: Optional[str] = None


class SupportTicketCreate(BaseModel):
    subject: str
    message: str
    priority: str = "normal"
    context_view: Optional[str] = None
    chat_history: Optional[list] = None


class SupportMessageCreate(BaseModel):
    body: str


class AdminSupportTicketPatch(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    admin_notes: Optional[str] = None


class AdminSupportReply(BaseModel):
    body: str
    status: Optional[str] = None


class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class PatientCreate(BaseModel):
    client_id: str
    name: str
    species: Optional[str] = None
    breed: Optional[str] = None
    sex: Optional[str] = None
    birth_date: Optional[str] = None
    microchip: Optional[str] = None
    color: Optional[str] = None
    weight_kg: Optional[float] = None
    status: Optional[str] = "active"
    notes: Optional[str] = None

    @field_validator("birth_date", mode="before")
    @classmethod
    def _birth_date_empty_to_none(cls, value: Any) -> Optional[str]:
        if value == "" or value is None:
            return None
        return value


class PatientUpdate(BaseModel):
    client_id: Optional[str] = None
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    sex: Optional[str] = None
    birth_date: Optional[str] = None
    microchip: Optional[str] = None
    color: Optional[str] = None
    weight_kg: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("birth_date", mode="before")
    @classmethod
    def _birth_date_empty_to_none(cls, value: Any) -> Optional[str]:
        if value == "" or value is None:
            return None
        return value


class AppointmentCreate(BaseModel):
    patient_id: str
    client_id: str
    veterinarian_id: Optional[str] = None
    branch_id: Optional[str] = None
    starts_at: str
    ends_at: str
    appointment_type: str = "consultation"
    status: str = "scheduled"
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    patient_id: Optional[str] = None
    client_id: Optional[str] = None
    veterinarian_id: Optional[str] = None
    branch_id: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    appointment_type: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


def _require_vet_id(x_veterinarian_id: Optional[str]) -> str:
    return auth_security.resolve_authenticated_vet_id(x_veterinarian_id)


def _format_chat_history(history: Optional[list]) -> str:
    lines = []
    for item in history or []:
        if not isinstance(item, dict):
            continue
        role = (item.get("role") or "user").lower()
        content = (item.get("content") or "").strip()
        if not content:
            continue
        label = "Usuario" if role == "user" else "Asistente"
        lines.append(f"[{label}] {content}")
    return "\n\n".join(lines)


def _serialize_ticket(ticket: dict, messages: Optional[list] = None) -> dict:
    row = dict(ticket)
    if messages is not None:
        row["messages"] = messages
    return row


async def _load_ticket_for_user(ticket_id: str, user_id: str) -> dict:
    ticket, err = get_support_ticket(ticket_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if (ticket.get("user_id") or "").strip() != user_id.strip():
        raise HTTPException(status_code=403, detail="No autorizado")
    return ticket


async def _email_background(fn, *args, **kwargs) -> None:
    try:
        await asyncio.to_thread(fn, *args, **kwargs)
    except Exception as exc:  # noqa: BLE001
        print(f"[WARN] Notificación email: {exc}")


async def _resolve_org_context(vet_id: str):
    profile, err = get_profile(vet_id)
    if err or not profile:
        raise HTTPException(status_code=404, detail="Veterinario no encontrado")

    org_name = profile.get("nombre") or profile.get("email") or "Mi consultorio"
    ctx, err = clinic_db.ensure_organization_for_profile(vet_id, f"Consultorio {org_name}")
    if err:
        raise HTTPException(status_code=500, detail=f"Error de organización: {err}")

    org = ctx.get("organization") or {}
    membership = ctx.get("membership") or {}
    org_id = org.get("id") or membership.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=500, detail="Organización no disponible")

    return {
        "profile": profile,
        "organization": org,
        "organization_id": org_id,
        "role": membership.get("role") or "veterinarian",
        "membership": membership,
    }


def _check_write(role: str) -> None:
    if role not in WRITE_ROLES:
        raise HTTPException(status_code=403, detail="Permiso denegado")


def _require_membership_feature(ctx: dict, feature: str) -> None:
    require_feature_for_profile(ctx.get("profile"), feature)


def _coerce_analysis_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ("text", "analysis", "ai_analysis", "detailed_analysis", "content"):
            nested = value.get(key)
            if isinstance(nested, str) and nested.strip():
                return nested
        import json

        try:
            return json.dumps(value, ensure_ascii=False, indent=2)
        except (TypeError, ValueError):
            return str(value)
    if isinstance(value, list):
        return "\n".join(str(item) for item in value if item is not None)
    return str(value)


def _serialize_consultation_row(row: dict) -> dict:
    payload = row.get("payload") or {}
    form_data = payload.get("form_data") or payload.get("consultation_data") or {}
    return {
        "id": row.get("id"),
        "veterinarian_id": row.get("user_id"),
        "category": payload.get("category"),
        "especie": payload.get("category"),
        "form_data": form_data,
        "detalle_paciente": payload.get("detalle_paciente"),
        "analysis": _coerce_analysis_text(row.get("analysis")),
        "status": row.get("status"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "rating": row.get("rating"),
        "nombre_mascota": form_data.get("nombre_mascota"),
        "nombre_dueño": form_data.get("nombre_dueño") or form_data.get("nombre_dueno"),
        "raza": form_data.get("raza"),
        "edad": form_data.get("edad"),
        "sexo": form_data.get("sexo"),
        "peso": form_data.get("peso"),
        "motivo_consulta": form_data.get("motivo_consulta"),
        "sintomas": form_data.get("sintomas"),
        "parametros_vitales": payload.get("parametros_vitales"),
        "laboratorio_estudios": payload.get("laboratorio_estudios"),
        "ambiente_manejo": payload.get("ambiente_manejo"),
        "notas_adicionales": payload.get("notas_adicionales"),
    }


@clinic_router.get("/organization")
async def get_organization(x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    members, err = clinic_db.list_members_enriched(ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"organization": ctx["organization"], "membership": ctx["membership"], "members": members}


@clinic_router.patch("/organization")
async def patch_organization(body: OrganizationPatch, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    if ctx["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Solo administradores pueden editar la organización")
    fields = body.model_dump(exclude_none=True)
    if not fields:
        return {"organization": ctx["organization"]}
    org, err = clinic_db.update_organization(ctx["organization_id"], fields)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"organization": org}


@clinic_router.get("/organization/members")
async def get_organization_members(x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    members, err = clinic_db.list_members_enriched(ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"members": members}


@clinic_router.post("/organization/members")
async def add_organization_member(body: MemberAdd, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    if ctx["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Solo administradores pueden invitar miembros")

    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email requerido")

    profile, err = get_profile_by_email(email)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="No hay cuenta GUIAA con ese email. El usuario debe registrarse primero.",
        )

    member, add_err = clinic_db.add_organization_member(
        ctx["organization_id"],
        profile["id"],
        body.role,
    )
    if add_err:
        raise HTTPException(status_code=400, detail=add_err)
    return {
        "member": {
            **member,
            "nombre": profile.get("nombre"),
            "email": profile.get("email"),
        },
        "message": f"{profile.get('nombre') or email} agregado al equipo.",
    }


@clinic_router.delete("/organization/members/{member_id}")
async def remove_organization_member_route(member_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    if ctx["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Solo administradores pueden quitar miembros")

    ok, err = clinic_db.remove_organization_member(ctx["organization_id"], member_id)
    if not ok:
        raise HTTPException(status_code=400, detail=err or "No se pudo eliminar")
    return {"message": "Miembro eliminado del consultorio"}


@clinic_router.get("/clients")
async def api_list_clients(search: str = "", limit: int = 100, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    clients, err = clinic_db.list_clients(ctx["organization_id"], search=search, limit=limit)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"clients": clients}


@clinic_router.post("/clients")
async def api_create_client(body: ClientCreate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _check_write(ctx["role"])
    client, err = clinic_db.insert_client({"organization_id": ctx["organization_id"], **body.model_dump()})
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"client": client}


@clinic_router.get("/clients/{client_id}")
async def api_get_client(client_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    client, err = clinic_db.get_client(client_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    patients, _ = clinic_db.list_patients(ctx["organization_id"], client_id=client_id)
    return {"client": client, "patients": patients}


@clinic_router.patch("/clients/{client_id}")
async def api_update_client(client_id: str, body: ClientUpdate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _check_write(ctx["role"])
    client, err = clinic_db.update_client(client_id, ctx["organization_id"], body.model_dump(exclude_none=True))
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"client": client}


@clinic_router.delete("/clients/{client_id}")
async def api_delete_client(client_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    if ctx["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar clientes")
    err = clinic_db.delete_client(client_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"message": "Cliente eliminado"}


@clinic_router.get("/patients")
async def api_list_patients(
    search: str = "",
    client_id: Optional[str] = None,
    limit: int = 100,
    x_veterinarian_id: str = Header(None),
):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    patients, err = clinic_db.list_patients(ctx["organization_id"], search=search, client_id=client_id, limit=limit)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"patients": patients}


@clinic_router.post("/patients")
async def api_create_patient(body: PatientCreate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _check_write(ctx["role"])
    client, err = clinic_db.get_client(body.client_id, ctx["organization_id"])
    if err or not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    patient, err = clinic_db.insert_patient({"organization_id": ctx["organization_id"], **body.model_dump()})
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"patient": patient}


@clinic_router.get("/patients/{patient_id}")
async def api_get_patient(patient_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    patient, err = clinic_db.get_patient(patient_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    consultations, _ = clinic_db.list_consultations_for_patient(patient_id)
    medical_images, _ = clinic_db.list_medical_images_for_patient(
        patient_id, patient_name=patient.get("name")
    )
    return {
        "patient": patient,
        "consultations": [_serialize_consultation_row(c) for c in consultations],
        "medical_images": medical_images,
    }


@clinic_router.patch("/patients/{patient_id}")
async def api_update_patient(patient_id: str, body: PatientUpdate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _check_write(ctx["role"])
    fields = body.model_dump(exclude_none=True)
    if fields.get("client_id"):
        client, err = clinic_db.get_client(fields["client_id"], ctx["organization_id"])
        if err or not client:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
    patient, err = clinic_db.update_patient(patient_id, ctx["organization_id"], fields)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return {"patient": patient}


@clinic_router.delete("/patients/{patient_id}")
async def api_delete_patient(patient_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    if ctx["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar pacientes")
    err = clinic_db.delete_patient(patient_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"message": "Paciente eliminado"}


@clinic_router.get("/clients/{client_id}/patients")
async def api_client_patients(client_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    client, err = clinic_db.get_client(client_id, ctx["organization_id"])
    if err or not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    patients, err = clinic_db.list_patients(ctx["organization_id"], client_id=client_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"patients": patients}


@clinic_router.get("/appointments/calendar")
async def api_calendar(
    from_date: str,
    to_date: str,
    veterinarian_id: Optional[str] = None,
    x_veterinarian_id: str = Header(None),
):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    appts, err = clinic_db.list_appointments_calendar(ctx["organization_id"], from_date, to_date, veterinarian_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"appointments": appts}


@clinic_router.get("/appointments")
async def api_list_appointments(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    x_veterinarian_id: str = Header(None),
):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    if not from_date:
        from_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
    if not to_date:
        to_date = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59).isoformat()
    appts, err = clinic_db.list_appointments_calendar(ctx["organization_id"], from_date, to_date)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"appointments": appts}


@clinic_router.post("/appointments")
async def api_create_appointment(body: AppointmentCreate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _check_write(ctx["role"])
    patient, err = clinic_db.get_patient(body.patient_id, ctx["organization_id"])
    if err or not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    row = {**body.model_dump(), "organization_id": ctx["organization_id"], "veterinarian_id": body.veterinarian_id or vet_id}
    appt, err = clinic_db.insert_appointment(row)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"appointment": appt}


@clinic_router.get("/appointments/{appointment_id}")
async def api_get_appointment(appointment_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    appt, err = clinic_db.get_appointment(appointment_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return {"appointment": appt}


@clinic_router.patch("/appointments/{appointment_id}")
async def api_update_appointment(appointment_id: str, body: AppointmentUpdate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _check_write(ctx["role"])
    appt, err = clinic_db.update_appointment(appointment_id, ctx["organization_id"], body.model_dump(exclude_none=True))
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return {"appointment": appt}


@clinic_router.delete("/appointments/{appointment_id}")
async def api_delete_appointment(appointment_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _check_write(ctx["role"])
    err = clinic_db.delete_appointment(appointment_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"message": "Cita eliminada"}


class AppointmentRequestCreate(BaseModel):
    organization_id: str
    client_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    patient_name: str
    species: Optional[str] = None
    preferred_starts_at: Optional[str] = None
    reason: Optional[str] = None


class AppointmentRequestUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None


def _format_appt_time(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%H:%M")
    except (ValueError, TypeError):
        return ""


def _build_clinic_notifications(org_id: str) -> list[dict]:
    notifications: list[dict] = []
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    tomorrow_end = today_start + timedelta(days=2)
    soon_limit = now + timedelta(hours=2)

    appts_today, _ = clinic_db.list_appointments_calendar(
        org_id, today_start.isoformat(), today_end.isoformat()
    )
    appts_tomorrow, _ = clinic_db.list_appointments_calendar(
        org_id, today_end.isoformat(), tomorrow_end.isoformat()
    )

    for appt in appts_today or []:
        if appt.get("status") in ("cancelled", "completed", "no_show"):
            continue
        patient = (appt.get("patients") or {}).get("name") or "Paciente"
        starts = appt.get("starts_at") or now.isoformat()
        try:
            starts_dt = datetime.fromisoformat(starts.replace("Z", "+00:00"))
            if starts_dt.tzinfo is None:
                starts_dt = starts_dt.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            starts_dt = now

        time_label = _format_appt_time(starts)
        if now <= starts_dt <= soon_limit:
            notifications.append(
                {
                    "id": f"appt-urgent-{appt['id']}",
                    "type": "reminder",
                    "title": "Cita en breve",
                    "description": f"{patient} a las {time_label}",
                    "timestamp": starts,
                    "action": "agenda",
                    "related_id": appt.get("id"),
                }
            )
        else:
            notifications.append(
                {
                    "id": f"appt-today-{appt['id']}",
                    "type": "reminder",
                    "title": "Cita hoy",
                    "description": f"{patient} a las {time_label}",
                    "timestamp": starts,
                    "action": "agenda",
                    "related_id": appt.get("id"),
                }
            )

    for appt in appts_tomorrow or []:
        if appt.get("status") in ("cancelled", "completed", "no_show"):
            continue
        patient = (appt.get("patients") or {}).get("name") or "Paciente"
        starts = appt.get("starts_at") or now.isoformat()
        notifications.append(
            {
                "id": f"appt-tomorrow-{appt['id']}",
                "type": "reminder",
                "title": "Cita mañana",
                "description": f"{patient} a las {_format_appt_time(starts)}",
                "timestamp": starts,
                "action": "agenda",
                "related_id": appt.get("id"),
            }
        )

    pending, _ = clinic_db.list_appointment_requests(org_id, status="pending", limit=20)
    for req in pending or []:
        notifications.append(
            {
                "id": f"req-{req['id']}",
                "type": "info",
                "title": "Solicitud de cita",
                "description": f"{req.get('client_name', 'Cliente')} — {req.get('patient_name', 'Paciente')}",
                "timestamp": req.get("created_at") or now.isoformat(),
                "action": "agenda",
                "related_id": req.get("id"),
            }
        )

    low_stock, _ = clinic_db.list_low_stock_products(org_id, limit=15)
    for product in low_stock or []:
        notifications.append(
            {
                "id": f"stock-{product['id']}",
                "type": "warning",
                "title": "Stock bajo",
                "description": f"{product.get('name', 'Producto')}: {product.get('stock_qty', 0)} {product.get('unit', 'pza')}",
                "timestamp": now.isoformat(),
                "action": "inventory",
                "related_id": product.get("id"),
            }
        )

    notifications.sort(key=lambda n: n.get("timestamp") or "", reverse=True)
    return notifications


def _build_support_notifications(vet_id: str) -> list[dict]:
    """Notificaciones in-app por respuestas de soporte humano."""
    notifications: list[dict] = []
    tickets, err = list_support_tickets_for_user(vet_id, limit=30)
    if err or not tickets:
        return notifications

    for ticket in tickets:
        ticket_id = ticket.get("id")
        if not ticket_id:
            continue
        messages, msg_err = list_support_messages(ticket_id)
        if msg_err:
            continue
        admin_msgs = [m for m in messages if (m.get("author_role") or "") == "admin"]
        if admin_msgs:
            last = admin_msgs[-1]
            preview = (last.get("body") or "").strip().replace("\n", " ")[:100]
            subject = ticket.get("subject") or "Tu ticket"
            notifications.append(
                {
                    "id": f"support-msg-{last.get('id')}",
                    "type": "support",
                    "title": "Respuesta de soporte",
                    "description": f"{subject}: {preview}",
                    "timestamp": last.get("created_at") or ticket.get("updated_at") or "",
                    "action": "support",
                    "related_id": ticket_id,
                }
            )
            continue

        status = (ticket.get("status") or "").lower()
        if status in ("resolved", "closed"):
            resolved_at = ticket.get("resolved_at") or ticket.get("updated_at") or ""
            notifications.append(
                {
                    "id": f"support-resolved-{ticket_id}",
                    "type": "support",
                    "title": "Ticket resuelto",
                    "description": ticket.get("subject") or "Tu consulta de soporte",
                    "timestamp": resolved_at,
                    "action": "support",
                    "related_id": ticket_id,
                }
            )

    return notifications


def _build_admin_support_notifications(profile: dict) -> list[dict]:
    """Notificaciones para admins de plataforma (tickets pendientes)."""
    if not auth_security.is_platform_admin_profile(profile):
        return []

    notifications: list[dict] = []
    tickets, err = list_support_tickets_admin(status="", limit=100)
    if err or not tickets:
        return notifications

    for ticket in tickets:
        status = (ticket.get("status") or "").lower()
        if status in ("resolved", "closed"):
            continue
        ticket_id = ticket.get("id")
        if not ticket_id:
            continue

        messages, msg_err = list_support_messages(ticket_id)
        if msg_err:
            continue

        user_name = ticket.get("user_name") or ticket.get("user_email") or "Usuario"
        subject = ticket.get("subject") or "Sin asunto"
        last_msg = messages[-1] if messages else None

        if last_msg and (last_msg.get("author_role") or "") == "user":
            preview = (last_msg.get("body") or "").strip().replace("\n", " ")[:80]
            notifications.append(
                {
                    "id": f"admin-support-user-{last_msg.get('id')}",
                    "type": "admin",
                    "title": "Mensaje en ticket",
                    "description": f"{user_name}: {preview or subject}",
                    "timestamp": last_msg.get("created_at") or ticket.get("updated_at") or "",
                    "action": "admin-support",
                    "related_id": ticket_id,
                }
            )
        else:
            notifications.append(
                {
                    "id": f"admin-support-open-{ticket_id}",
                    "type": "admin",
                    "title": "Ticket pendiente",
                    "description": f"{user_name}: {subject}",
                    "timestamp": ticket.get("updated_at") or ticket.get("created_at") or "",
                    "action": "admin-support",
                    "related_id": ticket_id,
                }
            )

    return notifications


@clinic_router.get("/notifications")
async def api_notifications(x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    profile, _ = get_profile(vet_id)
    notifications = _build_clinic_notifications(ctx["organization_id"])
    notifications.extend(_build_support_notifications(vet_id))
    if profile:
        notifications.extend(_build_admin_support_notifications(profile))
    notifications.sort(key=lambda n: n.get("timestamp") or "", reverse=True)
    return {"notifications": notifications}


@clinic_router.get("/appointment-requests")
async def api_list_appointment_requests(
    status: Optional[str] = None,
    x_veterinarian_id: str = Header(None),
):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    rows, err = clinic_db.list_appointment_requests(ctx["organization_id"], status=status)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"requests": rows}


@clinic_router.patch("/appointment-requests/{request_id}")
async def api_update_appointment_request(
    request_id: str,
    body: AppointmentRequestUpdate,
    x_veterinarian_id: str = Header(None),
):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _check_write(ctx["role"])

    current, err = clinic_db.get_appointment_request(request_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not current:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    fields = body.model_dump(exclude_none=True, exclude={"starts_at", "ends_at"})
    updated, err = clinic_db.update_appointment_request(
        request_id, ctx["organization_id"], fields
    )
    if err:
        raise HTTPException(status_code=500, detail=err)

    if body.status == "approved" and current.get("status") == "pending":
        client_name = current.get("client_name") or "Cliente"
        existing_clients, _ = clinic_db.list_clients(ctx["organization_id"], search=client_name, limit=10)
        client_id = None
        for c in existing_clients or []:
            if (c.get("name") or "").strip().lower() == client_name.strip().lower():
                client_id = c.get("id")
                break
        if not client_id:
            created_client, c_err = clinic_db.insert_client(
                {
                    "organization_id": ctx["organization_id"],
                    "name": client_name,
                    "phone": current.get("phone"),
                    "email": current.get("email"),
                }
            )
            if c_err or not created_client:
                raise HTTPException(status_code=500, detail=f"No se pudo crear cliente: {c_err}")
            client_id = created_client["id"]

        created_patient, p_err = clinic_db.insert_patient(
            {
                "organization_id": ctx["organization_id"],
                "client_id": client_id,
                "name": current.get("patient_name") or "Paciente",
                "species": current.get("species"),
            }
        )
        if p_err or not created_patient:
            raise HTTPException(status_code=500, detail=f"No se pudo crear paciente: {p_err}")

        start_dt = None
        end_dt = None
        if body.starts_at:
            try:
                start_dt = datetime.fromisoformat(body.starts_at.replace("Z", "+00:00"))
            except (ValueError, TypeError) as exc:
                raise HTTPException(status_code=400, detail="Fecha de inicio inválida") from exc
        preferred = current.get("preferred_starts_at")
        if start_dt is None and preferred:
            try:
                start_dt = datetime.fromisoformat(preferred.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                start_dt = None
        if start_dt is None:
            start_dt = datetime.now(timezone.utc) + timedelta(days=1)
            start_dt = start_dt.replace(hour=10, minute=0, second=0, microsecond=0)
        if body.ends_at:
            try:
                end_dt = datetime.fromisoformat(body.ends_at.replace("Z", "+00:00"))
            except (ValueError, TypeError) as exc:
                raise HTTPException(status_code=400, detail="Fecha de fin inválida") from exc
        if end_dt is None:
            end_dt = start_dt + timedelta(minutes=30)

        appt, a_err = clinic_db.insert_appointment(
            {
                "organization_id": ctx["organization_id"],
                "patient_id": created_patient["id"],
                "client_id": client_id,
                "veterinarian_id": vet_id,
                "starts_at": start_dt.isoformat(),
                "ends_at": end_dt.isoformat(),
                "status": "scheduled",
                "reason": current.get("reason"),
                "notes": f"Creada desde solicitud portal {request_id}",
            }
        )
        if a_err:
            raise HTTPException(status_code=500, detail=f"Cita no creada: {a_err}")
        updated = updated or {}
        updated["appointment"] = appt

        org, _ = clinic_db.get_organization(ctx["organization_id"])
        await _email_background(
            email_notifications.notify_client_appointment_status,
            current,
            (org or {}).get("name") or "Consultorio",
            "approved",
            start_dt.isoformat(),
        )

    if body.status == "rejected" and current.get("status") == "pending":
        org, _ = clinic_db.get_organization(ctx["organization_id"])
        await _email_background(
            email_notifications.notify_client_appointment_status,
            current,
            (org or {}).get("name") or "Consultorio",
            "rejected",
        )

    return {"request": updated}


@clinic_router.get("/public/organizations/{organization_id}")
async def api_public_organization(organization_id: str):
    org, err = clinic_db.get_organization(organization_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not org:
        raise HTTPException(status_code=404, detail="Consultorio no encontrado")
    return {"organization": {"id": org["id"], "name": org.get("name")}}


@clinic_router.post("/public/appointment-requests")
async def api_public_appointment_request(body: AppointmentRequestCreate):
    org, err = clinic_db.get_organization(body.organization_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not org:
        raise HTTPException(status_code=404, detail="Consultorio no encontrado")

    row = {
        "organization_id": body.organization_id,
        "client_name": body.client_name.strip(),
        "phone": body.phone,
        "email": body.email,
        "patient_name": body.patient_name.strip(),
        "species": body.species,
        "preferred_starts_at": body.preferred_starts_at,
        "reason": body.reason,
        "status": "pending",
    }
    created, ins_err = clinic_db.insert_appointment_request(row)
    if ins_err:
        if "appointment_requests" in ins_err:
            raise HTTPException(
                status_code=503,
                detail="El portal de citas aún no está configurado. Aplica la migración appointment_requests.",
            )
        raise HTTPException(status_code=500, detail=ins_err)

    members, _ = clinic_db.list_members_enriched(body.organization_id)
    staff_emails = [
        m.get("email")
        for m in (members or [])
        if m.get("email") and m.get("role") in ("owner", "admin", "veterinarian", "receptionist")
    ]
    await _email_background(
        email_notifications.notify_clinic_appointment_request,
        org,
        created or row,
        staff_emails,
    )

    return {"request": created, "message": "Solicitud enviada. El consultorio te contactará pronto."}


class GuiaConsultasLeadCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None
    privacy_accepted: bool = False


class AdminGuiaConsultasLeadPatch(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None


@clinic_router.post("/public/guia-consultas-leads")
async def api_public_guia_consultas_lead(body: GuiaConsultasLeadCreate):
    name = body.name.strip()
    email = (body.email or "").strip().lower()
    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Ingresa tu nombre.")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Ingresa un email válido.")
    if not body.privacy_accepted:
        raise HTTPException(status_code=400, detail="Debes aceptar el tratamiento de datos personales.")

    row = {
        "name": name,
        "email": email,
        "phone": (body.phone or "").strip() or None,
        "message": (body.message or "").strip() or None,
        "privacy_accepted": True,
        "status": "new",
        "source": "landing",
    }
    created, ins_err = clinic_db.insert_guia_consultas_lead(row)
    if ins_err:
        if "guia_consultas_leads" in ins_err:
            raise HTTPException(
                status_code=503,
                detail="Las solicitudes Guía Consultas aún no están configuradas. Aplica la migración guia_consultas_leads.",
            )
        raise HTTPException(status_code=500, detail=ins_err)

    await _email_background(email_notifications.notify_admins_guia_consultas_lead, created or row)
    return {
        "lead": created,
        "message": "Solicitud enviada. El equipo GUIAA te contactará pronto sobre ADSGuiaa.",
    }


@clinic_router.get("/admin/guia-consultas-leads")
async def admin_list_guia_consultas_leads(
    status: str = "",
    x_veterinarian_id: str = Header(None),
):
    await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    leads, err = clinic_db.list_guia_consultas_leads(status=status.strip(), limit=200)
    if err:
        raise HTTPException(status_code=500, detail=err)
    new_rows, _ = clinic_db.list_guia_consultas_leads(status="new", limit=500)
    return {
        "leads": leads,
        "count": len(leads),
        "new_count": len(new_rows or []),
    }


@clinic_router.patch("/admin/guia-consultas-leads/{lead_id}")
async def admin_patch_guia_consultas_lead(
    lead_id: str,
    body: AdminGuiaConsultasLeadPatch,
    x_veterinarian_id: str = Header(None),
):
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    current, err = clinic_db.get_guia_consultas_lead(lead_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not current:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    fields = body.model_dump(exclude_none=True)
    if "status" in fields:
        status = fields["status"].lower().strip()
        if status not in ("new", "contacted", "closed"):
            raise HTTPException(status_code=400, detail="Estado inválido")
        fields["status"] = status

    updated, upd_err = clinic_db.update_guia_consultas_lead(lead_id, fields)
    if upd_err:
        raise HTTPException(status_code=500, detail=upd_err)

    auth_security.audit_admin_action(
        admin,
        "guia_consultas_lead_update",
        target_email=current.get("email"),
        metadata={"lead_id": lead_id, **fields},
    )
    return {"lead": updated or {**current, **fields}}


class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: str = "pza"
    price: float = 0
    cost: float = 0
    stock_qty: float = 0
    min_stock: float = 0
    notes: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock_qty: Optional[float] = None
    min_stock: Optional[float] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class StockMovementCreate(BaseModel):
    movement_type: str
    quantity: float
    reason: Optional[str] = None


class InvoiceItemCreate(BaseModel):
    product_id: Optional[str] = None
    description: str
    quantity: float = 1
    unit_price: float


class InvoiceCreate(BaseModel):
    client_id: Optional[str] = None
    patient_id: Optional[str] = None
    tax_rate: float = 0
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    status: str = "issued"
    deduct_stock: bool = True
    items: list[InvoiceItemCreate]


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


@clinic_router.get("/inventory/summary")
async def api_inventory_summary(x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "inventory")
    org_id = ctx["organization_id"]
    products, err = clinic_db.list_products(org_id, limit=500)
    if err:
        raise HTTPException(status_code=500, detail=err)
    low, _ = clinic_db.list_low_stock_products(org_id, limit=500)
    total_value = 0.0
    for product in products or []:
        qty = float(product.get("stock_qty") or 0)
        unit_cost = float(product.get("cost") or product.get("price") or 0)
        total_value += qty * unit_cost
    return {
        "product_count": len(products or []),
        "low_stock_count": len(low or []),
        "inventory_value": round(total_value, 2),
        "low_stock_products": low[:10],
    }


@clinic_router.get("/products")
async def api_list_products(search: str = "", x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "inventory")
    products, err = clinic_db.list_products(ctx["organization_id"], search=search)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"products": products}


@clinic_router.post("/products")
async def api_create_product(body: ProductCreate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "inventory")
    _check_write(ctx["role"])
    row = {"organization_id": ctx["organization_id"], **body.model_dump()}
    product, err = clinic_db.insert_product(row)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"product": product}


@clinic_router.patch("/products/{product_id}")
async def api_update_product(product_id: str, body: ProductUpdate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "inventory")
    _check_write(ctx["role"])
    product, err = clinic_db.update_product(product_id, ctx["organization_id"], body.model_dump(exclude_none=True))
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"product": product}


@clinic_router.delete("/products/{product_id}")
async def api_delete_product(product_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "inventory")
    if ctx["role"] not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar productos")
    err = clinic_db.delete_product(product_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"message": "Producto eliminado"}


@clinic_router.post("/products/{product_id}/stock-movement")
async def api_stock_movement(product_id: str, body: StockMovementCreate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "inventory")
    _check_write(ctx["role"])
    movement, err = clinic_db.insert_stock_movement(
        ctx["organization_id"],
        product_id,
        body.movement_type,
        body.quantity,
        body.reason,
        vet_id,
    )
    if err:
        raise HTTPException(status_code=400, detail=err)
    product, _ = clinic_db.get_product(product_id, ctx["organization_id"])
    return {"movement": movement, "product": product}


@clinic_router.get("/products/{product_id}/movements")
async def api_product_movements(product_id: str, x_veterinarian_id: str = Header(None), limit: int = 50):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "inventory")
    product, err = clinic_db.get_product(product_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    movements, mov_err = clinic_db.list_stock_movements(
        ctx["organization_id"], product_id=product_id, limit=min(limit, 100)
    )
    if mov_err:
        raise HTTPException(status_code=500, detail=mov_err)
    return {"movements": movements, "product": product}


@clinic_router.get("/invoices")
async def api_list_invoices(status: Optional[str] = None, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "billing")
    invoices, err = clinic_db.list_invoices(ctx["organization_id"], status=status)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"invoices": invoices}


@clinic_router.post("/invoices")
async def api_create_invoice(body: InvoiceCreate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "billing")
    _check_write(ctx["role"])
    if body.client_id:
        client, err = clinic_db.get_client(body.client_id, ctx["organization_id"])
        if err or not client:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
    header = body.model_dump(exclude={"items", "deduct_stock"})
    items = [item.model_dump() for item in body.items]
    invoice, err = clinic_db.create_invoice_with_items(
        ctx["organization_id"],
        header,
        items,
        deduct_stock=body.deduct_stock,
        created_by=vet_id,
    )
    if err:
        raise HTTPException(status_code=400 if "Stock" in err or "insuficiente" in err else 500, detail=err)
    return {"invoice": invoice}


@clinic_router.get("/invoices/{invoice_id}")
async def api_get_invoice(invoice_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "billing")
    invoice, err = clinic_db.get_invoice(invoice_id, ctx["organization_id"])
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not invoice:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")
    return {"invoice": invoice}


@clinic_router.patch("/invoices/{invoice_id}")
async def api_update_invoice(invoice_id: str, body: InvoiceUpdate, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "billing")
    _check_write(ctx["role"])
    invoice, err = clinic_db.update_invoice(invoice_id, ctx["organization_id"], body.model_dump(exclude_none=True))
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not invoice:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")
    return {"invoice": invoice}


@clinic_router.get("/dashboard/overview")
async def api_dashboard_overview(x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    org_id = ctx["organization_id"]

    members, _ = clinic_db.list_members(org_id)
    member_ids = [m.get("profile_id") for m in members or [] if m.get("profile_id")]

    dashboard, err = clinic_db.get_dashboard_overview(org_id, member_ids or [vet_id])
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"dashboard": dashboard}


@clinic_router.get("/reports/overview")
async def api_reports_overview(
    from_date: str,
    to_date: str,
    x_veterinarian_id: str = Header(None),
):
    vet_id = _require_vet_id(x_veterinarian_id)
    ctx = await _resolve_org_context(vet_id)
    _require_membership_feature(ctx, "reports")
    org_id = ctx["organization_id"]

    try:
        from_dt = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
        to_dt = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Fechas inválidas") from exc

    if to_dt < from_dt:
        raise HTTPException(status_code=400, detail="to_date debe ser posterior a from_date")

    members, _ = clinic_db.list_members(org_id)
    member_ids = [m.get("profile_id") for m in members or [] if m.get("profile_id")]

    overview, err = clinic_db.get_reports_overview(
        org_id,
        from_dt.isoformat(),
        to_dt.isoformat(),
        member_ids or [vet_id],
    )
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"overview": overview}


@clinic_router.get("/admin/access")
async def admin_access(x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    profile, _ = get_profile(vet_id)
    return {"platform_admin": _is_platform_admin(profile)}


@clinic_router.get("/admin/overview")
async def admin_overview(x_veterinarian_id: str = Header(None)):
    await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    profiles, err = list_profiles(limit=5000)
    if err:
        raise HTTPException(status_code=500, detail=err)
    orgs, org_err = clinic_db.list_organizations(limit=500)
    if org_err:
        raise HTTPException(status_code=500, detail=org_err)
    clients_count, _ = clinic_db.count_table_rows("clients")
    patients_count, _ = clinic_db.count_table_rows("patients")
    appts_count, _ = clinic_db.count_table_rows("appointments")
    premium = sum(1 for p in profiles if (p.get("membership_type") or "").lower() == "premium")
    trial = sum(1 for p in profiles if not p.get("membership_type") and (p.get("consultations_remaining") or 0) > 0)
    return {
        "overview": {
            "users_total": len(profiles),
            "organizations_total": len(orgs),
            "premium_users": premium,
            "trial_users": trial,
            "clients_total": clients_count,
            "patients_total": patients_count,
            "appointments_total": appts_count,
        }
    }


@clinic_router.get("/admin/users")
async def admin_list_users(
    search: str = "",
    plan_filter: str = "all",
    limit: int = 100,
    x_veterinarian_id: str = Header(None),
):
    await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    profiles, err = list_profiles(limit=min(limit, 500))
    if err:
        raise HTTPException(status_code=500, detail=err)
    q = search.lower().strip()
    pf = (plan_filter or "all").lower().strip()
    paid_plans = {"basic", "professional", "premium"}
    rows = []
    for profile in profiles:
        membership = (profile.get("membership_type") or "").lower().strip()
        if pf == "paid" and membership not in paid_plans:
            continue
        if pf == "trial" and membership in paid_plans:
            continue
        if q:
            haystack = " ".join(
                [
                    profile.get("email") or "",
                    profile.get("nombre") or "",
                    profile.get("membership_type") or "",
                ]
            ).lower()
            if q not in haystack:
                continue
        rows.append(
            {
                "id": profile.get("id"),
                "email": profile.get("email"),
                "nombre": profile.get("nombre"),
                "membership_type": profile.get("membership_type"),
                "consultations_remaining": profile.get("consultations_remaining"),
                "created_at": profile.get("created_at"),
                "cedula_profesional": profile.get("cedula_profesional"),
                "profesional_pais": profile.get("profesional_pais"),
                "cedula_verification_status": profile.get("cedula_verification_status"),
                "cedula_document_url": profile.get("cedula_document_url"),
                "cedula_sep_nombre": profile.get("cedula_sep_nombre"),
                "cedula_sep_profesion": profile.get("cedula_sep_profesion"),
                "cedula_verification_error": profile.get("cedula_verification_error"),
                "cedula_ocr_nombre": profile.get("cedula_ocr_nombre"),
                "cedula_ocr_registro": profile.get("cedula_ocr_registro"),
                "cedula_ocr_profesion": profile.get("cedula_ocr_profesion"),
                "cedula_ocr_confidence": profile.get("cedula_ocr_confidence"),
                "cedula_ocr_match": profile.get("cedula_ocr_match"),
                "cedula_ocr_notes": profile.get("cedula_ocr_notes"),
                "cedula_eligibility_puede_ejercer": profile.get("cedula_eligibility_puede_ejercer"),
                "cedula_eligibility_confianza": profile.get("cedula_eligibility_confianza"),
                "cedula_eligibility_resumen": profile.get("cedula_eligibility_resumen"),
                "cedula_eligibility_fuente": profile.get("cedula_eligibility_fuente"),
            }
        )
        if len(rows) >= limit:
            break
    return {"users": rows, "plan_filter": pf, "count": len(rows)}


@clinic_router.post("/admin/users/{profile_id}/cedula/verify")
async def admin_verify_user_cedula(profile_id: str, x_veterinarian_id: str = Header(None)):
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    result = await cedula_verification.verify_profile_cedula(profile_id)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Error de verificación")
    auth_security.audit_admin_action(
        admin,
        "cedula_verify_sep",
        target_profile_id=profile_id,
        metadata={"result": result.get("status")},
    )
    return result


@clinic_router.post("/admin/users/{profile_id}/cedula/review")
async def admin_review_user_cedula(
    profile_id: str,
    body: AdminCedulaReview,
    x_veterinarian_id: str = Header(None),
):
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    result = cedula_verification.manual_review_cedula(profile_id, body.action, body.note)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Error de revisión")
    auth_security.audit_admin_action(
        admin,
        f"cedula_{body.action}",
        target_profile_id=profile_id,
        metadata={"note": body.note or ""},
    )
    return result


@clinic_router.post("/admin/users/{profile_id}/cedula/eligibility")
async def admin_assess_user_cedula_eligibility(
    profile_id: str,
    x_veterinarian_id: str = Header(None),
):
    """Consulta portal oficial (SEP en MX) y genera dictamen IA de elegibilidad."""
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    profile, err = get_profile(profile_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not profile.get("cedula_document_url"):
        raise HTTPException(status_code=404, detail="Este usuario no tiene documento de cédula")

    ocr_result = None
    if cedula_ocr and cedula_ocr.is_cedula_ocr_enabled():
        ocr_result = await cedula_ocr.ensure_cedula_ocr(profile_id, profile)

    assessment = await cedula_eligibility.assess_practice_eligibility(
        profile_id,
        profile,
        ocr_result=ocr_result,
    )
    cedula_eligibility.store_eligibility_assessment(profile_id, assessment)

    auth_security.audit_admin_action(
        admin,
        "cedula_eligibility_assess",
        target_profile_id=profile_id,
        target_email=profile.get("email"),
        metadata={
            "puede_ejercer": assessment.puede_ejercer,
            "confianza": assessment.confianza,
            "fuente": assessment.fuente_oficial,
        },
    )

    return {
        "status": "ok",
        "puede_ejercer": assessment.puede_ejercer,
        "eligibility_confianza": assessment.confianza,
        "eligibility_resumen": assessment.resumen,
        "eligibility_motivos": assessment.motivos,
        "eligibility_fuente": assessment.fuente_oficial,
        "eligibility_recomendacion": assessment.recomendacion,
        "sep_nombre": assessment.sep_nombre,
        "sep_profesion": assessment.sep_profesion,
        "sep_consultado": assessment.sep_consultado,
        "message": cedula_eligibility.eligibility_user_message(assessment),
    }


@clinic_router.post("/admin/users/{profile_id}/cedula/ocr")
async def admin_rerun_user_cedula_ocr(profile_id: str, x_veterinarian_id: str = Header(None)):
    """Re-ejecuta OCR sobre el documento de cédula ya subido."""
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    profile, err = get_profile(profile_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not profile.get("cedula_document_url"):
        raise HTTPException(status_code=404, detail="Este usuario no tiene documento de cédula")

    result = await cedula_ocr.rerun_cedula_ocr_for_profile(profile_id)
    if not result.ok:
        raise HTTPException(status_code=400, detail=result.error or "No se pudo leer el documento")

    ocr_match = cedula_ocr.ocr_matches_profile(profile, result)
    auth_security.audit_admin_action(
        admin,
        "cedula_rerun_ocr",
        target_profile_id=profile_id,
        target_email=profile.get("email"),
        metadata={
            "ocr_registro": result.registro_profesional,
            "ocr_match": ocr_match,
            "confidence": result.confidence,
        },
    )
    match_label = "coincide con el perfil" if ocr_match else "no coincide con el perfil"
    return {
        "status": "ok",
        "ocr_nombre": result.nombre,
        "ocr_registro": result.registro_profesional,
        "ocr_profesion": result.profesion,
        "ocr_institucion": result.institucion,
        "ocr_confidence": result.confidence,
        "ocr_match": ocr_match,
        "ocr_notes": result.notes,
        "message": (
            f"OCR completado ({result.confidence or 'sin confianza'}): "
            f"registro {result.registro_profesional or '—'}, "
            f"nombre {result.nombre or '—'} ({match_label})."
        ),
    }


@clinic_router.get("/admin/users/{profile_id}/consultations")
async def admin_user_consultations(
    profile_id: str,
    limit: int = 50,
    x_veterinarian_id: str = Header(None),
):
    await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    profile, err = get_profile(profile_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    rows, list_err = list_consultations(profile_id, limit=min(limit, 100))
    if list_err:
        raise HTTPException(status_code=500, detail=list_err)
    return {
        "user": {
            "id": profile.get("id"),
            "email": profile.get("email"),
            "nombre": profile.get("nombre"),
        },
        "consultations": [_serialize_consultation_row(r) for r in rows],
        "count": len(rows),
    }


@clinic_router.get("/admin/users/{profile_id}/cedula/document")
async def admin_user_cedula_document(profile_id: str, x_veterinarian_id: str = Header(None)):
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    profile, err = get_profile(profile_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    stored_url = profile.get("cedula_document_url")
    if not stored_url:
        raise HTTPException(status_code=404, detail="Este usuario no tiene documento de cédula")
    access_url, resolve_err = resolve_cedula_document_url(stored_url)
    if not access_url:
        raise HTTPException(status_code=404, detail=resolve_err or "Documento no disponible")
    auth_security.audit_admin_action(
        admin,
        "cedula_view_document",
        target_profile_id=profile_id,
        target_email=profile.get("email"),
    )
    return {"url": access_url}


@clinic_router.get("/admin/users/{profile_id}/cedula/document/file")
async def admin_user_cedula_document_file(profile_id: str, x_veterinarian_id: str = Header(None)):
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    profile, err = get_profile(profile_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    stored_url = profile.get("cedula_document_url")
    if not stored_url:
        raise HTTPException(status_code=404, detail="Este usuario no tiene documento de cédula")
    data, content_type, fetch_err = await asyncio.to_thread(fetch_cedula_document_bytes, stored_url)
    if fetch_err or not data:
        raise HTTPException(status_code=404, detail=fetch_err or "Documento no disponible")
    auth_security.audit_admin_action(
        admin,
        "cedula_view_document",
        target_profile_id=profile_id,
        target_email=profile.get("email"),
    )
    media_type = content_type or "application/octet-stream"
    ext = ".pdf" if "pdf" in media_type else ""
    return Response(
        content=data,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="cedula-{profile_id}{ext}"',
            "Cache-Control": "private, no-store",
        },
    )


@clinic_router.get("/admin/organizations")
async def admin_list_organizations(x_veterinarian_id: str = Header(None)):
    await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    orgs, err = clinic_db.list_organizations(limit=500)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"organizations": orgs}


@clinic_router.post("/support/tickets")
async def create_support_ticket_route(
    body: SupportTicketCreate,
    x_veterinarian_id: str = Header(None),
):
    vet_id = _require_vet_id(x_veterinarian_id)
    profile, err = get_profile(vet_id)
    if err or not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    subject = (body.subject or "").strip()
    message = (body.message or "").strip()
    if len(subject) < 3:
        raise HTTPException(status_code=400, detail="El asunto debe tener al menos 3 caracteres")
    if len(message) < 5:
        raise HTTPException(status_code=400, detail="El mensaje debe tener al menos 5 caracteres")

    priority = (body.priority or "normal").lower().strip()
    if priority not in ("normal", "high"):
        priority = "normal"

    now = datetime.now(timezone.utc).isoformat()
    ticket_row = {
        "user_id": vet_id,
        "user_email": profile.get("email") or "",
        "user_name": profile.get("nombre"),
        "subject": subject[:200],
        "status": "open",
        "priority": priority,
        "context_view": (body.context_view or "")[:120] or None,
        "created_at": now,
        "updated_at": now,
    }
    ticket, ticket_err = create_support_ticket(ticket_row)
    if ticket_err or not ticket:
        raise HTTPException(status_code=500, detail=ticket_err or "No se pudo crear el ticket")

    ticket_id = ticket["id"]
    history_block = _format_chat_history(body.chat_history)
    full_body = message
    if history_block:
        full_body = f"{message}\n\n--- Historial del chat ---\n{history_block}"

    msg, msg_err = insert_support_message(
        {
            "ticket_id": ticket_id,
            "author_role": "user",
            "author_profile_id": vet_id,
            "body": full_body[:8000],
        }
    )
    if msg_err:
        raise HTTPException(status_code=500, detail=msg_err)

    await _email_background(email_notifications.notify_admins_new_ticket, ticket, message)

    return {"ticket": _serialize_ticket(ticket, [msg] if msg else [])}


@clinic_router.get("/support/tickets")
async def list_user_support_tickets(x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    tickets, err = list_support_tickets_for_user(vet_id, limit=50)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"tickets": tickets, "count": len(tickets)}


def _enrich_ticket_summary(ticket: dict) -> dict:
    ticket_id = ticket.get("id")
    row = dict(ticket)
    row["message_count"] = 0
    row["last_admin_message_id"] = None
    row["last_admin_at"] = None
    row["last_admin_preview"] = None
    if not ticket_id:
        return row
    messages, msg_err = list_support_messages(ticket_id)
    if msg_err:
        return row
    row["message_count"] = len(messages)
    admin_msgs = [m for m in messages if (m.get("author_role") or "") == "admin"]
    if admin_msgs:
        last = admin_msgs[-1]
        row["last_admin_message_id"] = last.get("id")
        row["last_admin_at"] = last.get("created_at")
        preview = (last.get("body") or "").strip().replace("\n", " ")
        row["last_admin_preview"] = preview[:120]
    return row


@clinic_router.get("/support/tickets/summary")
async def user_support_tickets_summary(x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    tickets, err = list_support_tickets_for_user(vet_id, limit=50)
    if err:
        raise HTTPException(status_code=500, detail=err)
    enriched = [_enrich_ticket_summary(t) for t in tickets]
    open_count = sum(
        1
        for t in enriched
        if (t.get("status") or "").lower() in ("open", "in_progress")
    )
    return {"tickets": enriched, "count": len(enriched), "open_count": open_count}


@clinic_router.get("/support/tickets/{ticket_id}")
async def get_user_support_ticket(ticket_id: str, x_veterinarian_id: str = Header(None)):
    vet_id = _require_vet_id(x_veterinarian_id)
    ticket = await _load_ticket_for_user(ticket_id, vet_id)
    messages, err = list_support_messages(ticket_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"ticket": _serialize_ticket(ticket, messages)}


@clinic_router.post("/support/tickets/{ticket_id}/messages")
async def add_user_support_message(
    ticket_id: str,
    body: SupportMessageCreate,
    x_veterinarian_id: str = Header(None),
):
    vet_id = _require_vet_id(x_veterinarian_id)
    ticket = await _load_ticket_for_user(ticket_id, vet_id)
    if (ticket.get("status") or "").lower() in ("closed",):
        raise HTTPException(status_code=400, detail="Este ticket está cerrado")

    text = (body.body or "").strip()
    if len(text) < 2:
        raise HTTPException(status_code=400, detail="Mensaje vacío")

    msg, err = insert_support_message(
        {
            "ticket_id": ticket_id,
            "author_role": "user",
            "author_profile_id": vet_id,
            "body": text[:4000],
        }
    )
    if err or not msg:
        raise HTTPException(status_code=500, detail=err or "Error al guardar mensaje")

    update_support_ticket(ticket_id, {})
    await _email_background(email_notifications.notify_admins_user_message, ticket, text)
    return {"message": msg}


@clinic_router.get("/admin/support/tickets")
async def admin_list_support_tickets(
    status: str = "",
    x_veterinarian_id: str = Header(None),
):
    await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    tickets, err = list_support_tickets_admin(status=status.strip(), limit=200)
    if err:
        raise HTTPException(status_code=500, detail=err)
    all_open, open_err = list_support_tickets_admin(status="open", limit=500)
    open_count = len(all_open) if not open_err else sum(
        1 for t in tickets if (t.get("status") or "") == "open"
    )
    return {"tickets": tickets, "count": len(tickets), "open_count": open_count}


@clinic_router.get("/admin/support/tickets/{ticket_id}")
async def admin_get_support_ticket(ticket_id: str, x_veterinarian_id: str = Header(None)):
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    ticket, err = get_support_ticket(ticket_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    messages, msg_err = list_support_messages(ticket_id)
    if msg_err:
        raise HTTPException(status_code=500, detail=msg_err)
    auth_security.audit_admin_action(
        admin,
        "support_view_ticket",
        target_profile_id=ticket.get("user_id"),
        target_email=ticket.get("user_email"),
        metadata={"ticket_id": ticket_id},
    )
    return {"ticket": _serialize_ticket(ticket, messages)}


@clinic_router.patch("/admin/support/tickets/{ticket_id}")
async def admin_patch_support_ticket(
    ticket_id: str,
    body: AdminSupportTicketPatch,
    x_veterinarian_id: str = Header(None),
):
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    ticket, err = get_support_ticket(ticket_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    fields = body.model_dump(exclude_none=True)
    if "status" in fields:
        status = fields["status"].lower().strip()
        if status not in ("open", "in_progress", "resolved", "closed"):
            raise HTTPException(status_code=400, detail="Estado inválido")
        fields["status"] = status
        if status in ("resolved", "closed"):
            fields["resolved_at"] = datetime.now(timezone.utc).isoformat()
    if "priority" in fields and fields["priority"] not in ("normal", "high"):
        raise HTTPException(status_code=400, detail="Prioridad inválida")

    updated, upd_err = update_support_ticket(ticket_id, fields)
    if upd_err:
        raise HTTPException(status_code=500, detail=upd_err)

    if fields.get("status") in ("resolved", "closed"):
        merged = {**ticket, **(updated or {}), **fields}
        await _email_background(email_notifications.notify_user_ticket_resolved, merged)

    auth_security.audit_admin_action(
        admin,
        "support_update_ticket",
        target_profile_id=ticket.get("user_id"),
        target_email=ticket.get("user_email"),
        metadata={"ticket_id": ticket_id, **fields},
    )
    return {"ticket": updated}


@clinic_router.post("/admin/support/tickets/{ticket_id}/reply")
async def admin_reply_support_ticket(
    ticket_id: str,
    body: AdminSupportReply,
    x_veterinarian_id: str = Header(None),
):
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    ticket, err = get_support_ticket(ticket_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    text = (body.body or "").strip()
    if len(text) < 2:
        raise HTTPException(status_code=400, detail="Respuesta vacía")

    msg, msg_err = insert_support_message(
        {
            "ticket_id": ticket_id,
            "author_role": "admin",
            "author_profile_id": admin.get("id"),
            "body": text[:4000],
        }
    )
    if msg_err or not msg:
        raise HTTPException(status_code=500, detail=msg_err or "Error al guardar respuesta")

    patch_fields: dict = {}
    if body.status:
        status = body.status.lower().strip()
        if status in ("open", "in_progress", "resolved", "closed"):
            patch_fields["status"] = status
            if status in ("resolved", "closed"):
                patch_fields["resolved_at"] = datetime.now(timezone.utc).isoformat()
    elif (ticket.get("status") or "") == "open":
        patch_fields["status"] = "in_progress"

    if patch_fields:
        update_support_ticket(ticket_id, patch_fields)

    await _email_background(
        email_notifications.notify_user_ticket_reply,
        ticket,
        text,
        admin.get("nombre") or admin.get("email") or "",
    )
    if patch_fields.get("status") in ("resolved", "closed"):
        merged = {**ticket, **patch_fields}
        await _email_background(email_notifications.notify_user_ticket_resolved, merged)

    auth_security.audit_admin_action(
        admin,
        "support_reply_ticket",
        target_profile_id=ticket.get("user_id"),
        target_email=ticket.get("user_email"),
        metadata={"ticket_id": ticket_id},
    )
    return {"message": msg}


@clinic_router.post("/admin/delete-user")
async def admin_delete_user(body: AdminDeleteUserBody, x_veterinarian_id: str = Header(None)):
    admin = await _require_platform_admin(_require_vet_id(x_veterinarian_id))
    from supabase_client import delete_profile_by_email

    target_email = body.email.strip()
    success, error = delete_profile_by_email(target_email)
    if not success:
        raise HTTPException(status_code=400, detail=error or "No se pudo eliminar el usuario")
    auth_security.audit_admin_action(
        admin,
        "delete_user",
        target_email=target_email,
    )
    return {"message": f"Usuario {body.email} eliminado correctamente"}
