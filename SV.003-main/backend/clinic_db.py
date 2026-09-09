"""
CRUD Supabase para módulo clínico (Fase 1 PMS).
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from supabase_client import get_supabase_client

INVITE_ROLES = frozenset({"admin", "veterinarian", "receptionist"})
STAFF_INVITE_ROLES = frozenset({"admin", "receptionist"})
INVITE_TTL_DAYS = 14


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash_invite_token(raw_token: str) -> str:
    return hashlib.sha256((raw_token or "").encode("utf-8")).hexdigest()


def new_invite_token() -> Tuple[str, str]:
    """Returns (raw_token, token_hash)."""
    raw = secrets.token_urlsafe(32)
    return raw, _hash_invite_token(raw)


def _table(name: str):
    return get_supabase_client().table(name)


def _nullify_empty_optional_fields(row: Dict[str, Any]) -> Dict[str, Any]:
    """PostgreSQL rechaza '' en columnas date; normalizar a None."""
    out = dict(row)
    for key in ("birth_date",):
        if out.get(key) == "":
            out[key] = None
    return out


def get_member_by_profile(profile_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("organization_members")
            .select("*, organizations(*)")
            .eq("profile_id", profile_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def get_organization_owner_profile_id(organization_id: str) -> Tuple[Optional[str], Optional[str]]:
    try:
        resp = (
            _table("organization_members")
            .select("profile_id")
            .eq("organization_id", organization_id)
            .eq("role", "owner")
            .limit(1)
            .execute()
        )
        if not resp.data:
            return (None, None)
        return (resp.data[0].get("profile_id"), None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def apply_team_membership_overlay(profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Si el perfil es miembro (no owner) de un consultorio, expone la membresía y
    el cupo CDS del dueño (pool compartido del plan del consultorio).
    """
    if not profile or not profile.get("id"):
        return profile or {}
    out = dict(profile)
    member, _ = get_member_by_profile(profile["id"])
    if not member:
        return out
    role = (member.get("role") or "").strip().lower()
    if role in ("", "owner"):
        return out
    org_id = member.get("organization_id")
    if not org_id:
        return out
    owner_id, _ = get_organization_owner_profile_id(org_id)
    if not owner_id or owner_id == profile["id"]:
        return out
    try:
        from supabase_client import get_profile

        owner, err = get_profile(owner_id)
    except Exception:  # noqa: BLE001
        return out
    if err or not owner:
        return out
    out["membership_type"] = owner.get("membership_type")
    out["consultations_remaining"] = owner.get("consultations_remaining")
    out["membership_expires"] = owner.get("membership_expires")
    out["unlimited_consultations"] = owner.get("unlimited_consultations")
    out["membership_source"] = "organization"
    out["membership_owner_id"] = owner_id
    out["membership_owner_nombre"] = owner.get("nombre")
    return out


def resolve_consultation_billing_profile_id(profile: Dict[str, Any]) -> str:
    """A quién descontar el cupo CDS (siempre el dueño si es miembro del equipo)."""
    member, _ = get_member_by_profile(str(profile.get("id") or ""))
    if member:
        role = (member.get("role") or "").strip().lower()
        if role and role != "owner":
            owner_id, _ = get_organization_owner_profile_id(member.get("organization_id") or "")
            if owner_id:
                return str(owner_id)
    overlay = apply_team_membership_overlay(profile)
    bill_to = overlay.get("membership_owner_id")
    if overlay.get("membership_source") == "organization" and bill_to:
        return str(bill_to)
    return str(profile.get("id") or "")


def build_admin_team_index(
    profiles: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Dict[str, Any]]:
    """
    Mapa profile_id -> resumen de equipo para Admin GUIAA.
    Marca consultorios con 2+ miembros como team_shared (cuentas compartidas).
    """
    try:
        resp = (
            _table("organization_members")
            .select("profile_id, role, organization_id, organizations(id, name)")
            .execute()
        )
        rows = resp.data or []
    except Exception as exc:  # noqa: BLE001
        print(f"[WARN] build_admin_team_index: {exc}")
        return {}

    by_org: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        org_id = row.get("organization_id")
        if not org_id:
            continue
        by_org.setdefault(str(org_id), []).append(row)

    profile_by_id: Dict[str, Dict[str, Any]] = {}
    for profile in profiles or []:
        pid = str(profile.get("id") or "")
        if pid:
            profile_by_id[pid] = profile

    missing_owner_ids = []
    org_meta: Dict[str, Dict[str, Any]] = {}
    for org_id, members in by_org.items():
        owner_row = next(
            (m for m in members if (m.get("role") or "").strip().lower() == "owner"),
            None,
        )
        owner_id = str((owner_row or {}).get("profile_id") or "") or None
        org_name = ""
        if owner_row and isinstance(owner_row.get("organizations"), dict):
            org_name = owner_row["organizations"].get("name") or ""
        elif members and isinstance(members[0].get("organizations"), dict):
            org_name = members[0]["organizations"].get("name") or ""
        if owner_id and owner_id not in profile_by_id:
            missing_owner_ids.append(owner_id)
        org_meta[org_id] = {
            "organization_id": org_id,
            "organization_name": org_name,
            "member_count": len(members),
            "team_shared": len(members) > 1,
            "owner_profile_id": owner_id,
        }

    if missing_owner_ids:
        try:
            from supabase_client import get_supabase_client

            client = get_supabase_client()
            # Supabase .in_ batches
            uniq = list(dict.fromkeys(missing_owner_ids))
            for i in range(0, len(uniq), 100):
                chunk = uniq[i : i + 100]
                resp = (
                    client.table("profiles")
                    .select("id, nombre, email, membership_type, consultations_remaining, membership_expires")
                    .in_("id", chunk)
                    .execute()
                )
                for row in resp.data or []:
                    profile_by_id[str(row["id"])] = row
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] admin team owner profiles: {exc}")

    index: Dict[str, Dict[str, Any]] = {}
    for org_id, members in by_org.items():
        meta = org_meta[org_id]
        owner_id = meta.get("owner_profile_id")
        owner = profile_by_id.get(owner_id or "") or {}
        for member in members:
            pid = str(member.get("profile_id") or "")
            if not pid:
                continue
            role = (member.get("role") or "").strip().lower() or "veterinarian"
            entry: Dict[str, Any] = {
                "organization_id": org_id,
                "organization_name": meta.get("organization_name") or "",
                "org_role": role,
                "team_member_count": meta.get("member_count") or 1,
                "team_shared": bool(meta.get("team_shared")),
                "membership_source": "organization" if role != "owner" and meta.get("team_shared") else None,
            }
            if role != "owner" and owner_id:
                entry["membership_source"] = "organization"
                entry["membership_owner_id"] = owner_id
                entry["membership_owner_nombre"] = owner.get("nombre") or ""
                entry["membership_owner_email"] = owner.get("email") or ""
                # Plan/cupo efectivo del dueño (pool compartido)
                entry["effective_membership_type"] = owner.get("membership_type")
                entry["effective_consultations_remaining"] = owner.get("consultations_remaining")
            index[pid] = entry
    return index


def list_members(organization_id: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("organization_members")
            .select("id, profile_id, role, branch_id, created_at")
            .eq("organization_id", organization_id)
            .execute()
        )
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def list_members_enriched(organization_id: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    members, err = list_members(organization_id)
    if err:
        return ([], err)
    profile_ids = [m["profile_id"] for m in members if m.get("profile_id")]
    if not profile_ids:
        return (members, None)
    try:
        resp = (
            _table("profiles")
            .select("id, nombre, email")
            .in_("id", profile_ids)
            .execute()
        )
        by_id = {p["id"]: p for p in (resp.data or [])}
        for member in members:
            profile = by_id.get(member.get("profile_id"))
            if profile:
                member["nombre"] = profile.get("nombre")
                member["email"] = profile.get("email")
        return (members, None)
    except Exception as exc:  # noqa: BLE001
        return (members, str(exc))


_ADD_MEMBER_MESSAGES = {
    "already_here": "Este usuario ya está en tu equipo. No hace falta agregarlo de nuevo.",
    "conflict_team": (
        "Esa cuenta ya pertenece a otro consultorio con más de un integrante. "
        "Debe salir de su organización actual (o usar otro email) antes de unirse a la tuya."
    ),
    "conflict_data": (
        "No se pudo mover esa cuenta a tu consultorio. Pide que use otro email o contacta a soporte."
    ),
}

_CLINIC_ACTIVITY_TABLES = (
    "clients",
    "patients",
    "appointments",
    "consultations",
    "products",
    "stock_movements",
    "clinical_invoices",
    "appointment_requests",
)


def resolve_add_member_action(
    existing: Optional[Dict[str, Any]],
    dest_organization_id: str,
    source_member_count: int = 0,
    source_has_clinical_data: bool = False,
) -> str:
    """already_here | insert | reassign | conflict_team | conflict_data"""
    del source_has_clinical_data  # solo-owner orgs are moved, with or without clinical rows
    if not existing:
        return "insert"
    if existing.get("organization_id") == dest_organization_id:
        return "already_here"
    if source_member_count == 1:
        return "reassign"
    if source_member_count > 1:
        return "conflict_team"
    return "conflict_data"


def organization_has_clinical_data(organization_id: str) -> Tuple[bool, Optional[str]]:
    try:
        for table in _CLINIC_ACTIVITY_TABLES:
            resp = (
                _table(table)
                .select("id")
                .eq("organization_id", organization_id)
                .limit(1)
                .execute()
            )
            if resp.data:
                return (True, None)
        return (False, None)
    except Exception as exc:  # noqa: BLE001
        return (True, str(exc))


def _primary_branch_id(organization_id: str) -> Optional[str]:
    try:
        resp = (
            _table("branches")
            .select("id")
            .eq("organization_id", organization_id)
            .eq("is_primary", True)
            .limit(1)
            .execute()
        )
        if resp.data:
            return resp.data[0].get("id")
        resp = (
            _table("branches")
            .select("id")
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        return resp.data[0].get("id") if resp.data else None
    except Exception:  # noqa: BLE001
        return None


def _move_clinical_data(
    source_org_id: str,
    dest_org_id: str,
    dest_branch_id: Optional[str],
) -> Optional[str]:
    try:
        source_branches = (
            _table("branches")
            .select("id")
            .eq("organization_id", source_org_id)
            .execute()
        )
        source_branch_ids = [row.get("id") for row in (source_branches.data or []) if row.get("id")]
        for table in _CLINIC_ACTIVITY_TABLES:
            _table(table).update({"organization_id": dest_org_id}).eq(
                "organization_id", source_org_id
            ).execute()
        if dest_branch_id and source_branch_ids:
            _table("appointments").update({"branch_id": dest_branch_id}).in_(
                "branch_id", source_branch_ids
            ).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def _reassign_member_to_organization(
    existing: Dict[str, Any],
    dest_organization_id: str,
    role: str,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    source_org_id = existing.get("organization_id")
    branch_id = _primary_branch_id(dest_organization_id)
    if source_org_id:
        move_err = _move_clinical_data(source_org_id, dest_organization_id, branch_id)
        if move_err:
            return (None, move_err)
    try:
        resp = (
            _table("organization_members")
            .update(
                {
                    "organization_id": dest_organization_id,
                    "role": role,
                    "branch_id": branch_id,
                }
            )
            .eq("id", existing["id"])
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))

    if source_org_id:
        try:
            _table("organizations").delete().eq("id", source_org_id).execute()
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] No se pudo borrar consultorio vacío {source_org_id}: {exc}")

    return (resp.data[0] if resp.data else {**existing, "organization_id": dest_organization_id, "role": role}, None)


def _clear_personal_membership_for_team_member(profile_id: str) -> None:
    """El cupo CDS vive en el dueño; el miembro no debe tener plan/cupo paralelo."""
    try:
        from datetime import datetime, timezone

        from supabase_client import update_profile

        update_profile(
            profile_id,
            {
                "membership_type": None,
                "consultations_remaining": 0,
                "membership_expires": None,
                # Evita bloqueo por encuesta trial al unirse a un consultorio con plan.
                "trial_survey_completed_at": datetime.now(timezone.utc).isoformat(),
            },
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[WARN] No se pudo limpiar membresía personal de {profile_id}: {exc}")


def add_organization_member(
    organization_id: str,
    profile_id: str,
    role: str,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    allowed_roles = {"admin", "veterinarian", "receptionist"}
    if role not in allowed_roles:
        return (None, "Rol no válido")

    existing, err = get_member_by_profile(profile_id)
    if err:
        return (None, err)

    source_member_count = 0
    if existing and existing.get("organization_id") != organization_id:
        source_org_id = existing.get("organization_id")
        peers, peers_err = list_members(source_org_id)
        if peers_err:
            return (None, _ADD_MEMBER_MESSAGES["conflict_team"])
        source_member_count = len(peers or [])

    action = resolve_add_member_action(
        existing,
        organization_id,
        source_member_count,
    )
    if action == "already_here":
        return (None, _ADD_MEMBER_MESSAGES[action])
    if action in {"conflict_team", "conflict_data"}:
        return (None, _ADD_MEMBER_MESSAGES[action])
    if action == "reassign":
        member, re_err = _reassign_member_to_organization(existing, organization_id, role)
        if not re_err and member:
            _clear_personal_membership_for_team_member(profile_id)
        return (member, re_err)

    try:
        resp = (
            _table("organization_members")
            .insert(
                {
                    "organization_id": organization_id,
                    "profile_id": profile_id,
                    "role": role,
                    "branch_id": _primary_branch_id(organization_id),
                },
                returning="representation",
            )
            .execute()
        )
        member = resp.data[0] if resp.data else None
        if member:
            _clear_personal_membership_for_team_member(profile_id)
        return (member, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def remove_organization_member(
    organization_id: str,
    member_id: str,
) -> Tuple[bool, Optional[str]]:
    try:
        resp = (
            _table("organization_members")
            .select("id, role, organization_id")
            .eq("id", member_id)
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        if not resp.data:
            return (False, "Miembro no encontrado")
        member = resp.data[0]
        if member.get("role") == "owner":
            return (False, "No se puede eliminar al propietario del consultorio")
        _table("organization_members").delete().eq("id", member_id).execute()
        return (True, None)
    except Exception as exc:  # noqa: BLE001
        return (False, str(exc))


def create_organization_with_owner(
    profile_id: str, org_name: str
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        org_resp = (
            client.table("organizations")
            .insert({"name": org_name}, returning="representation")
            .execute()
        )
        org = org_resp.data[0] if org_resp.data else None
        if not org:
            return (None, "No se pudo crear la organización")

        org_id = org["id"]
        branch_resp = (
            client.table("branches")
            .insert(
                {
                    "organization_id": org_id,
                    "name": "Sede principal",
                    "is_primary": True,
                },
                returning="representation",
            )
            .execute()
        )
        branch = branch_resp.data[0] if branch_resp.data else None

        member_resp = (
            client.table("organization_members")
            .insert(
                {
                    "organization_id": org_id,
                    "profile_id": profile_id,
                    "role": "owner",
                    "branch_id": branch["id"] if branch else None,
                },
                returning="representation",
            )
            .execute()
        )
        member = member_resp.data[0] if member_resp.data else None
        return (
            {"organization": org, "branch": branch, "membership": member},
            None,
        )
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def update_organization(org_id: str, fields: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    fields = {**fields, "updated_at": _now_iso()}
    try:
        resp = _table("organizations").update(fields).eq("id", org_id).execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def ensure_organization_for_profile(
    profile_id: str, default_name: str = "Mi consultorio"
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    member, err = get_member_by_profile(profile_id)
    if err:
        return (None, err)
    if member:
        org = member.get("organizations") or {}
        return (
            {
                "organization": org,
                "membership": {
                    "id": member.get("id"),
                    "role": member.get("role"),
                    "organization_id": member.get("organization_id"),
                    "branch_id": member.get("branch_id"),
                },
            },
            None,
        )
    # Cuentas de equipo (sin cédula) no deben crear consultorio propio.
    try:
        pref = (
            _table("profiles")
            .select("cedula_profesional")
            .eq("id", profile_id)
            .limit(1)
            .execute()
        )
        cedula = ((pref.data or [{}])[0].get("cedula_profesional") or "").strip()
        if not cedula:
            return (
                None,
                "Esta cuenta de equipo no tiene consultorio. Pide una nueva invitación al propietario.",
            )
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))

    result, err = create_organization_with_owner(profile_id, default_name)
    if err:
        return (None, err)
    return (
        {
            "organization": result.get("organization"),
            "membership": result.get("membership"),
        },
        None,
    )


def _invite_public_row(row: Dict[str, Any], org_name: str = "") -> Dict[str, Any]:
    role = row.get("role") or "veterinarian"
    return {
        "id": row.get("id"),
        "email": (row.get("email") or "").strip().lower(),
        "role": role,
        "status": row.get("status"),
        "expires_at": row.get("expires_at"),
        "organization_id": row.get("organization_id"),
        "organization_name": org_name or "",
        "requires_license": role not in STAFF_INVITE_ROLES,
        "created_at": row.get("created_at"),
    }


def list_organization_invites(
    organization_id: str,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("organization_invites")
            .select("*")
            .eq("organization_id", organization_id)
            .eq("status", "pending")
            .order("created_at", desc=True)
            .execute()
        )
        now = datetime.now(timezone.utc)
        rows: List[Dict[str, Any]] = []
        for row in resp.data or []:
            expires = row.get("expires_at")
            if expires:
                try:
                    exp_dt = datetime.fromisoformat(str(expires).replace("Z", "+00:00"))
                    if exp_dt < now:
                        _table("organization_invites").update({"status": "expired"}).eq(
                            "id", row["id"]
                        ).execute()
                        continue
                except ValueError:
                    pass
            rows.append(_invite_public_row(row))
        return (rows, None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def revoke_organization_invite(
    organization_id: str, invite_id: str
) -> Tuple[bool, Optional[str]]:
    try:
        resp = (
            _table("organization_invites")
            .update({"status": "revoked"})
            .eq("id", invite_id)
            .eq("organization_id", organization_id)
            .eq("status", "pending")
            .execute()
        )
        if not resp.data:
            return (False, "Invitación no encontrada o ya no está pendiente")
        return (True, None)
    except Exception as exc:  # noqa: BLE001
        return (False, str(exc))


def create_organization_invite(
    organization_id: str,
    email: str,
    role: str,
    invited_by: Optional[str] = None,
) -> Tuple[Optional[Dict[str, Any]], Optional[str], Optional[str]]:
    """
    Returns (invite_public_with_raw_token_fields, error, raw_token).
    raw_token is only available at creation time.
    """
    email_norm = (email or "").strip().lower()
    if not email_norm or "@" not in email_norm:
        return (None, "Email inválido", None)
    if role not in INVITE_ROLES:
        return (None, "Rol no válido para invitación", None)

    raw_token, token_hash = new_invite_token()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=INVITE_TTL_DAYS)).isoformat()

    try:
        # Revocar pendientes previas del mismo email en esta org
        _table("organization_invites").update({"status": "revoked"}).eq(
            "organization_id", organization_id
        ).eq("email", email_norm).eq("status", "pending").execute()

        resp = (
            _table("organization_invites")
            .insert(
                {
                    "organization_id": organization_id,
                    "email": email_norm,
                    "role": role,
                    "token_hash": token_hash,
                    "invited_by": invited_by,
                    "status": "pending",
                    "expires_at": expires_at,
                },
                returning="representation",
            )
            .execute()
        )
        row = resp.data[0] if resp.data else None
        if not row:
            return (None, "No se pudo crear la invitación", None)
        public = _invite_public_row(row)
        return (public, None, raw_token)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc), None)


def get_invite_by_raw_token(
    raw_token: str,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    token = (raw_token or "").strip()
    if len(token) < 16:
        return (None, "Invitación no válida")
    token_hash = _hash_invite_token(token)
    try:
        resp = (
            _table("organization_invites")
            .select("*, organizations(id, name)")
            .eq("token_hash", token_hash)
            .limit(1)
            .execute()
        )
        row = resp.data[0] if resp.data else None
        if not row:
            return (None, "Invitación no encontrada")
        if row.get("status") != "pending":
            return (None, "Esta invitación ya no está disponible")
        expires = row.get("expires_at")
        if expires:
            try:
                exp_dt = datetime.fromisoformat(str(expires).replace("Z", "+00:00"))
                if exp_dt < datetime.now(timezone.utc):
                    _table("organization_invites").update({"status": "expired"}).eq(
                        "id", row["id"]
                    ).execute()
                    return (None, "Esta invitación expiró. Pide una nueva al consultorio.")
            except ValueError:
                pass
        org = row.get("organizations") or {}
        public = _invite_public_row(row, org_name=org.get("name") or "")
        public["_raw"] = row
        return (public, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def mark_invite_accepted(invite_id: str, profile_id: str) -> Optional[str]:
    try:
        _table("organization_invites").update(
            {
                "status": "accepted",
                "accepted_at": _now_iso(),
                "accepted_profile_id": profile_id,
            }
        ).eq("id", invite_id).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def insert_organization_member_direct(
    organization_id: str,
    profile_id: str,
    role: str,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    if role not in INVITE_ROLES and role != "owner":
        return (None, "Rol no válido")
    try:
        resp = (
            _table("organization_members")
            .insert(
                {
                    "organization_id": organization_id,
                    "profile_id": profile_id,
                    "role": role,
                    "branch_id": _primary_branch_id(organization_id),
                },
                returning="representation",
            )
            .execute()
        )
        member = resp.data[0] if resp.data else None
        if member and role != "owner":
            _clear_personal_membership_for_team_member(profile_id)
        return (member, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def list_clients(
    organization_id: str, search: str = "", limit: int = 100
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        q = _table("clients").select("*").eq("organization_id", organization_id)
        if search.strip():
            term = search.strip()
            q = q.or_(f"name.ilike.%{term}%,email.ilike.%{term}%,phone.ilike.%{term}%")
        resp = q.order("name").limit(limit).execute()
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def get_client(client_id: str, organization_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("clients")
            .select("*")
            .eq("id", client_id)
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def insert_client(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = _table("clients").insert(row, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def update_client(
    client_id: str, organization_id: str, fields: Dict[str, Any]
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    fields = {**fields, "updated_at": _now_iso()}
    try:
        resp = (
            _table("clients")
            .update(fields)
            .eq("id", client_id)
            .eq("organization_id", organization_id)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def delete_client(client_id: str, organization_id: str) -> Optional[str]:
    try:
        _table("clients").delete().eq("id", client_id).eq("organization_id", organization_id).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def list_patients(
    organization_id: str,
    search: str = "",
    client_id: Optional[str] = None,
    limit: int = 100,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        q = _table("patients").select("*, clients(id, name, phone, email)").eq(
            "organization_id", organization_id
        )
        if client_id:
            q = q.eq("client_id", client_id)
        if search.strip():
            term = search.strip()
            q = q.or_(f"name.ilike.%{term}%,species.ilike.%{term}%,breed.ilike.%{term}%")
        resp = q.order("name").limit(limit).execute()
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def get_patient(patient_id: str, organization_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("patients")
            .select("*, clients(id, name, phone, email, address)")
            .eq("id", patient_id)
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def insert_patient(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        payload = _nullify_empty_optional_fields(row)
        resp = _table("patients").insert(payload, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def update_patient(
    patient_id: str, organization_id: str, fields: Dict[str, Any]
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    fields = _nullify_empty_optional_fields({**fields, "updated_at": _now_iso()})
    try:
        resp = (
            _table("patients")
            .update(fields)
            .eq("id", patient_id)
            .eq("organization_id", organization_id)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def delete_patient(patient_id: str, organization_id: str) -> Optional[str]:
    try:
        _table("patients").delete().eq("id", patient_id).eq("organization_id", organization_id).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def list_appointments_calendar(
    organization_id: str,
    from_iso: str,
    to_iso: str,
    veterinarian_id: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        q = (
            _table("appointments")
            .select("*, patients(id, name, species), clients(id, name, phone)")
            .eq("organization_id", organization_id)
            .gte("starts_at", from_iso)
            .lte("starts_at", to_iso)
        )
        if veterinarian_id:
            q = q.eq("veterinarian_id", veterinarian_id)
        resp = q.order("starts_at").execute()
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def get_appointment(appointment_id: str, organization_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("appointments")
            .select("*, patients(*), clients(*)")
            .eq("id", appointment_id)
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def insert_appointment(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = _table("appointments").insert(row, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def update_appointment(
    appointment_id: str, organization_id: str, fields: Dict[str, Any]
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    fields = {**fields, "updated_at": _now_iso()}
    try:
        resp = (
            _table("appointments")
            .update(fields)
            .eq("id", appointment_id)
            .eq("organization_id", organization_id)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def delete_appointment(appointment_id: str, organization_id: str) -> Optional[str]:
    try:
        _table("appointments").delete().eq("id", appointment_id).eq("organization_id", organization_id).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def list_consultations_for_patient(
    patient_id: str, limit: int = 50
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("consultations")
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def list_medical_images_for_patient(
    patient_id: str, patient_name: Optional[str] = None, limit: int = 30
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("medical_images")
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        rows = resp.data or []
        if not rows and patient_name:
            resp2 = (
                _table("medical_images")
                .select("*")
                .ilike("patient_name", patient_name.strip())
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            rows = resp2.data or []
        return (rows, None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if "patient_id" in err.lower() or "PGRST204" in err:
            if not patient_name:
                return ([], None)
            try:
                resp = (
                    _table("medical_images")
                    .select("*")
                    .ilike("patient_name", patient_name.strip())
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                return (resp.data or [], None)
            except Exception as exc2:  # noqa: BLE001
                return ([], str(exc2))
        return ([], err)


def get_organization(organization_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("organizations")
            .select("id, name, timezone")
            .eq("id", organization_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def _appointment_requests_unavailable(err: str) -> bool:
    lowered = err.lower()
    return (
        "appointment_requests" in lowered
        and (
            "does not exist" in lowered
            or "could not find the table" in lowered
            or "pgrst205" in lowered
            or "schema cache" in lowered
        )
    )


def get_appointment_request(
    request_id: str, organization_id: str
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("appointment_requests")
            .select("*")
            .eq("id", request_id)
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _appointment_requests_unavailable(err):
            return (None, None)
        return (None, err)


def list_appointment_requests(
    organization_id: str, status: Optional[str] = None, limit: int = 50
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        q = (
            _table("appointment_requests")
            .select("*")
            .eq("organization_id", organization_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        if status:
            q = q.eq("status", status)
        resp = q.execute()
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _appointment_requests_unavailable(err):
            return ([], None)
        return ([], err)


def insert_appointment_request(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = _table("appointment_requests").insert(row, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def update_appointment_request(
    request_id: str, organization_id: str, fields: Dict[str, Any]
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    fields = {**fields, "updated_at": _now_iso()}
    try:
        resp = (
            _table("appointment_requests")
            .update(fields)
            .eq("id", request_id)
            .eq("organization_id", organization_id)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def _guia_consultas_leads_unavailable(err: str) -> bool:
    return _table_unavailable(err, "guia_consultas_leads")


def insert_guia_consultas_lead(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = _table("guia_consultas_leads").insert(row, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def list_guia_consultas_leads(
    status: str = "", limit: int = 200
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        query = _table("guia_consultas_leads").select("*").order("created_at", desc=True).limit(limit)
        if status:
            query = query.eq("status", status)
        resp = query.execute()
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _guia_consultas_leads_unavailable(err):
            return ([], None)
        return ([], err)


def update_guia_consultas_lead(
    lead_id: str, fields: Dict[str, Any]
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    fields = {**fields, "updated_at": _now_iso()}
    try:
        resp = (
            _table("guia_consultas_leads")
            .update(fields)
            .eq("id", lead_id)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def get_guia_consultas_lead(lead_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = _table("guia_consultas_leads").select("*").eq("id", lead_id).limit(1).execute()
        rows = resp.data or []
        return (rows[0] if rows else None, None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _guia_consultas_leads_unavailable(err):
            return (None, None)
        return (None, err)


def _table_unavailable(err: str, table_name: str) -> bool:
    lowered = err.lower()
    name = table_name.lower()
    return name in lowered and (
        "does not exist" in lowered
        or "could not find the table" in lowered
        or "pgrst205" in lowered
        or "schema cache" in lowered
    )


def list_products(
    organization_id: str, search: str = "", limit: int = 200
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        q = _table("products").select("*").eq("organization_id", organization_id)
        if search.strip():
            term = search.strip()
            q = q.or_(f"name.ilike.%{term}%,sku.ilike.%{term}%,category.ilike.%{term}%")
        resp = q.order("name").limit(limit).execute()
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _table_unavailable(err, "products"):
            return ([], None)
        return ([], err)


def get_product(product_id: str, organization_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("products")
            .select("*")
            .eq("id", product_id)
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _table_unavailable(err, "products"):
            return (None, None)
        return (None, err)


def insert_product(row: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = _table("products").insert(row, returning="representation").execute()
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def update_product(
    product_id: str, organization_id: str, fields: Dict[str, Any]
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    fields = {**fields, "updated_at": _now_iso()}
    try:
        resp = (
            _table("products")
            .update(fields)
            .eq("id", product_id)
            .eq("organization_id", organization_id)
            .execute()
        )
        return (resp.data[0] if resp.data else None, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def delete_product(product_id: str, organization_id: str) -> Optional[str]:
    try:
        _table("products").delete().eq("id", product_id).eq("organization_id", organization_id).execute()
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc)


def list_low_stock_products(organization_id: str, limit: int = 20) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    products, err = list_products(organization_id, limit=500)
    if err:
        return ([], err)
    low = [
        p
        for p in products
        if p.get("is_active", True)
        and float(p.get("stock_qty") or 0) <= float(p.get("min_stock") or 0)
    ]
    return (low[:limit], None)


def insert_stock_movement(
    organization_id: str,
    product_id: str,
    movement_type: str,
    quantity: float,
    reason: Optional[str],
    created_by: Optional[str],
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    product, err = get_product(product_id, organization_id)
    if err:
        return (None, err)
    if not product:
        return (None, "Producto no encontrado")

    current = float(product.get("stock_qty") or 0)
    qty = float(quantity)
    if movement_type == "in":
        new_stock = current + qty
    elif movement_type == "out":
        new_stock = current - qty
        if new_stock < 0:
            return (None, "Stock insuficiente")
    elif movement_type == "adjustment":
        new_stock = qty
    else:
        return (None, "Tipo de movimiento inválido")

    row = {
        "organization_id": organization_id,
        "product_id": product_id,
        "movement_type": movement_type,
        "quantity": qty,
        "reason": reason,
        "created_by": created_by,
    }
    try:
        resp = _table("stock_movements").insert(row, returning="representation").execute()
        movement = resp.data[0] if resp.data else None
        _, up_err = update_product(product_id, organization_id, {"stock_qty": new_stock})
        if up_err:
            return (movement, up_err)
        return (movement, None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _table_unavailable(err, "stock_movements"):
            return (None, "Módulo de inventario no configurado")
        return (None, err)


def list_stock_movements(
    organization_id: str,
    product_id: Optional[str] = None,
    limit: int = 50,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        q = (
            _table("stock_movements")
            .select("*")
            .eq("organization_id", organization_id)
        )
        if product_id:
            q = q.eq("product_id", product_id)
        resp = q.order("created_at", desc=True).limit(limit).execute()
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _table_unavailable(err, "stock_movements"):
            return ([], None)
        return ([], err)


def list_invoices(
    organization_id: str, status: Optional[str] = None, limit: int = 100
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        q = (
            _table("clinical_invoices")
            .select("*, clients(id, name), patients(id, name)")
            .eq("organization_id", organization_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        if status:
            q = q.eq("status", status)
        resp = q.execute()
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _table_unavailable(err, "clinical_invoices"):
            return ([], None)
        return ([], err)


def get_invoice(invoice_id: str, organization_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("clinical_invoices")
            .select("*, clients(id, name), patients(id, name)")
            .eq("id", invoice_id)
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        invoice = resp.data[0] if resp.data else None
        if not invoice:
            return (None, None)
        items_resp = (
            _table("clinical_invoice_items")
            .select("*")
            .eq("invoice_id", invoice_id)
            .execute()
        )
        invoice["items"] = items_resp.data or []
        return (invoice, None)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _table_unavailable(err, "clinical_invoices"):
            return (None, None)
        return (None, err)


def _next_invoice_number(organization_id: str) -> str:
    prefix = datetime.now(timezone.utc).strftime("INV-%Y%m%d")
    try:
        resp = (
            _table("clinical_invoices")
            .select("invoice_number")
            .eq("organization_id", organization_id)
            .ilike("invoice_number", f"{prefix}%")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if resp.data:
            last = resp.data[0].get("invoice_number") or ""
            try:
                seq = int(last.split("-")[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        return f"{prefix}-{seq:04d}"
    except Exception:  # noqa: BLE001
        return f"{prefix}-0001"


def create_invoice_with_items(
    organization_id: str,
    header: Dict[str, Any],
    items: List[Dict[str, Any]],
    *,
    deduct_stock: bool = True,
    created_by: Optional[str] = None,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    if not items:
        return (None, "Se requiere al menos una línea")

    subtotal = 0.0
    normalized_items = []
    for item in items:
        qty = float(item.get("quantity") or 1)
        unit_price = float(item.get("unit_price") or 0)
        line_total = round(qty * unit_price, 2)
        subtotal += line_total
        normalized_items.append(
            {
                "product_id": item.get("product_id"),
                "description": item.get("description") or "Concepto",
                "quantity": qty,
                "unit_price": unit_price,
                "line_total": line_total,
            }
        )

    status = (header.get("status") or "issued").lower()
    should_deduct = deduct_stock and status not in ("draft", "cancelled")

    if should_deduct:
        for item in normalized_items:
            product_id = item.get("product_id")
            if not product_id:
                continue
            product, prod_err = get_product(product_id, organization_id)
            if prod_err:
                return (None, prod_err)
            if not product:
                return (None, f"Producto no encontrado: {item.get('description')}")
            available = float(product.get("stock_qty") or 0)
            if available < item["quantity"]:
                name = product.get("name") or item.get("description")
                return (
                    None,
                    f"Stock insuficiente para «{name}» (disponible: {available}, solicitado: {item['quantity']})",
                )

    tax_rate = float(header.get("tax_rate") or 0)
    tax_amount = round(subtotal * tax_rate / 100, 2)
    total = round(subtotal + tax_amount, 2)

    invoice_row = {
        **header,
        "organization_id": organization_id,
        "invoice_number": header.get("invoice_number") or _next_invoice_number(organization_id),
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total": total,
        "status": header.get("status") or "issued",
    }
    try:
        inv_resp = _table("clinical_invoices").insert(invoice_row, returning="representation").execute()
        invoice = inv_resp.data[0] if inv_resp.data else None
        if not invoice:
            return (None, "No se pudo crear la factura")
        invoice_id = invoice["id"]
        invoice_number = invoice.get("invoice_number") or invoice_id[:8]
        for item in normalized_items:
            item["invoice_id"] = invoice_id
        _table("clinical_invoice_items").insert(normalized_items).execute()

        if should_deduct:
            for item in normalized_items:
                product_id = item.get("product_id")
                if not product_id:
                    continue
                _, mov_err = insert_stock_movement(
                    organization_id,
                    product_id,
                    "out",
                    item["quantity"],
                    f"Venta recibo {invoice_number}",
                    created_by,
                )
                if mov_err:
                    print(f"[WARN] Recibo {invoice_number}: no se descontó stock ({mov_err})")

        full, err = get_invoice(invoice_id, organization_id)
        return (full, err)
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        if _table_unavailable(err, "clinical_invoices"):
            return (None, "Módulo de facturación no configurado")
        return (None, err)


def update_invoice(
    invoice_id: str, organization_id: str, fields: Dict[str, Any]
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    fields = {**fields, "updated_at": _now_iso()}
    if fields.get("status") == "paid" and not fields.get("paid_at"):
        fields["paid_at"] = _now_iso()
    try:
        resp = (
            _table("clinical_invoices")
            .update(fields)
            .eq("id", invoice_id)
            .eq("organization_id", organization_id)
            .execute()
        )
        updated = resp.data[0] if resp.data else None
        if not updated:
            return (None, None)
        full, err = get_invoice(invoice_id, organization_id)
        return (full or updated, err)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def _parse_day(iso_value: Optional[str]) -> Optional[str]:
    if not iso_value:
        return None
    return str(iso_value)[:10]


def _empty_day_series(from_day: str, to_day: str) -> Dict[str, int]:
    from datetime import date, timedelta

    start = date.fromisoformat(from_day)
    end = date.fromisoformat(to_day)
    series: Dict[str, int] = {}
    current = start
    while current <= end:
        series[current.isoformat()] = 0
        current += timedelta(days=1)
    return series


def _list_consultations_in_range(
    organization_id: str,
    from_iso: str,
    to_iso: str,
    member_profile_ids: Optional[List[str]] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("consultations")
            .select("id, created_at, status, organization_id, user_id")
            .eq("organization_id", organization_id)
            .gte("created_at", from_iso)
            .lte("created_at", to_iso)
            .order("created_at")
            .execute()
        )
        rows = resp.data or []
        if rows or not member_profile_ids:
            return (rows, None)

        seen: set[str] = set()
        merged: List[Dict[str, Any]] = []
        for profile_id in member_profile_ids:
            resp2 = (
                _table("consultations")
                .select("id, created_at, status, organization_id, user_id")
                .eq("user_id", profile_id)
                .gte("created_at", from_iso)
                .lte("created_at", to_iso)
                .order("created_at")
                .execute()
            )
            for row in resp2.data or []:
                row_id = row.get("id")
                if row_id and row_id not in seen:
                    seen.add(row_id)
                    merged.append(row)
        merged.sort(key=lambda r: r.get("created_at") or "")
        return (merged, None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def get_reports_overview(
    organization_id: str,
    from_iso: str,
    to_iso: str,
    member_profile_ids: Optional[List[str]] = None,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        clients_resp = (
            _table("clients")
            .select("id", count="exact")
            .eq("organization_id", organization_id)
            .execute()
        )
        patients_resp = (
            _table("patients")
            .select("id", count="exact")
            .eq("organization_id", organization_id)
            .execute()
        )
        clients_total = clients_resp.count or 0
        patients_total = patients_resp.count or 0

        appts, appt_err = list_appointments_calendar(organization_id, from_iso, to_iso)
        if appt_err:
            return (None, appt_err)

        invoices, inv_err = list_invoices(organization_id, limit=500)
        if inv_err and "no configurado" not in (inv_err or "").lower():
            return (None, inv_err)
        invoices = invoices or []

        consultations, cons_err = _list_consultations_in_range(
            organization_id, from_iso, to_iso, member_profile_ids
        )
        if cons_err:
            return (None, cons_err)

        low_stock, _ = list_low_stock_products(organization_id, limit=500)

        from_day = _parse_day(from_iso) or from_iso[:10]
        to_day = _parse_day(to_iso) or to_iso[:10]

        appt_by_status: Dict[str, int] = {}
        appt_daily = _empty_day_series(from_day, to_day)
        completed_appts = 0
        for appt in appts:
            status = appt.get("status") or "scheduled"
            appt_by_status[status] = appt_by_status.get(status, 0) + 1
            if status == "completed":
                completed_appts += 1
            day = _parse_day(appt.get("starts_at"))
            if day and day in appt_daily:
                appt_daily[day] += 1

        invoice_by_status: Dict[str, int] = {}
        revenue_paid = 0.0
        revenue_issued = 0.0
        revenue_daily = _empty_day_series(from_day, to_day)
        invoices_in_range = 0
        for inv in invoices:
            created = inv.get("created_at") or inv.get("paid_at")
            day = _parse_day(created)
            if not day or day < from_day or day > to_day:
                continue
            invoices_in_range += 1
            status = inv.get("status") or "draft"
            invoice_by_status[status] = invoice_by_status.get(status, 0) + 1
            total = float(inv.get("total") or 0)
            if status == "paid":
                revenue_paid += total
                revenue_daily[day] = revenue_daily.get(day, 0) + float(total)
            elif status == "issued":
                revenue_issued += total

        cons_daily = _empty_day_series(from_day, to_day)
        for cons in consultations:
            day = _parse_day(cons.get("created_at"))
            if day and day in cons_daily:
                cons_daily[day] += 1

        product_sales: Dict[str, Dict[str, Any]] = {}
        invoice_ids_in_range: List[str] = []
        for inv in invoices:
            created = inv.get("created_at") or inv.get("paid_at")
            day = _parse_day(created)
            if not day or day < from_day or day > to_day:
                continue
            if (inv.get("status") or "") not in ("paid", "issued"):
                continue
            invoice_ids_in_range.append(inv.get("id"))

        for inv_id in invoice_ids_in_range:
            if not inv_id:
                continue
            try:
                items_resp = (
                    _table("clinical_invoice_items")
                    .select("*")
                    .eq("invoice_id", inv_id)
                    .execute()
                )
                for item in items_resp.data or []:
                    key = item.get("product_id") or item.get("description") or "manual"
                    label = item.get("description") or "Concepto"
                    qty = float(item.get("quantity") or 0)
                    line_total = float(item.get("line_total") or 0)
                    if key not in product_sales:
                        product_sales[key] = {
                            "description": label,
                            "quantity": 0.0,
                            "revenue": 0.0,
                        }
                    product_sales[key]["quantity"] += qty
                    product_sales[key]["revenue"] += line_total
            except Exception:  # noqa: BLE001
                continue

        top_products = sorted(
            product_sales.values(),
            key=lambda p: p.get("revenue", 0),
            reverse=True,
        )[:10]

        movements, _ = list_stock_movements(organization_id, limit=500)
        stock_summary = {"in": 0.0, "out": 0.0, "adjustment": 0.0}
        for mov in movements or []:
            day = _parse_day(mov.get("created_at"))
            if not day or day < from_day or day > to_day:
                continue
            mtype = mov.get("movement_type") or ""
            qty = float(mov.get("quantity") or 0)
            if mtype in stock_summary:
                stock_summary[mtype] += qty

        total_appts = len(appts)
        occupancy_rate = round((completed_appts / total_appts) * 100, 1) if total_appts else 0.0

        overview = {
            "period": {"from": from_iso, "to": to_iso},
            "totals": {
                "clients": clients_total,
                "patients": patients_total,
                "appointments": total_appts,
                "consultations_ai": len(consultations),
                "invoices": invoices_in_range,
                "revenue_paid": round(revenue_paid, 2),
                "revenue_issued": round(revenue_issued, 2),
                "low_stock_products": len(low_stock or []),
                "occupancy_rate": occupancy_rate,
            },
            "appointments_by_status": appt_by_status,
            "invoices_by_status": invoice_by_status,
            "top_products": [
                {
                    "description": p["description"],
                    "quantity": round(p["quantity"], 3),
                    "revenue": round(p["revenue"], 2),
                }
                for p in top_products
            ],
            "stock_movements": {
                "in": round(stock_summary["in"], 3),
                "out": round(stock_summary["out"], 3),
                "adjustment": round(stock_summary["adjustment"], 3),
            },
            "low_stock_list": [
                {
                    "name": p.get("name"),
                    "stock_qty": p.get("stock_qty"),
                    "min_stock": p.get("min_stock"),
                    "unit": p.get("unit"),
                }
                for p in (low_stock or [])[:10]
            ],
            "series": {
                "appointments": [{"date": d, "count": c} for d, c in sorted(appt_daily.items())],
                "consultations": [{"date": d, "count": c} for d, c in sorted(cons_daily.items())],
                "revenue": [{"date": d, "amount": round(c, 2)} for d, c in sorted(revenue_daily.items())],
            },
        }
        return (overview, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def get_dashboard_overview(
    organization_id: str,
    member_profile_ids: Optional[List[str]] = None,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    from datetime import timedelta

    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        week_start = today_start - timedelta(days=6)

        appts_today, appt_err = list_appointments_calendar(
            organization_id, today_start.isoformat(), today_end.isoformat()
        )
        if appt_err:
            return (None, appt_err)

        pending, _ = list_appointment_requests(organization_id, status="pending", limit=50)
        low_stock, _ = list_low_stock_products(organization_id, limit=10)

        today_stats, err = get_reports_overview(
            organization_id,
            today_start.isoformat(),
            today_end.isoformat(),
            member_profile_ids,
        )
        if err:
            return (None, err)

        week_stats, week_err = get_reports_overview(
            organization_id,
            week_start.isoformat(),
            today_end.isoformat(),
            member_profile_ids,
        )
        if week_err:
            return (None, week_err)

        active_statuses = {"scheduled", "confirmed"}
        upcoming: List[Dict[str, Any]] = []
        for appt in appts_today or []:
            status = appt.get("status") or "scheduled"
            if status not in active_statuses:
                continue
            patient = appt.get("patients") or {}
            client = appt.get("clients") or {}
            upcoming.append(
                {
                    "id": appt.get("id"),
                    "starts_at": appt.get("starts_at"),
                    "status": status,
                    "reason": appt.get("reason"),
                    "patient_id": appt.get("patient_id"),
                    "patient_name": patient.get("name") or "Paciente",
                    "client_name": client.get("name"),
                }
            )

        upcoming.sort(key=lambda a: a.get("starts_at") or "")

        today_totals = (today_stats or {}).get("totals") or {}
        week_totals = (week_stats or {}).get("totals") or {}

        dashboard = {
            "today": {
                "appointments_total": len(appts_today or []),
                "appointments_upcoming": len(upcoming),
                "consultations": today_totals.get("consultations_ai", 0),
                "revenue_paid": today_totals.get("revenue_paid", 0),
                "pending_requests": len(pending or []),
                "low_stock_count": len(low_stock or []),
            },
            "week": {
                "appointments": week_totals.get("appointments", 0),
                "consultations": week_totals.get("consultations_ai", 0),
                "revenue_paid": week_totals.get("revenue_paid", 0),
            },
            "upcoming_appointments": upcoming[:10],
            "pending_requests": [
                {
                    "id": r.get("id"),
                    "client_name": r.get("client_name"),
                    "patient_name": r.get("patient_name"),
                    "preferred_starts_at": r.get("preferred_starts_at"),
                    "created_at": r.get("created_at"),
                }
                for r in (pending or [])[:5]
            ],
            "low_stock_products": [
                {
                    "id": p.get("id"),
                    "name": p.get("name"),
                    "stock_qty": p.get("stock_qty"),
                    "min_stock": p.get("min_stock"),
                    "unit": p.get("unit"),
                }
                for p in (low_stock or [])[:5]
            ],
        }
        return (dashboard, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def list_organizations(limit: int = 200) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        resp = (
            _table("organizations")
            .select("id, name, timezone, created_at")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def count_table_rows(table: str) -> Tuple[int, Optional[str]]:
    try:
        resp = _table(table).select("id", count="exact").limit(1).execute()
        return (resp.count or 0, None)
    except Exception as exc:  # noqa: BLE001
        return (0, str(exc))
