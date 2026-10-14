"""Rutas FastAPI — capa B2C dueños de mascota (aislado de MVZ/PMS)."""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field

import account_access
import auth_security
import owner_db
import password_auth
import rate_limit
from membership_catalog import OWNER_CONSULTATION_PACKAGES, OWNER_PAYMENT_TYPE
from payment_fulfillment import fulfill_paid_transaction, sync_transaction_status
from stripe_checkout_config import (
    create_stripe_checkout_session,
    owner_first_consultation_offer,
    resolve_owner_first_consultation_promo,
)
from supabase_client import (
    debit_owner_session,
    get_payment_transaction_by_session_id,
    get_profile,
    get_profile_by_email,
    insert_payment_transaction,
    owner_has_paid_consultation,
    restore_owner_session,
    upsert_profile,
)

try:
    import stripe as stripe_mod
except Exception:  # noqa: BLE001
    stripe_mod = None  # type: ignore

owner_router = APIRouter(prefix="/api/owner", tags=["owner-b2c"])


def _require_owner_id(x_veterinarian_id: Optional[str] = None) -> str:
    return auth_security.resolve_authenticated_vet_id(x_veterinarian_id)


async def _require_owner_profile(owner_id: str) -> dict:
    profile, err = get_profile(owner_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error perfil: {err}")
    return account_access.require_pet_owner_account(profile)


def _serialize_owner_consultation(row: dict) -> dict:
    return {
        "id": row.get("id"),
        "owner_id": row.get("owner_id"),
        "payload": row.get("payload") or {},
        "analysis": row.get("analysis"),
        "status": row.get("status"),
        "disclaimer_accepted_at": row.get("disclaimer_accepted_at"),
        "created_at": row.get("created_at"),
        "completed_at": row.get("completed_at"),
        "disclaimer": account_access.OWNER_DISCLAIMER_ES,
    }


class OwnerRegister(BaseModel):
    nombre: str
    email: str
    password: str
    telefono: str = Field(..., min_length=1)
    accept_terms: bool = False


OWNER_FORM_CATEGORIES = {
    "perros",
    "gatos",
    "conejos",
    "aves",
    "hamsters",
    "cuyos",
    "hurones",
    "erizos",
    "tortugas",
    "iguanas",
    "patos_pollos",
}


class OwnerConsultationCreate(BaseModel):
    """Acepta el formulario clínico por especie (mismo que GUIAA Diagnóstico) o el resumen corto."""

    pet_name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    sex: Optional[str] = None
    age: Optional[str] = None
    weight_kg: Optional[str] = None
    symptoms: Optional[str] = None
    duration: Optional[str] = None
    extra_notes: Optional[str] = None
    accept_disclaimer: bool = False
    category: Optional[str] = None
    form_data: Optional[dict] = None


class OwnerCheckoutRequest(BaseModel):
    origin_url: str
    package_id: str = OWNER_PAYMENT_TYPE


@owner_router.get("/packages")
async def list_owner_packages(request: Request):
    """Catálogo público de consultas B2C (sin datos personales)."""
    rate_limit.check_rate_limit(
        request,
        "owner_packages",
        "",
        max_attempts=60,
        window_seconds=60,
    )
    items = []
    for key, pkg in OWNER_CONSULTATION_PACKAGES.items():
        items.append(
            {
                "id": key,
                "name": pkg["name"],
                "price": pkg["price"],
                "sessions": pkg["sessions"],
                "currency": pkg["currency"],
                "description": pkg["description"],
            }
        )
    return {"packages": items, "disclaimer": account_access.OWNER_DISCLAIMER_ES}


@owner_router.post("/auth/register")
async def register_pet_owner(body: OwnerRegister, request: Request):
    """Registro dueño — sin cédula, sin org, sin trial CDS MVZ.

    Público a propósito (como /api/auth/register de MVZ). No abre /app ni CDS.
    """
    # Límite por IP+email y tope por IP para freír spam de cuentas.
    rate_limit.check_rate_limit(
        request,
        "owner_register",
        body.email,
        max_attempts=5,
        window_seconds=900,
    )
    rate_limit.check_rate_limit(
        request,
        "owner_register_ip",
        "",
        max_attempts=20,
        window_seconds=900,
    )

    if not body.accept_terms:
        raise HTTPException(
            status_code=400,
            detail="Debes aceptar los términos para continuar.",
        )

    email = (body.email or "").strip().lower()
    nombre = (body.nombre or "").strip()
    if not email or not nombre:
        raise HTTPException(status_code=400, detail="Nombre y email son requeridos")
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Correo electrónico inválido")
    if len(nombre) > 120 or len(email) > 254:
        raise HTTPException(status_code=400, detail="Datos de registro demasiado largos")

    existing, _ = get_profile_by_email(email)
    if existing:
        # Misma respuesta genérica que MVZ: evita filtrar si el correo ya existe de forma distinta.
        raise HTTPException(status_code=400, detail="Email ya registrado")

    try:
        password_hash = password_auth.hash_password(body.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=400,
            detail=password_auth.PASSWORD_HASH_ERROR_MESSAGE,
        ) from exc

    phone = (body.telefono or "").strip()
    phone_digits = "".join(ch for ch in phone if ch.isdigit())
    if len(phone_digits) < 8:
        raise HTTPException(
            status_code=400,
            detail="Indica un teléfono válido (mínimo 8 dígitos).",
        )
    owner_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    # Clave sintética única: no usar "" (chocaría con UNIQUE de cédula).
    owner_cedula_key = f"owner:{owner_id}"
    profile_data = {
        "id": owner_id,
        "nombre": nombre,
        "email": email,
        "telefono": phone,
        "account_kind": account_access.ACCOUNT_KIND_PET_OWNER,
        "owner_sessions_remaining": 0,
        "membership_type": None,
        "consultations_remaining": 0,
        "membership_expires": None,
        "cedula_profesional": owner_cedula_key,
        "cedula_profesional_key": owner_cedula_key,
        "profesional_pais": "MX",
        "cedula_verification_status": "not_required",
        "two_factor_enabled": False,
        "password_hash": password_hash,
        "created_at": now,
    }

    result, err = upsert_profile(profile_data)
    if err:
        raise HTTPException(status_code=500, detail=f"Error guardando perfil: {err}")

    saved = result or profile_data
    rate_limit.reset_rate_limit(request, "owner_register", email)
    return auth_security.attach_auth_tokens(saved)


@owner_router.get("/me")
async def owner_me(x_veterinarian_id: str = Header(None)):
    owner_id = _require_owner_id(x_veterinarian_id)
    profile = await _require_owner_profile(owner_id)
    unlimited = account_access.has_unlimited_owner_access(profile)
    sessions = (
        999999
        if unlimited
        else int(profile.get("owner_sessions_remaining") or 0)
    )
    list_price = float(OWNER_CONSULTATION_PACKAGES[OWNER_PAYMENT_TYPE]["price"])
    return {
        "id": profile.get("id"),
        "nombre": profile.get("nombre"),
        "email": profile.get("email"),
        "telefono": profile.get("telefono"),
        "account_kind": profile.get("account_kind")
        or account_access.ACCOUNT_KIND_VETERINARIAN,
        "owner_sessions_remaining": sessions,
        "owner_unlimited": unlimited,
        "platform_admin": auth_security.is_platform_admin_profile(profile),
        "disclaimer": account_access.OWNER_DISCLAIMER_ES,
        "first_consultation_offer": owner_first_consultation_offer(
            owner_has_paid_consultation(owner_id),
            list_price,
        ),
    }


@owner_router.post("/payments/checkout/session")
async def create_owner_checkout(
    payload: OwnerCheckoutRequest,
    request: Request,
    x_veterinarian_id: str = Header(None),
):
    owner_id = _require_owner_id(x_veterinarian_id)
    profile = await _require_owner_profile(owner_id)

    package = OWNER_CONSULTATION_PACKAGES.get(payload.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    stripe_key = os.getenv("STRIPE_API_KEY") or os.getenv("STRIPE_SECRET_KEY")
    amount = float(package["price"])
    sessions = int(package["sessions"])
    session_id = f"sim_owner_{uuid.uuid4()}"
    transaction_data = {
        "session_id": session_id,
        "type": OWNER_PAYMENT_TYPE,
        "package_id": payload.package_id,
        "credits": sessions,
        "amount": amount,
        "currency": package["currency"],
        "status": "open",
        "payment_status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "veterinarian_id": owner_id,
    }

    origin = (payload.origin_url or "").rstrip("/")
    if stripe_mod and stripe_key:
        stripe_mod.api_key = stripe_key
        try:
            success_url = f"{origin}/consulta/pago-ok?session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{origin}/consulta/pagar"
            already_paid = owner_has_paid_consultation(owner_id)
            promo = (
                None
                if already_paid
                else resolve_owner_first_consultation_promo(stripe_mod)
            )
            price_data = {
                "currency": package["currency"],
                "unit_amount": int(round(amount * 100)),
            }
            if promo and promo.get("product_id"):
                price_data["product"] = promo["product_id"]
            else:
                price_data["product_data"] = {
                    "name": package["name"],
                    "description": package.get("description") or "",
                }
            checkout_kwargs = {}
            if promo and promo.get("promotion_code_id"):
                checkout_kwargs["discounts"] = [
                    {"promotion_code": promo["promotion_code_id"]}
                ]
            session = create_stripe_checkout_session(
                stripe_mod,
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                profile=profile,
                branding_settings={"display_name": "GUIAA Consulta"},
                line_items=[{"price_data": price_data, "quantity": 1}],
                **checkout_kwargs,
                metadata={
                    "type": OWNER_PAYMENT_TYPE,
                    "package_id": payload.package_id,
                    "sessions": str(sessions),
                    "veterinarian_id": owner_id,
                    "account_kind": account_access.ACCOUNT_KIND_PET_OWNER,
                },
            )
            session_id = session.id
            transaction_data["session_id"] = session_id
            transaction_data["stripe"] = True
            _, err = insert_payment_transaction(transaction_data)
            if err:
                raise HTTPException(status_code=500, detail=f"Error guardando transacción: {err}")
            return {"checkout_url": session.url, "session_id": session_id}
        except HTTPException:
            raise
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=500, detail=f"Error creando sesión Stripe: {exc}"
            ) from exc

    _, err = insert_payment_transaction(transaction_data)
    if err:
        raise HTTPException(status_code=500, detail=f"Error guardando transacción: {err}")
    checkout_url = f"{origin}/consulta/pago-ok?session_id={session_id}"
    return {
        "checkout_url": checkout_url,
        "session_id": session_id,
        "message": "Pago simulado — en producción usa Stripe",
    }


@owner_router.get("/payments/checkout/status/{session_id}")
async def owner_checkout_status(
    session_id: str,
    x_veterinarian_id: str = Header(None),
):
    owner_id = _require_owner_id(x_veterinarian_id)
    await _require_owner_profile(owner_id)

    transaction, err = get_payment_transaction_by_session_id(session_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error obteniendo transacción: {err}")
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    tx_owner = (transaction.get("veterinarian_id") or "").strip()
    if tx_owner and tx_owner != owner_id:
        raise HTTPException(status_code=403, detail="No autorizado para esta transacción")

    tx_type = (transaction.get("type") or "").strip()
    if tx_type != OWNER_PAYMENT_TYPE:
        raise HTTPException(
            status_code=400,
            detail="Esta sesión no es un pago de consulta para dueños",
        )

    stripe_key = os.getenv("STRIPE_API_KEY") or os.getenv("STRIPE_SECRET_KEY")
    status_value = transaction.get("status", "open")
    payment_status = transaction.get("payment_status", "unpaid")

    if stripe_mod and stripe_key and str(session_id).startswith("cs_"):
        stripe_mod.api_key = stripe_key
        try:
            session = stripe_mod.checkout.Session.retrieve(session_id)
            status_value = session.status
            payment_status = session.payment_status
            sync_transaction_status(
                session_id,
                status=status_value,
                payment_status=payment_status,
            )
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=500, detail=f"Error verificando Stripe: {exc}"
            ) from exc
    else:
        status_value = "complete"
        payment_status = "paid"
        sync_transaction_status(
            session_id,
            status=status_value,
            payment_status=payment_status,
        )

    if payment_status == "paid":
        transaction, _ = get_payment_transaction_by_session_id(session_id)
        profile, fulfill_err, _ = fulfill_paid_transaction(transaction or {})
        if fulfill_err:
            raise HTTPException(status_code=500, detail=fulfill_err)
        sessions = int((profile or {}).get("owner_sessions_remaining") or 0)
        return {
            "status": status_value,
            "payment_status": payment_status,
            "owner_sessions_remaining": sessions,
            "fulfilled": True,
        }

    return {
        "status": status_value,
        "payment_status": payment_status,
        "fulfilled": False,
    }


@owner_router.get("/consultations")
async def list_my_owner_consultations(x_veterinarian_id: str = Header(None)):
    owner_id = _require_owner_id(x_veterinarian_id)
    await _require_owner_profile(owner_id)
    rows, err = owner_db.list_owner_consultations(owner_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return {"consultations": [_serialize_owner_consultation(r) for r in rows]}


@owner_router.get("/consultations/{consultation_id}")
async def get_owner_consultation(
    consultation_id: str,
    x_veterinarian_id: str = Header(None),
):
    owner_id = _require_owner_id(x_veterinarian_id)
    await _require_owner_profile(owner_id)
    row, err = owner_db.get_owner_consultation(consultation_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not row or (row.get("owner_id") or "").strip() != owner_id:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    return _serialize_owner_consultation(row)


@owner_router.post("/consultations")
async def create_owner_consultation(
    body: OwnerConsultationCreate,
    x_veterinarian_id: str = Header(None),
):
    """Crea consulta B2C y descuenta 1 sesión pagada (no toca cupo MVZ)."""
    owner_id = _require_owner_id(x_veterinarian_id)
    profile = await _require_owner_profile(owner_id)

    if not body.accept_disclaimer:
        raise HTTPException(
            status_code=400,
            detail="Debes aceptar el aviso informativo para continuar.",
        )

    sessions = int(profile.get("owner_sessions_remaining") or 0)
    unlimited = account_access.has_unlimited_owner_access(profile)
    if not unlimited and sessions <= 0:
        raise HTTPException(
            status_code=403,
            detail="No tienes sesiones pagadas. Compra una consulta antes de continuar.",
        )

    incoming = dict(body.form_data or {})
    category = (body.category or body.species or incoming.get("especie") or "").strip().lower()
    legacy = {
        "perro": "perros",
        "dog": "perros",
        "gato": "gatos",
        "cat": "gatos",
    }
    category = legacy.get(category, category)
    if category not in OWNER_FORM_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail="Selecciona una especie con formulario de GUIAA Consulta.",
        )

    pet_name = (body.pet_name or incoming.get("nombre_mascota") or "").strip()
    if not pet_name:
        raise HTTPException(status_code=400, detail="Indica el nombre de la mascota.")

    if incoming:
        form_data = incoming
    else:
        symptoms = (body.symptoms or "").strip()
        if len(symptoms) < 3:
            raise HTTPException(
                status_code=400,
                detail="Describe los síntomas o el motivo (mínimo 3 caracteres).",
            )
        form_data = {
            "nombre_mascota": pet_name,
            "especie": category,
            "raza": (body.breed or "").strip(),
            "sexo": (body.sex or "").strip(),
            "edad": (body.age or "").strip(),
            "peso": (body.weight_kg or "").strip(),
            "motivo_consulta": symptoms,
            "duracion_sintomas": (body.duration or "").strip(),
            "notas_adicionales": (body.extra_notes or "").strip(),
        }

    form_data["nombre_mascota"] = pet_name
    form_data["nombre_dueño"] = profile.get("nombre") or form_data.get("nombre_dueño") or ""
    form_data["especie"] = category
    detalle = (
        str(form_data.get("detalle_paciente") or "").strip()
        or str(form_data.get("motivo_consulta") or "").strip()
        or (body.symptoms or "").strip()
    )

    now = datetime.now(timezone.utc).isoformat()
    consultation_id = str(uuid.uuid4())
    payload = {
        "channel": "owner_b2c",
        "product": "guiaa_consulta",
        "category": category,
        "form_data": form_data,
        "detalle_paciente": detalle or "Ver formulario clínico de la especie.",
    }
    new_row = {
        "id": consultation_id,
        "owner_id": owner_id,
        "payload": payload,
        "status": "draft",
        "disclaimer_accepted_at": now,
        "created_at": now,
    }

    new_sessions = 999999 if unlimited else sessions
    if not unlimited:
        debited_sessions, debit_err = debit_owner_session(owner_id, sessions)
        if debit_err:
            raise HTTPException(
                status_code=500,
                detail=f"Error descontando sesión pagada: {debit_err}",
            )
        if debited_sessions is None:
            raise HTTPException(
                status_code=409,
                detail="Tu saldo cambió antes de crear la consulta. Actualiza e intenta de nuevo.",
            )
        new_sessions = debited_sessions

    inserted, err_ins = owner_db.insert_owner_consultation(new_row)
    if err_ins:
        if not unlimited:
            restored, restore_err = restore_owner_session(owner_id, new_sessions)
            if restore_err or not restored:
                print(
                    "[ERROR] No se pudo revertir owner_sessions_remaining "
                    f"owner={owner_id}: {restore_err or 'saldo cambió'}"
                )
        raise HTTPException(status_code=500, detail=f"Error guardando consulta: {err_ins}")

    serialized = _serialize_owner_consultation(inserted or new_row)
    serialized["owner_sessions_remaining"] = new_sessions
    serialized["owner_unlimited"] = unlimited
    return serialized


@owner_router.post("/consultations/{consultation_id}/analyze")
async def analyze_owner_consultation(
    consultation_id: str,
    x_veterinarian_id: str = Header(None),
):
    """Análisis orientativo para dueño — motor LLM con prompt B2C (no CDS Premium)."""
    owner_id = _require_owner_id(x_veterinarian_id)
    await _require_owner_profile(owner_id)

    row, err = owner_db.get_owner_consultation(consultation_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    if not row or (row.get("owner_id") or "").strip() != owner_id:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")

    if (row.get("status") or "").lower() == "completed" and row.get("analysis"):
        return {
            "analysis": row.get("analysis"),
            "disclaimer": account_access.OWNER_DISCLAIMER_ES,
            "consultation": _serialize_owner_consultation(row),
        }

    payload = row.get("payload") or {}
    form_data = payload.get("form_data") or {}
    category = payload.get("category") or form_data.get("especie") or "mascota"

    lines: List[str] = []
    for key, value in form_data.items():
        if value and str(value).strip() and str(value).upper() != "NO":
            lines.append(f"- {key.replace('_', ' ').title()}: {value}")

    user_message = f"""Genera orientación clínica informativa para el dueño de la mascota.

**Especie / categoría**: {str(category).capitalize()}

**Datos aportados por el dueño**:
{chr(10).join(lines) if lines else '- (sin detalle adicional)'}

**Síntomas / motivo**:
{payload.get('detalle_paciente') or form_data.get('motivo_consulta') or form_data.get('symptoms') or 'No detallado'}

Salida visible obligatoria (solo estas 3 secciones):
1) RESUMEN EJECUTIVO
2) RECOMENDACIONES PRÁCTICAS
3) PRONÓSTICO Y SIGUIENTES PASOS

Sin dosificaciones exactas. Incluye el disclaimer de orientación clínica informativa.
Prioriza urgencias reales con nota crítica breve si aplica."""

    # Motor LLM separado del CDS MVZ (prompt propio: instrucciones_dueno_mascota.txt)
    import owner_llm

    try:
        analysis_text = await owner_llm.send_owner_llm_message(user_message)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail=f"Error generando orientación: {exc}"
        ) from exc

    now = datetime.now(timezone.utc).isoformat()
    err_upd = owner_db.update_owner_consultation(
        consultation_id,
        {
            "analysis": analysis_text,
            "status": "completed",
            "completed_at": now,
            "updated_at": now,
        },
    )
    if err_upd:
        raise HTTPException(status_code=500, detail=f"Error guardando análisis: {err_upd}")

    refreshed, _ = owner_db.get_owner_consultation(consultation_id)
    return {
        "analysis": analysis_text,
        "disclaimer": account_access.OWNER_DISCLAIMER_ES,
        "consultation": _serialize_owner_consultation(refreshed or row),
    }
