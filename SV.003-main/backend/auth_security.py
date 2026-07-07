"""Autenticación JWT, admins de plataforma y utilidades de seguridad."""
from __future__ import annotations

import os
import re
import uuid
from contextvars import ContextVar
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Set, Tuple

from fastapi import HTTPException, Request
from jose import JWTError, jwt

_current_vet_id: ContextVar[Optional[str]] = ContextVar("current_vet_id", default=None)

_cedula_flow_store: Dict[str, Dict[str, Any]] = {}
CEDULA_FLOW_TTL_SECONDS = 30 * 60

ALGORITHM = "HS256"
DEFAULT_TOKEN_HOURS = 24


def _jwt_secret() -> str:
    secret = (
        os.getenv("JWT_SECRET", "").strip()
        or os.getenv("SESSION_SECRET", "").strip()
    )
    if secret:
        return secret
    env = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development")).lower()
    if env in ("production", "prod"):
        raise RuntimeError(
            "JWT_SECRET o SESSION_SECRET es obligatorio en producción"
        )
    return "guiaa-dev-only-change-before-production"


def token_expire_seconds() -> int:
    hours = DEFAULT_TOKEN_HOURS
    raw = os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "").strip()
    if raw:
        try:
            hours = max(1, min(int(raw), 24 * 30))
        except ValueError:
            pass
    return hours * 3600


def create_access_token(vet_id: str, email: str = "") -> str:
    try:
        secret = _jwt_secret()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Autenticación no disponible: falta JWT_SECRET en el servidor. "
                "Contacta soporte o al administrador de la plataforma."
            ),
        ) from exc
    now = datetime.now(timezone.utc)
    expire = now + timedelta(seconds=token_expire_seconds())
    payload = {
        "sub": str(vet_id),
        "email": (email or "").lower().strip(),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def verify_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada") from exc
    if payload.get("type") != "access" or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Token inválido")
    return payload


def extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    match = re.match(r"^Bearer\s+(.+)$", authorization.strip(), re.I)
    return match.group(1).strip() if match else None


def allow_insecure_vet_header() -> bool:
    return os.getenv("ALLOW_INSECURE_VET_HEADER", "").lower() in (
        "1",
        "true",
        "yes",
    )


def attach_auth_tokens(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Añade access_token a la respuesta de login/registro (sin mutar el original)."""
    from password_auth import strip_sensitive_profile_fields

    data = strip_sensitive_profile_fields(profile)
    vet_id = str(data.get("id") or "")
    email = data.get("email") or ""
    if vet_id:
        data["access_token"] = create_access_token(vet_id, email)
        data["token_type"] = "bearer"
        data["expires_in"] = token_expire_seconds()
    return data


def set_request_vet_id(vet_id: Optional[str]) -> None:
    _current_vet_id.set(vet_id)


def get_request_vet_id() -> Optional[str]:
    return _current_vet_id.get()


def _purge_expired_cedula_flow_nonces() -> None:
    now = datetime.now(timezone.utc).timestamp()
    expired = [
        nonce
        for nonce, entry in _cedula_flow_store.items()
        if entry.get("exp", 0) < now
    ]
    for nonce in expired:
        _cedula_flow_store.pop(nonce, None)


def create_cedula_flow_nonce(vet_id: str) -> str:
    """Nonce temporal para flujo de cédula (sin JWT de sesión completa)."""
    _purge_expired_cedula_flow_nonces()
    nonce = str(uuid.uuid4())
    _cedula_flow_store[nonce] = {
        "vet_id": str(vet_id),
        "exp": datetime.now(timezone.utc).timestamp() + CEDULA_FLOW_TTL_SECONDS,
    }
    return nonce


def verify_cedula_flow_nonce(
    nonce: Optional[str], vet_id: Optional[str]
) -> Optional[str]:
    if not nonce or not vet_id:
        return None
    _purge_expired_cedula_flow_nonces()
    key = nonce.strip()
    entry = _cedula_flow_store.get(key)
    if not entry:
        return None
    if entry.get("exp", 0) < datetime.now(timezone.utc).timestamp():
        _cedula_flow_store.pop(key, None)
        return None
    expected = str(vet_id).strip()
    if entry.get("vet_id") != expected:
        return None
    return expected


def invalidate_cedula_flow_nonce(nonce: Optional[str]) -> None:
    if nonce:
        _cedula_flow_store.pop(nonce.strip(), None)


def try_authenticate_cedula_flow_request(request: Request) -> Optional[str]:
    """Solo rutas /api/cedula/* con nonce + x-veterinarian-id alineados."""
    path = request.url.path.rstrip("/") or "/"
    if not path.startswith("/api/cedula"):
        return None
    nonce = (
        request.headers.get("x-cedula-flow-nonce")
        or request.headers.get("X-Cedula-Flow-Nonce")
        or ""
    ).strip()
    header_id = (
        request.headers.get("x-veterinarian-id")
        or request.headers.get("X-Veterinarian-Id")
        or ""
    ).strip()
    return verify_cedula_flow_nonce(nonce, header_id)


def cedula_flow_fields(vet_id: str) -> Dict[str, Any]:
    return {
        "cedula_flow_nonce": create_cedula_flow_nonce(vet_id),
        "cedula_flow_expires_in": CEDULA_FLOW_TTL_SECONDS,
    }


def resolve_authenticated_vet_id(x_veterinarian_id: Optional[str]) -> str:
    """Resuelve el ID del veterinario autenticado (JWT middleware o header legacy)."""
    auth_id = get_request_vet_id()
    if auth_id:
        header_id = (x_veterinarian_id or "").strip()
        if header_id and header_id != auth_id:
            raise HTTPException(
                status_code=403,
                detail="La identidad no coincide con la sesión",
            )
        return auth_id
    if allow_insecure_vet_header():
        header_id = (x_veterinarian_id or "").strip()
        if not header_id:
            raise HTTPException(status_code=401, detail="No autenticado")
        return header_id
    raise HTTPException(
        status_code=401,
        detail="Sesión requerida. Inicia sesión de nuevo.",
    )


def authenticate_http_request(request: Request) -> Optional[str]:
    """Valida Authorization Bearer; devuelve vet_id o None."""
    token = extract_bearer_token(request.headers.get("authorization"))
    if not token:
        return None
    payload = verify_access_token(token)
    return str(payload["sub"])


def platform_admin_emails_from_env() -> Set[str]:
    raw = os.getenv(
        "PLATFORM_ADMIN_EMAILS",
        "carlos.hernandez@vetmed.com",
    )
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def is_platform_admin_profile(profile: Optional[dict]) -> bool:
    if not profile:
        return False
    email = (profile.get("email") or "").lower().strip()
    if email in platform_admin_emails_from_env():
        return True
    profile_id = profile.get("id")
    if not profile_id:
        return False
    try:
        from supabase_client import is_platform_admin_in_db

        return is_platform_admin_in_db(profile_id, email)
    except Exception:  # noqa: BLE001
        return False


def is_public_api_route(method: str, path: str) -> bool:
    m = method.upper()
    p = path.rstrip("/") or "/"
    if p in ("/", "/health", "/docs", "/openapi.json", "/redoc"):
        return True
    if p.startswith("/api/public/"):
        return True
    public_exact: Set[Tuple[str, str]] = {
        ("POST", "/api/auth/login"),
        ("POST", "/api/auth/register"),
        ("POST", "/api/auth/verify-2fa"),
        ("POST", "/api/support/chat"),
        ("POST", "/api/payments/stripe/webhook"),
        ("GET", "/api/stripe/config"),
        ("GET", "/api/stripe/promo-status"),
        ("GET", "/api/membership/packages"),
        ("GET", "/api/consultations/credit-packages"),
    }
    if (m, p) in public_exact:
        return True
    return False


def is_blocked_debug_route(path: str) -> bool:
    if os.getenv("ALLOW_DEBUG_ROUTES", "").lower() in ("1", "true", "yes"):
        return False
    if path.startswith("/api/config/diagnostics"):
        return True
    return path.startswith("/api/debug") or path.startswith("/api/test")


def audit_admin_action(
    admin_profile: dict,
    action: str,
    *,
    target_profile_id: Optional[str] = None,
    target_email: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> None:
    try:
        from supabase_client import insert_admin_audit_log

        insert_admin_audit_log(
            {
                "admin_profile_id": admin_profile.get("id"),
                "admin_email": admin_profile.get("email"),
                "action": action,
                "target_profile_id": target_profile_id,
                "target_email": target_email,
                "metadata": metadata or {},
            }
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[WARN] audit log: {exc}")
