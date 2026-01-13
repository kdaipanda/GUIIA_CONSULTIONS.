import asyncio
import base64
import os
import re
import secrets
import string
import sys
import io
import unicodedata
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

# Configurar UTF-8 para Windows al inicio del módulo
if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, OSError):
        # Si stdout/stderr no tienen buffer (ej. en algunos entornos), ignorar
        pass

import certifi
import httpx
try:
    from anthropic import Anthropic  # type: ignore
    from anthropic._exceptions import APIStatusError  # type: ignore
except Exception:  # noqa: BLE001
    # En modo local "simple" Anthropic es opcional.
    Anthropic = None  # type: ignore[assignment]
    APIStatusError = Exception  # type: ignore[assignment]
from dotenv import load_dotenv
from fastapi import FastAPI, File, Header, HTTPException, Request, UploadFile
from starlette.requests import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from starlette.responses import Response
from pydantic import BaseModel, Field
from supabase_client import (
    SupabaseConfigError,
    count_consultations_by_user,
    get_consultation_by_id,
    get_payment_transaction_by_session_id,
    get_profile,
    get_profile_by_email,
    get_profile_by_cedula,
    get_profile_by_credentials,
    insert_consultation,
    insert_medical_image,
    insert_payment_transaction,
    list_consultations,
    list_medical_images,
    list_profiles,
    update_consultation,
    update_payment_transaction,
    update_profile,
    upload_bytes_to_storage,
    upsert_profile,
)

# Stripe SDK (opcional)
try:
    import stripe
except ImportError:
    stripe = None
    print("[WARNING] Stripe SDK no disponible. Los pagos funcionarán en modo simulado.")

# Load environment variables
# En producción (Railway, Render, etc.), las variables se cargan desde el sistema
# En desarrollo local, se cargan desde el archivo .env
# IMPORTANTE: En producción, las variables del sistema tienen prioridad sobre .env
env_file_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_file_path):
    # override=False significa que las variables del sistema tienen prioridad
    load_dotenv(dotenv_path=env_file_path, override=False)
else:
    # Si no existe .env, intentar cargar desde el directorio actual
    load_dotenv(override=False)

# Log para debugging (solo en desarrollo)
if os.getenv("RAILWAY_ENVIRONMENT") is None and os.getenv("RENDER") is None:
    print(f"[DEBUG] Variables cargadas desde: {env_file_path if os.path.exists(env_file_path) else 'sistema'}")

app = FastAPI(title="Savant Vet API - Local Version")

# CORS middleware
CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
if CORS_ALLOW_ORIGINS:
    cors_allow_origins = [
        origin.strip() for origin in CORS_ALLOW_ORIGINS.split(",") if origin.strip()
    ]
else:
    cors_allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    allow_origin_regex=r"https?://.*\.(trycloudflare\.com|vercel\.app)",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Database setup - usando Supabase
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "").strip()
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "").strip()
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
# Por defecto usar Sonnet 4 (puedes sobrescribir con ANTHROPIC_MODEL en backend/.env)
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514").strip()
def _get_int_env(key: str, default: int) -> int:
    raw = os.getenv(key, "").strip()
    if raw:
        try:
            return int(raw)
        except ValueError:
            pass
    return default


def _get_float_env(key: str, default: float) -> float:
    raw = os.getenv(key, "").strip()
    if raw:
        try:
            return float(raw)
        except ValueError:
            pass
    return default


# Claude Sonnet 4 soporta hasta 200,000 tokens de salida
ANTHROPIC_MAX_TOKENS = _get_int_env("ANTHROPIC_MAX_TOKENS", 16000)
ANTHROPIC_TEMPERATURE = _get_float_env("ANTHROPIC_TEMPERATURE", 0.01)
ANTHROPIC_TOP_P = _get_float_env("ANTHROPIC_TOP_P", 0.9)
ANTHROPIC_TOP_K = _get_int_env("ANTHROPIC_TOP_K", 50)
ANTHROPIC_METADATA_SOURCE = os.getenv("ANTHROPIC_SOURCE", "savant-vet-local").strip() or "savant-vet-local"
ANTHROPIC_INSTRUCTIONS_FILE = os.getenv(
    "ANTHROPIC_INSTRUCTIONS_FILE",
    os.path.join(os.path.dirname(__file__), "instrucciones_veterinarias.txt"),
).strip()

anthropic_client: Optional[Anthropic] = (
    Anthropic(api_key=ANTHROPIC_API_KEY) if (Anthropic and ANTHROPIC_API_KEY) else None
)
SYSTEM_INSTRUCTIONS_CACHE: Optional[str] = None
SYSTEM_INSTRUCTIONS_MTIME: Optional[float] = None


def _load_system_instructions() -> Optional[str]:
    """
    Carga el prompt base desde instrucciones_veterinarias.txt.
    - Se cachea, pero se recarga automáticamente si el archivo cambió (mtime).
    """
    global SYSTEM_INSTRUCTIONS_CACHE, SYSTEM_INSTRUCTIONS_MTIME

    if ANTHROPIC_INSTRUCTIONS_FILE and os.path.exists(ANTHROPIC_INSTRUCTIONS_FILE):
        try:
            mtime = os.path.getmtime(ANTHROPIC_INSTRUCTIONS_FILE)
        except OSError:
            mtime = None

        # Cache hit si no ha cambiado
        if (
            SYSTEM_INSTRUCTIONS_CACHE is not None
            and SYSTEM_INSTRUCTIONS_MTIME is not None
            and mtime is not None
            and mtime == SYSTEM_INSTRUCTIONS_MTIME
        ):
            return SYSTEM_INSTRUCTIONS_CACHE

        try:
            with open(ANTHROPIC_INSTRUCTIONS_FILE, "r", encoding="utf-8") as file:
                SYSTEM_INSTRUCTIONS_CACHE = file.read().strip()
                SYSTEM_INSTRUCTIONS_MTIME = mtime
        except OSError as exc:
            print(f"[WARN] No se pudo leer {ANTHROPIC_INSTRUCTIONS_FILE}: {exc}")
            SYSTEM_INSTRUCTIONS_CACHE = None
            SYSTEM_INSTRUCTIONS_MTIME = None
    else:
        SYSTEM_INSTRUCTIONS_CACHE = None
        SYSTEM_INSTRUCTIONS_MTIME = None
    return SYSTEM_INSTRUCTIONS_CACHE


@app.get("/api/debug/instructions")
async def debug_instructions():
    """
    Debug: confirma si el backend está leyendo instrucciones_veterinarias.txt.
    No expone el contenido por seguridad; solo metadatos.
    """
    path = ANTHROPIC_INSTRUCTIONS_FILE
    exists = bool(path and os.path.exists(path))
    mtime = None
    if exists and path:
        try:
            mtime = os.path.getmtime(path)
        except OSError:
            mtime = None
    txt = _load_system_instructions()
    return {
        "instructions_file": path,
        "exists": exists,
        "loaded": bool(txt),
        "length": len(txt or ""),
        "mtime": mtime,
        # En este proyecto usamos SOLO instrucciones_veterinarias.txt como system prompt.
        "anthropic_instructions_only": True,
    }


async def send_llm_message(content: List[Dict[str, Any]]) -> str:
    """
    Helper para enviar mensajes al API de Anthropic.
    SOLO usa el system prompt desde instrucciones_veterinarias.txt (sin otros prompts).
    """
    if not ANTHROPIC_API_KEY:
        # Verificar si está en el sistema pero no se cargó
        system_key = os.getenv("ANTHROPIC_API_KEY", "")
        is_production = os.getenv("RAILWAY_ENVIRONMENT") is not None or os.getenv("RENDER") is not None
        
        if system_key and not ANTHROPIC_API_KEY:
            # La variable está en el sistema pero no se cargó correctamente
            raise ValueError(
                "ANTHROPIC_API_KEY está en el sistema pero no se cargó. "
                "Reinicia el servicio en Railway/Render."
            )
        elif is_production:
            raise ValueError(
                "ANTHROPIC_API_KEY no está configurada en Railway/Render. "
                "Ve a Variables en tu servicio y agrega: ANTHROPIC_API_KEY=sk-ant-api-..."
            )
        else:
            raise ValueError(
                "ANTHROPIC_API_KEY no está configurada. "
                "En desarrollo: añádela en backend/.env. "
                "En producción: configúrala como variable de entorno en Railway/Render."
            )

    # Si la librería no está instalada, evita el crash "'NoneType' object is not callable"
    if Anthropic is None:
        raise ValueError(
            "El paquete 'anthropic' no está instalado en el backend. "
            "Instálalo con: pip install anthropic (o instala requirements_simple.txt)."
        )

    global anthropic_client
    if anthropic_client is None:
        anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

    # SOLO usar el prompt desde instrucciones_veterinarias.txt como system prompt.
    # Si el archivo no existe o está vacío, lanzar error.
    file_instructions = _load_system_instructions()
    if not file_instructions:
        raise ValueError(
            f"El archivo de instrucciones '{ANTHROPIC_INSTRUCTIONS_FILE}' no existe o está vacío. "
            "Este archivo es obligatorio para generar análisis con Claude."
        )
    system_prompt = file_instructions

    def _call_claude() -> str:
        response = anthropic_client.messages.create(
            model=ANTHROPIC_MODEL or "claude-3-5-sonnet-20241022",
            max_tokens=ANTHROPIC_MAX_TOKENS,
            temperature=ANTHROPIC_TEMPERATURE,
            top_p=ANTHROPIC_TOP_P,
            top_k=ANTHROPIC_TOP_K,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": content,
                }
            ],
        )

        text_blocks = [
            block.text
            for block in response.content
            if getattr(block, "type", "") == "text"
        ]
        return "".join(text_blocks).strip() or "No se obtuvo respuesta del modelo."

    try:
        return await asyncio.to_thread(_call_claude)
    except APIStatusError as exc:
        error_message = exc.message or getattr(exc, "body", {}).get("error", {}).get(
            "message", "Error desconocido"
        )
        raise RuntimeError(f"Error Anthropic {exc.status_code}: {error_message}") from exc
    except Exception as exc:
        raise RuntimeError(f"Error al llamar a Anthropic: {exc}") from exc


# Base de datos: Supabase (ver supabase_client.py)
print("Usando Supabase como base de datos")

# Almacenamiento en memoria para datos temporales (2FA codes, etc.)
MEMORY_DB = {
    "temp_2fa_codes": {},
}

# ============================================
# CÉDULA PROFESIONAL (UPLOAD + VERIFICACIÓN)
# ============================================

CEDULA_STATUS_UNSUBMITTED = "unsubmitted"
CEDULA_STATUS_PENDING = "pending"
CEDULA_STATUS_VERIFIED = "verified"
CEDULA_STATUS_REJECTED = "rejected"

DEFAULT_CEDULA_MAX_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_CEDULA_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}

# Profesiones aceptadas para veterinarios (normalizadas / tolerantes)
ALLOWED_VET_PROFESSIONS = {
    "MEDICO VETERINARIO ZOOTECNISTA",
    "MÉDICO VETERINARIO ZOOTECNISTA",
    "MEDICO VETERINARIO",
    "MÉDICO VETERINARIO",
    "VETERINARIA",
    "VETERINARIO",
}


def _norm_text(s: str) -> str:
    s = (s or "").strip()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.upper()
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _profession_is_vet(prof: str) -> bool:
    p = _norm_text(prof)
    if not p:
        return False
    allowed = {_norm_text(x) for x in ALLOWED_VET_PROFESSIONS}
    if p in allowed:
        return True
    return ("VETERINAR" in p) or ("ZOOTECN" in p and "VETERIN" in p)


class CedulaUploadResponse(BaseModel):
    status: str
    cedula_document_url: Optional[str] = None
    message: Optional[str] = None


class CedulaVerifyRequest(BaseModel):
    veterinarian_id: Optional[str] = None
    cedula_profesional: str
    expected_nombre: Optional[str] = None


class CedulaVerifyResponse(BaseModel):
    status: str
    verification_status: str
    sep_nombre: Optional[str] = None
    sep_profesion: Optional[str] = None
    message: Optional[str] = None


async def _sep_dgp_lookup(cedula: str) -> Dict[str, Optional[str]]:
    """
    Lookup best-effort de cédula en el portal público SEP/DGP.

    El portal puede cambiar; por eso intentamos varios endpoints y parsers.
    Retorna dict con keys: nombre, profesion (si se puede extraer).
    """
    cedula = (cedula or "").strip()
    if not cedula or not cedula.isdigit():
        raise ValueError("Cédula inválida (debe ser numérica)")

    base = os.getenv("SEP_DGP_BASE_URL", "").strip() or "https://cedulaprofesional.sep.gob.mx"
    candidates = [
        f"{base}/cedula/buscaCedula?cedula={cedula}",
        f"{base}/cedula/buscaCedulaJson?cedula={cedula}",
        f"{base}/cedula/buscaCedula?cedula={cedula}&format=json",
        f"{base}/cedula/buscaCedulaProfesional?cedula={cedula}",
    ]

    timeout = httpx.Timeout(15.0, connect=10.0)
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

                # Intentar JSON primero
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

                # Fallback HTML: extraer campos comunes
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


async def _sep_dgp_lookup_with_retries(cedula: str, attempts: int = 3) -> Dict[str, Optional[str]]:
    last_exc: Optional[Exception] = None
    for i in range(max(1, attempts)):
        try:
            return await _sep_dgp_lookup(cedula)
        except Exception as exc:
            last_exc = exc
            await asyncio.sleep(0.7 * (2**i))
    raise RuntimeError(str(last_exc or "Error desconocido consultando SEP/DGP"))


# Membership packages
MEMBERSHIP_PACKAGES = {
    "basic": {
        "name": "Básica",
        "price_monthly": 950.00,
        "price_annual": 9500.00,
        "consultations": 30,  # 30 consultas mensuales
        "currency": "mxn",
    },
    "professional": {
        "name": "Profesional",
        "price_monthly": 1250.00,
        "price_annual": 12500.00,
        "consultations": 35,  # 35 consultas mensuales
        "currency": "mxn",
    },
    "premium": {
        "name": "Premium",
        "price_monthly": 2200.00,
        "price_annual": 22000.00,
        "consultations": 150,  # 150 consultas mensuales
        "currency": "mxn",
    },
}

CONSULTATION_CREDIT_PACKAGES = {
    "credits_10": {
        "name": "10 consultas",
        "price": 350.00,
        "credits": 10,
        "currency": "mxn",
    },
}

# Animal categories
ANIMAL_CATEGORIES = {
    "perros": {
        "name": "Perros",
        "icon": "🐕",
    },
    "gatos": {
        "name": "Gatos",
        "icon": "🐈",
    },
    "tortugas": {
        "name": "Tortugas",
        "icon": "🐢",
    },
    "erizos": {
        "name": "Erizos",
        "icon": "🦔",
    },
    "hurones": {
        "name": "Hurones",
        "icon": "🦦",
    },
    "iguanas": {
        "name": "Iguanas",
        "icon": "🦎",
    },
    "hamsters": {
        "name": "Hámsters",
        "icon": "🐹",
    },
    "patos_pollos": {
        "name": "Patos/Pollos",
        "icon": "🦆",
    },
    "aves": {
        "name": "Aves",
        "icon": "🦜",
    },
    "conejos": {
        "name": "Conejos",
        "icon": "🐰",
    },
    "cuyos": {
        "name": "Cuyos",
        "icon": "🐹",
    },
}

# ============================================
# PYDANTIC MODELS
# ============================================


class VeterinarianRegister(BaseModel):
    nombre: str
    email: str
    telefono: str
    cedula_profesional: str
    especialidad: str
    años_experiencia: int
    institucion: str


class VeterinarianLogin(BaseModel):
    email: str
    cedula_profesional: str


class TwoFactorVerify(BaseModel):
    nonce: str
    code: str


class ConsultationCreate(BaseModel):
    animal_id: str
    category: str
    symptoms: str
    duration: str
    severity: str
    additional_info: Optional[str] = ""
    form_data: Dict[str, Any]


class PaymentRequest(BaseModel):
    package: Optional[str] = None
    package_id: Optional[str] = None
    billing_cycle: str
    origin_url: str
    veterinarian_id: Optional[str] = None


class ConsultationCreditsPurchaseRequest(BaseModel):
    veterinarian_id: str
    package_id: str
    origin_url: str
    quantity: int = 1

class ConsultationStageOne(BaseModel):
    veterinarian_id: str
    category: str
    consultation_data: Dict[str, Any]


class ConsultationPayloadUpdate(BaseModel):
    category: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None
    detalle_paciente: Optional[str] = None

class ObservationUpdate(BaseModel):
    detalle_paciente: str


class ConsultationRatingUpdate(BaseModel):
    rating: int = Field(..., ge=1, le=5)


# ============================================
# HELPER FUNCTIONS
# ============================================

# Usuarios de desarrollo que pasan verificación automáticamente
# Usuarios de desarrollo (pasan verificación de cédula automáticamente)
DEV_EMAILS = {
    "carlos.hernandez@vetmed.com",
    "mariana.lopez@vetmed.com",
    # Usuarios de prueba por membresía
    "basico@guiaa.vet",
    "profesional@guiaa.vet", 
    "premium@guiaa.vet",
}


def is_dev_user(email: str) -> bool:
    """Verifica si un email pertenece a un usuario de desarrollo"""
    return email.lower().strip() in DEV_EMAILS


def validate_trial_consultations_limit(membership_type: Optional[str], consultations_remaining: int) -> bool:
    """
    Valida que usuarios sin membresía no tengan más de 3 consultas de prueba.
    Retorna True si es válido, lanza HTTPException si no.
    """
    if not membership_type and consultations_remaining > 3:
        raise HTTPException(
            status_code=400,
            detail="Los usuarios sin membresía solo pueden tener máximo 3 consultas de prueba."
        )
    return True


def generate_2fa_code():
    """Genera un código de 6 dígitos"""
    return "".join(secrets.choice(string.digits) for _ in range(6))


def generate_nonce():
    """Genera un nonce único"""
    return str(uuid.uuid4())


async def get_db_collection(collection_name: str):
    """Obtiene colección de memoria (para datos temporales)"""
    if collection_name not in MEMORY_DB:
        MEMORY_DB[collection_name] = {}
    return MEMORY_DB.get(collection_name, {})


async def insert_one_db(collection_name: str, data: dict):
    """Inserta un documento en memoria"""
    if collection_name not in MEMORY_DB:
        MEMORY_DB[collection_name] = {}
    doc_id = str(uuid.uuid4())
    stored = dict(data)
    stored["_id"] = doc_id
    stored["id"] = stored.get("id") or doc_id
    MEMORY_DB[collection_name][doc_id] = stored
    return clean_document(stored)


def clean_document(doc):
    """Devuelve una copia limpia del documento (sin _id ni referencias mutables)."""
    if doc and isinstance(doc, dict):
        cleaned = dict(doc)
        cleaned.pop("_id", None)
        return cleaned
    return doc


async def find_one_db(collection_name: str, query: dict):
    """Busca un documento en memoria"""
    if collection_name not in MEMORY_DB:
        MEMORY_DB[collection_name] = {}
    for doc in MEMORY_DB[collection_name].values():
        match = all(doc.get(k) == v for k, v in query.items())
        if match:
            return clean_document(doc)
    return None


async def find_many_db(collection_name: str, query: dict, sort=None, limit=None):
    """Busca múltiples documentos en memoria"""
    if collection_name not in MEMORY_DB:
        MEMORY_DB[collection_name] = {}
    results = []
    for doc in MEMORY_DB[collection_name].values():
        match = all(doc.get(k) == v for k, v in query.items())
        if match:
            results.append(clean_document(doc))
    if limit:
        results = results[:limit]
    return results


async def update_one_db(collection_name: str, query: dict, update: dict):
    """Actualiza un documento en memoria"""
    if collection_name not in MEMORY_DB:
        MEMORY_DB[collection_name] = {}
    for doc_id, doc in MEMORY_DB[collection_name].items():
        match = all(doc.get(k) == v for k, v in query.items())
        if match:
            MEMORY_DB[collection_name][doc_id].update(update)
            break


async def count_documents_db(collection_name: str, query: dict):
    """Cuenta documentos en memoria"""
    if collection_name not in MEMORY_DB:
        MEMORY_DB[collection_name] = {}
    count = 0
    for doc in MEMORY_DB[collection_name].values():
        match = all(doc.get(k) == v for k, v in query.items())
        if match:
            count += 1
    return count


# ============================================
# ENDPOINTS
# ============================================

# Manejar OPTIONS para todas las rutas (CORS preflight) - DEBE ESTAR PRIMERO
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    """Maneja peticiones OPTIONS para CORS preflight"""
    # El middleware CORS ya maneja los headers, solo necesitamos responder 200
    return Response(status_code=200)

# Handlers OPTIONS específicos para rutas principales (asegurar que funcionen)
@app.options("/api/auth/login")
async def options_login():
    """Handler OPTIONS específico para login"""
    return Response(status_code=200)

@app.options("/api/auth/register")
async def options_register():
    """Handler OPTIONS específico para register"""
    return Response(status_code=200)

@app.options("/api/consultations")
async def options_consultations():
    """Handler OPTIONS para consultations"""
    return Response(status_code=200)

@app.options("/api/medical-images")
async def options_medical_images():
    """Handler OPTIONS para medical-images"""
    return Response(status_code=200)


@app.get("/")
async def root():
    return {
        "message": "Savant Vet API - Local Version",
        "version": "1.0.0",
        "database": "Supabase",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/test/claude")
async def test_claude_connection():
    """Endpoint de prueba para verificar conexión con Claude/Anthropic"""
    # Verificar si la variable está en el sistema (producción) o en .env (desarrollo)
    env_key_from_system = os.getenv("ANTHROPIC_API_KEY", "")
    env_file_exists = os.path.exists(os.path.join(os.path.dirname(__file__), ".env"))
    
    result = {
        "api_key_configured": bool(ANTHROPIC_API_KEY),
        "api_key_length": len(ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else 0,
        "model": ANTHROPIC_MODEL,
        "client_initialized": anthropic_client is not None,
        "instructions_file_exists": os.path.exists(ANTHROPIC_INSTRUCTIONS_FILE) if ANTHROPIC_INSTRUCTIONS_FILE else False,
        "env_file_exists": env_file_exists,
        "env_key_in_system": bool(env_key_from_system),
        "test_status": "pending",
        "test_response": None,
        "error": None,
    }
    
    if not ANTHROPIC_API_KEY:
        result["test_status"] = "error"
        if env_key_from_system:
            result["error"] = "ANTHROPIC_API_KEY está en el sistema pero no se cargó correctamente"
        elif env_file_exists:
            result["error"] = "ANTHROPIC_API_KEY no configurada en backend/.env. Agrega: ANTHROPIC_API_KEY=sk-ant-api-..."
        else:
            result["error"] = "ANTHROPIC_API_KEY no configurada. En producción, configúrala en Railway/Render como variable de entorno. En desarrollo, crea backend/.env con: ANTHROPIC_API_KEY=sk-ant-api-..."
        return result
    
    try:
        # Prueba simple: enviar un mensaje de test
        test_message = "Responde solo con 'OK' si puedes leer esto."
        response = await send_llm_message(
            "Eres un asistente útil. Responde brevemente.",
            [{"type": "text", "text": test_message}]
        )
        result["test_status"] = "success"
        result["test_response"] = (response or "")[:200]  # Limitar a 200 chars
    except Exception as exc:
        result["test_status"] = "error"
        result["error"] = str(exc)
        import traceback
        result["traceback"] = traceback.format_exc()[:500]
    
    return result


@app.post("/api/test/analysis")
async def test_analysis():
    """Endpoint de prueba para probar el análisis clínico completo con Claude"""
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=400, detail="ANTHROPIC_API_KEY no configurada")
    
    # El system prompt se toma exclusivamente desde instrucciones_veterinarias.txt

    # Caso de prueba simulado
    user_message = """Analiza el siguiente caso clínico:

**Especie**: Perro

**Datos del Paciente**:
- Nombre Mascota: Max
- Edad: 5 años
- Raza: Labrador
- Peso: 25 kg
- Sexo: Macho
- Motivo Consulta: Vómito y diarrea desde hace 2 días
- Síntomas: Vómito amarillo, diarrea líquida, letargo, pérdida de apetito
- Última Comida: Hace 24 horas
- Vacunas Vigentes: Sí
- Medicamentos Actuales: Ninguno

**Observaciones Clínicas del Veterinario**:
Paciente deshidratado leve (5%), mucosas pálidas, temperatura 38.5°C, abdomen tenso pero no doloroso a la palpación. No hay evidencia de cuerpo extraño en radiografía.

Por favor, genera un análisis clínico completo."""

    try:
        analysis_text = await send_llm_message(
            [{"type": "text", "text": user_message}],
        )
        
        return {
            "status": "success",
            "analysis": analysis_text,
            "model": ANTHROPIC_MODEL,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] test_analysis: {str(e)}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error generando análisis: {str(e)}")


# ============================================
# AUTHENTICATION ENDPOINTS
# ============================================


@app.post("/api/auth/register")
async def register_veterinarian(vet: VeterinarianRegister):
    """Registra un nuevo veterinario"""

    # Verificar si ya existe por email
    existing, _ = get_profile_by_email(vet.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    # Verificar si ya existe por cédula
    existing_cedula, _ = get_profile_by_cedula(vet.cedula_profesional)
    if existing_cedula:
        raise HTTPException(status_code=400, detail="Cédula profesional ya registrada")

    # Verificar si es usuario de desarrollo (pasa verificación automáticamente)
    is_dev = is_dev_user(vet.email)
    initial_status = CEDULA_STATUS_VERIFIED if is_dev else CEDULA_STATUS_UNSUBMITTED
    
    # Crear veterinario
    # Nuevos usuarios reciben 3 consultas gratuitas (tipo premium) antes de verificar cuenta
    vet_data = {
        "id": str(uuid.uuid4()),
        "nombre": vet.nombre,
        "email": vet.email,
        "telefono": vet.telefono,
        "cedula_profesional": vet.cedula_profesional,
        "especialidad": vet.especialidad,
        "años_experiencia": vet.años_experiencia,
        "institucion": vet.institucion,
        "membership_type": None,  # Sin membresía hasta verificar cuenta
        "consultations_remaining": 3,  # 3 consultas gratuitas de prueba (tipo premium)
        "membership_expires": None,  # Sin expiración para consultas de prueba
        "created_at": datetime.now(timezone.utc).isoformat(),
        "two_factor_enabled": False,
        # Verificación de cédula (flujo obligatorio, excepto dev)
        "cedula_verification_status": initial_status,
        "cedula_document_url": None,
        "cedula_document_uploaded_at": datetime.now(timezone.utc).isoformat() if is_dev else None,
        "cedula_verification_checked_at": datetime.now(timezone.utc).isoformat() if is_dev else None,
        "cedula_verification_error": None,
        "cedula_sep_nombre": vet.nombre if is_dev else None,
        "cedula_sep_profesion": "Médico Veterinario Zootecnista" if is_dev else None,
        "cedula_skip_count": 0,  # Contador de veces que ha pospuesto la verificación
    }

    # Guardar en Supabase
    result, err = upsert_profile(vet_data)
    if err:
        raise HTTPException(status_code=500, detail=f"Error guardando perfil: {err}")

    return result or vet_data


@app.post("/api/auth/login")
async def login_veterinarian(credentials: VeterinarianLogin):
    """Login de veterinario"""

    # Buscar en Supabase
    veterinarian, err = get_profile_by_credentials(credentials.email, credentials.cedula_profesional)
    
    if err:
        print(f"Error buscando usuario: {err}")
    
    if not veterinarian:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Usuario de desarrollo: auto-verificar si no está verificado
    is_dev = is_dev_user(credentials.email)
    ced_status = (veterinarian.get("cedula_verification_status") or "").strip() or CEDULA_STATUS_UNSUBMITTED
    
    if is_dev and ced_status != CEDULA_STATUS_VERIFIED:
        # Auto-verificar usuario de desarrollo
        update_fields = {
            "cedula_verification_status": CEDULA_STATUS_VERIFIED,
            "cedula_verification_checked_at": datetime.now(timezone.utc).isoformat(),
            "cedula_sep_nombre": veterinarian.get("nombre") or "Carlos Hernandez",
            "cedula_sep_profesion": "Médico Veterinario Zootecnista",
        }
        if not veterinarian.get("cedula_document_uploaded_at"):
            update_fields["cedula_document_uploaded_at"] = datetime.now(timezone.utc).isoformat()
        err_upd = update_profile(veterinarian["id"], update_fields)
        if not err_upd:
            veterinarian.update(update_fields)
            ced_status = CEDULA_STATUS_VERIFIED  # Forzar status verificado
            print(f"[DEV] Auto-verificación aplicada para {credentials.email}")

    # Gating: manejar estados de verificación de cédula
    if ced_status != CEDULA_STATUS_VERIFIED:
        needs_upload = not bool(veterinarian.get("cedula_document_url"))
        skip_count = veterinarian.get("cedula_skip_count", 0)

        # Si falta el documento, siempre bloquear y mandar al flujo
        if needs_upload or ced_status == CEDULA_STATUS_UNSUBMITTED:
            msg = "Debes subir y verificar tu cédula profesional para continuar."
            return {
                "status": "requires_cedula_flow",
                "veterinarian_id": veterinarian.get("id"),
                "needs_upload": True,
                "verification_status": ced_status,
                "message": msg,
                "cedula_skip_count": skip_count,
                "can_skip": skip_count < 3,  # Permite saltarse hasta 3 veces
            }

        # Si fue rechazada, bloquear y pedir reintento (corregir nombre/cedula o re-subir)
        if ced_status == CEDULA_STATUS_REJECTED:
            msg = "Tu verificación de cédula fue rechazada. Revisa tus datos y vuelve a intentar."
            return {
                "status": "requires_cedula_flow",
                "veterinarian_id": veterinarian.get("id"),
                "needs_upload": False,
                "verification_status": ced_status,
                "message": msg,
                "cedula_skip_count": skip_count,
                "can_skip": skip_count < 3,  # Permite saltarse hasta 3 veces
            }

        # Si está PENDING pero ya hay documento, permitir login y dejar la cuenta en revisión.
        # Esto evita que el usuario quede bloqueado cuando SEP/DGP no responde.
        if ced_status == CEDULA_STATUS_PENDING and veterinarian.get("cedula_document_url"):
            veterinarian["cedula_verification_status"] = CEDULA_STATUS_PENDING
            veterinarian["cedula_verification_message"] = (
                "Tu cédula está en verificación. Puedes continuar mientras se procesa."
            )
        else:
            # Si el usuario tiene menos de 3 skips, permitir acceso temporal
            if skip_count < 3:
                # Permitir acceso temporal sin verificación
                veterinarian["cedula_verification_status"] = ced_status
                veterinarian["cedula_skip_count"] = skip_count
                # Continuar con el login normal (sin bloquear)
            else:
                # Fallback conservador: si es algún estado raro, mandar al flujo.
                return {
                    "status": "requires_cedula_flow",
                    "veterinarian_id": veterinarian.get("id"),
                    "needs_upload": needs_upload,
                    "verification_status": ced_status,
                    "message": "Necesitamos completar la verificación de cédula para continuar.",
                    "cedula_skip_count": skip_count,
                    "can_skip": False,  # Ya no puede saltarse
                }

    # Si tiene 2FA habilitado, generar código
    if veterinarian.get("two_factor_enabled", False):
        code = generate_2fa_code()
        nonce = generate_nonce()

        # Guardar código temporalmente
        await insert_one_db(
            "temp_2fa_codes",
            {
                "nonce": nonce,
                "code": code,
                "veterinarian_id": veterinarian["id"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (
                    datetime.now(timezone.utc) + timedelta(minutes=10)
                ).isoformat(),
            },
        )

        print(f"Codigo 2FA para {credentials.email}: {code}")

        return {
            "status": "pending_2fa",
            "nonce": nonce,
            "message": "Se ha enviado un código de verificación (revisa la consola del servidor)",
        }

    # Remover _id de MongoDB si existe
    if isinstance(veterinarian, dict):
        veterinarian.pop("_id", None)
    return veterinarian


@app.post("/api/auth/verify-2fa")
async def verify_2fa(verification: TwoFactorVerify):
    """Verifica código 2FA"""

    temp_code = await find_one_db("temp_2fa_codes", {"nonce": verification.nonce})

    if not temp_code:
        raise HTTPException(status_code=404, detail="Código no encontrado o expirado")

    # Verificar expiración
    expires_at = datetime.fromisoformat(temp_code["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=401, detail="Código expirado")

    # Verificar código
    if temp_code["code"] != verification.code:
        raise HTTPException(status_code=401, detail="Código inválido")

    # Obtener veterinario de Supabase
    veterinarian, err = get_profile(temp_code["veterinarian_id"])

    if err or not veterinarian:
        raise HTTPException(status_code=404, detail="Veterinario no encontrado")

    return veterinarian


@app.get("/api/auth/profile")
async def get_current_profile(x_veterinarian_id: str = Header(None)):
    """Obtiene el perfil actualizado del veterinario autenticado"""
    if not x_veterinarian_id:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    profile, err = get_profile(x_veterinarian_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error obteniendo perfil: {err}")
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    
    # Remover _id si existe
    if isinstance(profile, dict):
        profile.pop("_id", None)
    
    return profile


# ============================================
# CÉDULA PROFESIONAL ENDPOINTS
# ============================================

def _name_matches(expected: str, actual: str) -> bool:
    e = _norm_text(expected)
    a = _norm_text(actual)
    if not e or not a:
        return False
    if e == a:
        return True
    e_tokens = {t for t in e.split(" ") if t}
    a_tokens = {t for t in a.split(" ") if t}
    # tolerante a orden y a tokens faltantes (p.ej. sin segundo nombre)
    return e_tokens.issubset(a_tokens) or a_tokens.issubset(e_tokens)


@app.post("/api/cedula/upload", response_model=CedulaUploadResponse)
async def upload_cedula_document(
    file: UploadFile = File(...),
    x_veterinarian_id: str = Header(None),
):
    if not x_veterinarian_id:
        raise HTTPException(status_code=401, detail="No autenticado")

    media_type = (file.content_type or "").strip().lower()
    if media_type not in ALLOWED_CEDULA_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Tipo de archivo no permitido. Sube PDF, JPG o PNG.",
        )

    max_bytes = DEFAULT_CEDULA_MAX_BYTES
    try:
        env_max = os.getenv("CEDULA_MAX_BYTES", "").strip()
        if env_max:
            max_bytes = int(env_max)
    except Exception:
        max_bytes = DEFAULT_CEDULA_MAX_BYTES

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande")

    ext = ALLOWED_CEDULA_CONTENT_TYPES[media_type]
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = f"user-{x_veterinarian_id}/cedula/cedula-{ts}{ext}"

    public_url, err_up = upload_bytes_to_storage("uploads", path, data, media_type)
    if err_up or not public_url:
        raise HTTPException(status_code=500, detail=f"Error subiendo archivo: {err_up or 'desconocido'}")

    now = datetime.now(timezone.utc).isoformat()
    err = update_profile(
        x_veterinarian_id,
        {
            "cedula_document_url": public_url,
            "cedula_document_uploaded_at": now,
            "cedula_verification_status": CEDULA_STATUS_PENDING,
            "cedula_verification_error": None,
        },
    )
    if err:
        raise HTTPException(status_code=500, detail=f"Error actualizando perfil: {err}")

    return CedulaUploadResponse(
        status="ok",
        cedula_document_url=public_url,
        message="Documento recibido. Procede a verificar la cédula.",
    )


@app.post("/api/cedula/verify", response_model=CedulaVerifyResponse)
async def verify_cedula(
    payload: CedulaVerifyRequest,
    x_veterinarian_id: str = Header(None),
):
    vet_id = (payload.veterinarian_id or x_veterinarian_id or "").strip()
    if not vet_id:
        raise HTTPException(status_code=401, detail="No autenticado")

    profile, err = get_profile(vet_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error perfil: {err}")
    if not profile:
        raise HTTPException(status_code=404, detail="Veterinario no encontrado")

    cedula = (payload.cedula_profesional or "").strip()
    if not cedula:
        raise HTTPException(status_code=400, detail="Cédula requerida")

    if (profile.get("cedula_profesional") or "").strip() != cedula:
        raise HTTPException(status_code=400, detail="La cédula no coincide con el perfil")

    expected_name = (payload.expected_nombre or profile.get("nombre") or "").strip()
    if not expected_name:
        raise HTTPException(status_code=400, detail="Nombre requerido para validar")

    # Usuario de desarrollo: auto-verificar sin scraping
    is_dev = is_dev_user(profile.get("email") or "")
    if is_dev:
        now = datetime.now(timezone.utc).isoformat()
        err_upd = update_profile(
            vet_id,
            {
                "cedula_sep_nombre": expected_name,
                "cedula_sep_profesion": "Médico Veterinario Zootecnista",
                "cedula_verification_status": CEDULA_STATUS_VERIFIED,
                "cedula_verification_checked_at": now,
                "cedula_verification_error": None,
            },
        )
        if err_upd:
            raise HTTPException(status_code=500, detail=f"Error actualizando perfil: {err_upd}")
        return CedulaVerifyResponse(
            status="ok",
            verification_status=CEDULA_STATUS_VERIFIED,
            sep_nombre=expected_name,
            sep_profesion="Médico Veterinario Zootecnista",
            message="Cédula verificada automáticamente (usuario de desarrollo).",
        )

    # Consultar SEP/DGP (con reintentos)
    try:
        sep = await _sep_dgp_lookup_with_retries(cedula, attempts=3)
    except Exception as exc:
        now = datetime.now(timezone.utc).isoformat()
        update_profile(
            vet_id,
            {
                "cedula_verification_status": CEDULA_STATUS_PENDING,
                "cedula_verification_checked_at": now,
                "cedula_verification_error": str(exc),
            },
        )
        return CedulaVerifyResponse(
            status="ok",
            verification_status=CEDULA_STATUS_PENDING,
            message="No se pudo validar automáticamente en este momento. Intenta más tarde.",
        )

    sep_nombre = (sep.get("nombre") or "").strip()
    sep_profesion = (sep.get("profesion") or "").strip()
    now = datetime.now(timezone.utc).isoformat()

    if not sep_nombre and not sep_profesion:
        update_profile(
            vet_id,
            {
                "cedula_verification_status": CEDULA_STATUS_PENDING,
                "cedula_verification_checked_at": now,
                "cedula_verification_error": "Sin datos en respuesta de SEP/DGP",
            },
        )
        return CedulaVerifyResponse(
            status="ok",
            verification_status=CEDULA_STATUS_PENDING,
            message="No fue posible obtener datos de SEP/DGP. Intenta más tarde.",
        )

    name_ok = _name_matches(expected_name, sep_nombre) if sep_nombre else False
    prof_ok = _profession_is_vet(sep_profesion) if sep_profesion else False

    if name_ok and prof_ok:
        verification_status = CEDULA_STATUS_VERIFIED
        msg = "Cédula verificada correctamente."
        err_txt = None
    else:
        verification_status = CEDULA_STATUS_REJECTED
        reasons = []
        if not name_ok:
            reasons.append("el nombre no coincide")
        if not prof_ok:
            reasons.append("la profesión no corresponde a MVZ/Veterinaria")
        msg = "Validación rechazada: " + ", ".join(reasons) + "."
        err_txt = msg

    err_upd = update_profile(
        vet_id,
        {
            "cedula_sep_nombre": sep_nombre or None,
            "cedula_sep_profesion": sep_profesion or None,
            "cedula_verification_status": verification_status,
            "cedula_verification_checked_at": now,
            "cedula_verification_error": err_txt,
        },
    )
    if err_upd:
        raise HTTPException(status_code=500, detail=f"Error actualizando perfil: {err_upd}")

    return CedulaVerifyResponse(
        status="ok",
        verification_status=verification_status,
        sep_nombre=sep_nombre or None,
        sep_profesion=sep_profesion or None,
        message=msg,
    )


@app.post("/api/cedula/skip")
async def skip_cedula_verification(
    x_veterinarian_id: str = Header(None),
):
    """Permite al usuario posponer la verificación de cédula (máximo 3 veces)"""
    if not x_veterinarian_id:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    profile, err = get_profile(x_veterinarian_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error perfil: {err}")
    if not profile:
        raise HTTPException(status_code=404, detail="Veterinario no encontrado")
    
    skip_count = profile.get("cedula_skip_count", 0)
    
    # Verificar que no haya excedido el límite
    if skip_count >= 3:
        raise HTTPException(
            status_code=403,
            detail="Has alcanzado el límite de 3 posposiciones. Debes verificar tu cédula para continuar."
        )
    
    # Incrementar contador
    new_skip_count = skip_count + 1
    err_upd = update_profile(
        x_veterinarian_id,
        {
            "cedula_skip_count": new_skip_count,
        },
    )
    
    if err_upd:
        raise HTTPException(status_code=500, detail=f"Error actualizando perfil: {err_upd}")
    
    return {
        "status": "ok",
        "cedula_skip_count": new_skip_count,
        "remaining_skips": 3 - new_skip_count,
        "message": f"Puedes verificar tu cédula después. Te quedan {3 - new_skip_count} posposiciones restantes." if new_skip_count < 3 else "Esta fue tu última posposición. Debes verificar tu cédula la próxima vez.",
    }


# ============================================
# ANIMAL CATEGORIES
# ============================================


@app.get("/api/animal-categories")
async def get_animal_categories(x_veterinarian_id: str = Header(None)):
    """Obtiene categorías de animales filtradas según membresía"""
    all_categories = [{"id": key, **value} for key, value in ANIMAL_CATEGORIES.items()]
    for cat in all_categories:
        if cat.get("id") == "hamsters":
            cat["icon"] = "🐭"
        if cat.get("id") == "cuyos":
            cat["icon"] = "🐹"

    # Si no hay veterinarian_id, retornar todas (para compatibilidad)
    if not x_veterinarian_id:
        return {"categories": all_categories}

    # Obtener membresía del veterinario
    profile, err = get_profile(x_veterinarian_id)
    if err or not profile:
        # Si no se puede obtener el perfil, retornar todas (fallback)
        return {"categories": all_categories}

    membership_type = profile.get("membership_type")
    remaining = profile.get("consultations_remaining", 0)
    
    # Si tiene consultas de prueba (sin membership_type pero con consultas), dar acceso premium
    has_trial_consultations = not membership_type and remaining > 0
    
    if membership_type:
        membership_type = membership_type.lower()
    else:
        membership_type = "trial" if has_trial_consultations else "basic"

    # Filtrar categorías según membresía
    if membership_type == "basic":
        # Básica: solo perros y gatos
        filtered_categories = [
            cat for cat in all_categories
            if cat.get("id") in ["perros", "gatos"]
        ]
    elif membership_type in ["professional", "premium", "trial"]:
        # Profesional, Premium y Trial (consultas de prueba): todas las categorías
        filtered_categories = all_categories
    else:
        # Por defecto, solo básicas
        filtered_categories = [
            cat for cat in all_categories
            if cat.get("id") in ["perros", "gatos"]
        ]

    return {"categories": filtered_categories}


# ============================================
# CONSULTATIONS
# ============================================


def _serialize_consultation(row: Dict[str, Any]) -> Dict[str, Any]:
    payload = row.get("payload") or {}
    form_data = payload.get("form_data") or {}
    
    # Extraer campos de form_data al nivel superior para compatibilidad con el frontend
    result = {
        "id": row.get("id"),
        "veterinarian_id": row.get("user_id"),
        "category": payload.get("category"),
        "especie": payload.get("category"),  # Alias para compatibilidad
        "form_data": form_data,
        "detalle_paciente": payload.get("detalle_paciente"),
        "analysis": row.get("analysis"),
        "status": row.get("status"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "rating": row.get("rating"),
        # Campos aplanados de form_data para acceso directo
        "nombre_mascota": form_data.get("nombre_mascota"),
        "nombre_dueño": form_data.get("nombre_dueño") or form_data.get("nombre_dueno"),
        "raza": form_data.get("raza"),
        "edad": form_data.get("edad"),
        "sexo": form_data.get("sexo"),
        "peso": form_data.get("peso"),
        "motivo_consulta": form_data.get("motivo_consulta"),
        "sintomas": form_data.get("sintomas"),
        "estado_reproductivo": form_data.get("estado_reproductivo"),
        "condicion_corporal": form_data.get("condicion_corporal"),
        "alimentacion": form_data.get("alimentacion") or form_data.get("dieta"),
        "vacunas_vigentes": form_data.get("vacunas_vigentes"),
    }
    return result


@app.post("/api/consultations")
async def create_consultation(payload: ConsultationStageOne):
    """Crea una consulta en etapa 1 (anamnesis) usando Supabase"""

    vet_id = payload.veterinarian_id
    # Asegurar perfil
    profile, err = get_profile(vet_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error perfil: {err}")

    if not profile:
        if vet_id.startswith("dev-"):
            seed_profile = {
                "id": vet_id,
                "email": f"{vet_id}@example.com",
                "nombre": "Desarrollador",
                "membership_type": "premium",
                "consultations_remaining": 150,
                "membership_expires": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
            }
            _, err_up = upsert_profile(seed_profile)
            if err_up:
                raise HTTPException(status_code=500, detail=f"Error creando perfil: {err_up}")
            profile = seed_profile
        else:
            # Usuario sin cuenta - redirigir al registro
            raise HTTPException(
                status_code=401,
                detail="No tienes una cuenta. Por favor, regístrate primero para usar el servicio."
            )

    # Verificar membresía o consultas de prueba
    membership_type = profile.get("membership_type")
    remaining = profile.get("consultations_remaining", 0)
    
    # Validar que usuarios sin membresía no tengan más de 3 consultas
    validate_trial_consultations_limit(membership_type, remaining)
    
    # Si tiene consultas de prueba (remaining > 0 pero sin membership_type), permitir como premium
    has_trial_consultations = not membership_type and remaining > 0
    
    # NO dar consultas automáticamente - solo se dan al registrarse
    # Si no tiene membresía ni consultas, redirigir a comprar membresía
    if not membership_type and not has_trial_consultations:
        raise HTTPException(
            status_code=403,
            detail="Has agotado tus 3 consultas de prueba. Por favor, suscríbete a un plan de membresía para continuar usando el servicio."
        )

    # Si tiene membresía, verificar que no esté expirada
    if membership_type:
        membership_type = membership_type.lower()
        membership_expires = profile.get("membership_expires")
        if membership_expires:
            try:
                if isinstance(membership_expires, str):
                    expiry = datetime.fromisoformat(membership_expires.replace('Z', '+00:00'))
                else:
                    expiry = membership_expires
                if expiry < datetime.now(timezone.utc):
                    raise HTTPException(
                        status_code=403,
                        detail="Tu membresía ha expirado. Por favor, renueva tu suscripción para continuar."
                    )
            except (ValueError, TypeError) as e:
                # Si hay error parseando la fecha, continuar pero loguear
                print(f"[WARN] Error parseando membership_expires para {vet_id}: {e}")

    # Verificar consultas disponibles
    # Si tiene consultas de prueba, tratarlas como premium (sin restricciones)
    if has_trial_consultations:
        # Usuario con consultas de prueba: permitir como premium
        if remaining <= 0:
            raise HTTPException(
                status_code=403,
                detail="Has agotado tus 3 consultas de prueba. Por favor, suscríbete a un plan de membresía para continuar usando el servicio."
            )
    elif membership_type != "premium":
        # Usuario con membresía pero no premium: verificar consultas
        if remaining <= 0:
            raise HTTPException(
                status_code=403,
                detail="No tienes consultas disponibles. Por favor, renueva tu membresía o compra créditos adicionales."
            )

    consultation_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    payload_json = {
        "category": payload.category,
        "form_data": payload.consultation_data,
    }

    new_row = {
        "id": consultation_id,
        "user_id": vet_id,
        "payload": payload_json,
        "status": "draft",
        "created_at": created_at,
    }

    inserted, err_ins = insert_consultation(new_row)
    if err_ins:
        raise HTTPException(status_code=500, detail=f"Error guardando consulta: {err_ins}")

    # Descontar crédito si no es premium (las consultas de prueba también se descuentan)
    # Si tiene consultas de prueba (sin membership_type), tratarlas como premium pero descontar
    if has_trial_consultations or (membership_type and membership_type != "premium"):
        new_remaining = max(0, remaining - 1)
        _, err_prof = upsert_profile(
            {
                "id": vet_id,
                "consultations_remaining": new_remaining,
            }
        )
        if err_prof:
            # No abortamos la consulta ya creada; solo avisamos
            print(f"[WARN] No se pudo actualizar remaining: {err_prof}")

    return _serialize_consultation(inserted or new_row)


@app.get("/api/stripe/config")
async def get_stripe_config():
    """Obtiene la configuración de Stripe (clave pública)"""
    return {
        "publishable_key": STRIPE_PUBLISHABLE_KEY if STRIPE_PUBLISHABLE_KEY else None,
        "publishable_key_configured": bool(STRIPE_PUBLISHABLE_KEY),
        "secret_key_configured": bool(STRIPE_API_KEY),
        "webhook_secret_configured": bool(STRIPE_WEBHOOK_SECRET),
        "stripe_sdk_available": stripe is not None,
        "mode": "test" if STRIPE_API_KEY and "sk_test" in STRIPE_API_KEY else ("live" if STRIPE_API_KEY and "sk_live" in STRIPE_API_KEY else None),
    }


@app.get("/api/config/diagnostics")
async def get_config_diagnostics():
    """Endpoint de diagnóstico para verificar todas las configuraciones"""
    env_file_path = os.path.join(os.path.dirname(__file__), ".env")
    env_file_exists = os.path.exists(env_file_path)
    
    # Verificar variables directamente del sistema
    anthropic_from_system = os.getenv("ANTHROPIC_API_KEY", "")
    stripe_secret_from_system = os.getenv("STRIPE_API_KEY", "")
    stripe_public_from_system = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    
    return {
        "environment": {
            "is_production": os.getenv("RAILWAY_ENVIRONMENT") is not None or os.getenv("RENDER") is not None,
            "env_file_exists": env_file_exists,
            "env_file_path": env_file_path if env_file_exists else None,
        },
        "anthropic": {
            "configured": bool(ANTHROPIC_API_KEY),
            "length": len(ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else 0,
            "in_system_env": bool(anthropic_from_system),
            "in_loaded_env": bool(ANTHROPIC_API_KEY),
            "client_initialized": anthropic_client is not None,
            "model": ANTHROPIC_MODEL,
        },
        "stripe": {
            "secret_configured": bool(STRIPE_API_KEY),
            "secret_in_system": bool(stripe_secret_from_system),
            "public_configured": bool(STRIPE_PUBLISHABLE_KEY),
            "public_in_system": bool(stripe_public_from_system),
            "webhook_configured": bool(STRIPE_WEBHOOK_SECRET),
            "sdk_available": stripe is not None,
        },
        "recommendations": []
    }


@app.get("/api/consultations")
async def get_consultations(x_veterinarian_id: str = Header(None), limit: int = 50):
    """Obtiene consultas del veterinario desde Supabase"""

    if not x_veterinarian_id:
        raise HTTPException(status_code=401, detail="No autenticado")

    rows, err = list_consultations(x_veterinarian_id, limit=limit)
    if err:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err}")
    return {"consultations": [_serialize_consultation(r) for r in rows]}


@app.get("/api/consultations/{veterinarian_id}/history")
async def get_consultation_history(veterinarian_id: str, limit: int = 50):
    """Historial de consultas del veterinario (Supabase)"""

    rows, err = list_consultations(veterinarian_id, limit=limit)
    if err:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err}")
    return {"consultations": [_serialize_consultation(r) for r in rows]}


@app.put("/api/consultations/{consultation_id}/payload")
async def update_consultation_payload(
    consultation_id: str,
    payload: ConsultationPayloadUpdate,
    x_veterinarian_id: str = Header(None),
):
    """Actualiza payload (form_data/detalle_paciente) de una consulta (Supabase)."""
    if not x_veterinarian_id:
        raise HTTPException(status_code=401, detail="No autenticado")

    consultation, err = get_consultation_by_id(consultation_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err}")
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")

    if (consultation.get("user_id") or "").strip() != x_veterinarian_id.strip():
        raise HTTPException(status_code=403, detail="No autorizado para modificar esta consulta")

    current_payload = consultation.get("payload") or {}
    form_data = payload.form_data if payload.form_data is not None else current_payload.get("form_data")
    category = payload.category if payload.category is not None else current_payload.get("category")
    detalle = (
        payload.detalle_paciente
        if payload.detalle_paciente is not None
        else current_payload.get("detalle_paciente")
    )

    updated_payload = {
        "category": category,
        "form_data": form_data or {},
        "detalle_paciente": detalle,
    }

    err_upd = update_consultation(
        consultation_id,
        {
            "payload": updated_payload,
        },
    )
    if err_upd:
        raise HTTPException(status_code=500, detail=f"Error actualizando consulta: {err_upd}")

    # Releer para regresar el estado más reciente
    fresh, err2 = get_consultation_by_id(consultation_id)
    if err2:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err2}")
    return _serialize_consultation(fresh or consultation)


@app.get("/api/consultation/{consultation_id}")
async def get_consultation(consultation_id: str):
    """Obtiene una consulta específica (Supabase)"""

    cons, err = get_consultation_by_id(consultation_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err}")
    if not cons:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    return _serialize_consultation(cons)


@app.put("/api/consultations/{consultation_id}/observations")
async def update_consultation_observations(
    consultation_id: str, observations: ObservationUpdate
):
    """Actualiza la consulta con las observaciones del paso 2"""

    cons, err = get_consultation_by_id(consultation_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err}")
    if not cons:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")

    payload = cons.get("payload") or {}
    payload["detalle_paciente"] = observations.detalle_paciente
    err_upd = update_consultation(
        consultation_id,
        {
            "payload": payload,
            "status": "in_progress",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    if err_upd:
        raise HTTPException(status_code=500, detail=f"Error actualizando: {err_upd}")

    return {"message": "Observaciones guardadas"}


@app.post("/api/consultations/{consultation_id}/analyze")
async def analyze_consultation(consultation_id: str, x_veterinarian_id: str = Header(None)):
    """Genera un análisis clínico usando IA (Claude) - Solo disponible para Premium"""

    consultation, err = get_consultation_by_id(consultation_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err}")
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")

    # Verificar que el usuario tenga membresía Premium o consultas de prueba
    if x_veterinarian_id:
        profile, err = get_profile(x_veterinarian_id)
        if err or not profile:
            raise HTTPException(
                status_code=403,
                detail="No se pudo verificar tu membresía. Los análisis avanzados solo están disponibles para miembros Premium."
            )
        
        membership_type = profile.get("membership_type")
        remaining = profile.get("consultations_remaining", 0)
        
        # Si tiene consultas de prueba (sin membership_type pero con consultas), permitir como premium
        has_trial_consultations = not membership_type and remaining > 0
        
        if membership_type:
            membership_type = membership_type.lower()
        else:
            membership_type = "trial" if has_trial_consultations else "basic"
        
        if membership_type not in ["premium", "trial"]:
            raise HTTPException(
                status_code=403,
                detail=f"Los análisis avanzados solo están disponibles para miembros Premium. Tu plan actual es: {membership_type.capitalize()}. Por favor, actualiza tu membresía para acceder a esta función."
            )
    else:
        raise HTTPException(
            status_code=401,
            detail="Se requiere autenticación para usar análisis avanzados."
        )

    # Obtener datos de la consulta
    payload = consultation.get("payload") or {}
    category = payload.get("category", "")
    form_data = payload.get("form_data", {})
    detalle_paciente = payload.get("detalle_paciente", "")
    
    # El system prompt se toma exclusivamente desde instrucciones_veterinarias.txt

    # Construir el mensaje con los datos del paciente
    patient_info = []
    for key, value in form_data.items():
        if value and value != "NO" and value != "":
            patient_info.append(f"- {key.replace('_', ' ').title()}: {value}")
    
    user_message = f"""Analiza el siguiente caso clínico:

**Especie**: {category.capitalize()}

**Datos del Paciente**:
{chr(10).join(patient_info)}

**Observaciones Clínicas del Veterinario**:
{detalle_paciente or 'No se proporcionaron observaciones adicionales.'}

Por favor, genera un análisis clínico completo."""

    try:
        analysis_text = await send_llm_message(
            [
                {
                    "type": "text",
                    "text": user_message,
                }
            ],
        )

        err_upd = update_consultation(
            consultation_id,
            {
                "analysis": analysis_text,
                "status": "completed",
            },
        )
        if err_upd:
            raise HTTPException(status_code=500, detail=f"Error guardando análisis: {err_upd}")

        return {"analysis": analysis_text}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        import traceback
        print(f"[ERROR] analyze_consultation: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generando análisis: {str(e)}")


@app.put("/api/consultations/{consultation_id}/rating")
async def set_consultation_rating(
    consultation_id: str, payload: ConsultationRatingUpdate
):
    """Guarda la calificación (1-5) de una consulta"""

    consultation, err = get_consultation_by_id(consultation_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err}")
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")

    err_upd = update_consultation(
        consultation_id,
        {
            "rating": int(payload.rating),
            "rated_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    if err_upd:
        raise HTTPException(status_code=500, detail=f"Error guardando rating: {err_upd}")

    return {"consultation_id": consultation_id, "rating": int(payload.rating)}


@app.get("/api/consultations/stats")
async def get_consultation_stats(x_veterinarian_id: str = Header(None)):
    """Obtiene estadísticas de consultas"""

    if not x_veterinarian_id:
        raise HTTPException(status_code=401, detail="No autenticado")

    total, err = count_consultations_by_user(x_veterinarian_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err}")

    # Consultas del mes actual (approx)
    rows, err_rows = list_consultations(x_veterinarian_id, limit=500)
    if err_rows:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err_rows}")
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = 0
    for c in rows:
        created_at = c.get("created_at")
        try:
            if created_at and datetime.fromisoformat(created_at) >= month_start:
                this_month += 1
        except Exception:
            continue

    return {"total": total, "this_month": this_month}


# ============================================
# MEMBERSHIP
# ============================================


@app.get("/api/membership/packages")
async def get_membership_packages():
    """Obtiene paquetes de membresía"""
    return {"packages": MEMBERSHIP_PACKAGES}


@app.get("/api/consultations/credit-packages")
async def get_consultation_credit_packages():
    """Obtiene paquetes de recarga de consultas"""
    return {"packages": CONSULTATION_CREDIT_PACKAGES}


@app.post("/api/payments/checkout/session")
async def create_checkout_session(
    payment_request: PaymentRequest,
    request: Request,
    x_veterinarian_id: str = Header(None, alias="x-veterinarian-id"),
):
    """Crea sesión de pago (simulada) - Requiere autenticación"""

    # Debug: Ver todos los headers recibidos
    print(f"[DEBUG] Headers recibidos: {dict(request.headers)}")
    print(f"[DEBUG] x-veterinarian-id desde Header(): {x_veterinarian_id}")
    
    # Intentar obtener el header directamente si no viene por Header()
    if not x_veterinarian_id:
        x_veterinarian_id = request.headers.get("x-veterinarian-id") or request.headers.get("X-Veterinarian-Id")
        print(f"[DEBUG] x-veterinarian-id desde request.headers: {x_veterinarian_id}")

    # Validar que el usuario esté autenticado
    if not x_veterinarian_id:
        raise HTTPException(
            status_code=401,
            detail="Debes estar registrado e iniciar sesión para contratar una membresía"
        )
    
    # Verificar que el usuario exista
    profile, err = get_profile(x_veterinarian_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error verificando perfil: {err}")
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado. Por favor, regístrate primero."
        )

    package_key = payment_request.package or payment_request.package_id
    if not package_key:
        raise HTTPException(status_code=400, detail="Paquete inválido")

    package = MEMBERSHIP_PACKAGES.get(package_key)
    if not package:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    price = package[f"price_{payment_request.billing_cycle}"]
    session_id = f"sim_{uuid.uuid4()}"

    # Simular sesión de pago
    transaction_data = {
        "session_id": session_id,
        "type": "membership",
        "package": package_key,
        "billing_cycle": payment_request.billing_cycle,
        "amount": price,
        "currency": package["currency"],
        "status": "open",
        "payment_status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "veterinarian_id": payment_request.veterinarian_id,
    }

    # Verificar si Stripe está disponible
    if not stripe:
        raise HTTPException(
            status_code=500,
            detail="Stripe SDK no está disponible. Por favor, contacta al administrador."
        )
    
    if not STRIPE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="STRIPE_API_KEY no está configurada. Por favor, contacta al administrador."
        )
    
    stripe.api_key = STRIPE_API_KEY
    print(f"[DEBUG] Creando sesión Stripe para paquete: {package_key}, precio: {price}, ciclo: {payment_request.billing_cycle}")
    print(f"[DEBUG] Veterinarian ID: {x_veterinarian_id}")
    print(f"[DEBUG] Stripe API Key configurada: {STRIPE_API_KEY[:20]}...")
    
    try:
        success_url = (
            f"{payment_request.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        )
        cancel_url = f"{payment_request.origin_url}/membership"
        print(f"[DEBUG] Success URL: {success_url}")
        print(f"[DEBUG] Cancel URL: {cancel_url}")
        session = stripe.checkout.Session.create(
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            line_items=[
                {
                    "price_data": {
                        "currency": package["currency"],
                        "product_data": {
                            "name": f"Membresía {package['name']}",
                        },
                        "unit_amount": int(round(price * 100)),
                    },
                    "quantity": 1,
                }
            ],
            metadata={
                "type": "membership",
                "package": package_key,
                "billing_cycle": payment_request.billing_cycle,
                "veterinarian_id": payment_request.veterinarian_id or "",
                "consultations": str(package.get("consultations", 0)),
            },
        )

        session_id = session.id
        transaction_data["session_id"] = session_id
        transaction_data["stripe"] = True
        transaction, err = insert_payment_transaction(transaction_data)
        if err:
            raise HTTPException(status_code=500, detail=f"Error guardando transacción: {err}")

        return {"checkout_url": session.url, "session_id": session_id}
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Error creando sesión Stripe: {str(e)}")
        print(f"[ERROR] Traceback completo:\n{error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creando sesión de pago: {str(e)}"
        )

    transaction, err = insert_payment_transaction(transaction_data)
    if err:
        raise HTTPException(status_code=500, detail=f"Error guardando transacción: {err}")

    checkout_url = f"{payment_request.origin_url}/payment-success?session_id={session_id}"

    return {
        "checkout_url": checkout_url,
        "session_id": session_id,
        "message": "Pago simulado - En producción, esto usaría Stripe",
    }


@app.post("/api/admin/give-trial-consultations")
async def give_trial_consultations_to_all(
    x_veterinarian_id: str = Header(None),
):
    """
    Endpoint administrativo para dar 3 consultas premium a todos los usuarios que no las tengan.
    Requiere autenticación (puedes agregar validación de admin si lo deseas).
    """
    try:
        from supabase_client import get_supabase_client
        client = get_supabase_client()
        
        # Obtener todos los perfiles
        response = client.table("profiles").select("id, consultations_remaining, membership_type").execute()
        
        if not response.data:
            return {"message": "No se encontraron usuarios", "updated": 0}
        
        updated_count = 0
        for profile in response.data:
            profile_id = profile.get("id")
            membership_type = profile.get("membership_type")
            remaining = profile.get("consultations_remaining", 0)
            
            # Solo actualizar usuarios que no tengan membresía y tengan 0 o menos consultas
            if not membership_type and remaining <= 0:
                try:
                    update_response = client.table("profiles").update({
                        "consultations_remaining": 3
                    }).eq("id", profile_id).execute()
                    
                    if update_response.data:
                        updated_count += 1
                        print(f"[INFO] Se dieron 3 consultas premium a {profile_id}")
                except Exception as e:
                    print(f"[ERROR] Error actualizando {profile_id}: {e}")
        
        return {
            "message": f"Se dieron 3 consultas premium a {updated_count} usuarios",
            "updated": updated_count,
            "total_users": len(response.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando usuarios: {str(e)}")


@app.post("/api/payments/stripe/webhook")
async def stripe_webhook(request: Request):
    """Webhook de Stripe para confirmar pagos"""

    if not stripe:
        raise HTTPException(status_code=500, detail="Stripe SDK no disponible")

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="STRIPE_WEBHOOK_SECRET no configurado")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=sig_header, secret=STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook inválido: {str(e)}")

    event_type = event.get("type")
    if event_type not in (
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
    ):
        return {"received": True}

    session = event.get("data", {}).get("object", {}) or {}
    session_id = session.get("id")
    if not session_id:
        return {"received": True}

    payment_status = session.get("payment_status")
    status_value = session.get("status")
    metadata = session.get("metadata") or {}

    transaction, err = get_payment_transaction_by_session_id(session_id)
    if err:
        print(f"[ERROR] Error obteniendo transacción: {err}")
        return {"received": True}
    
    if not transaction:
        transaction_data = {
            "session_id": session_id,
            "type": metadata.get("type"),
            "package": metadata.get("package"),
            "package_id": metadata.get("package_id"),
            "billing_cycle": metadata.get("billing_cycle"),
            "credits": int(metadata.get("credits") or 0) if metadata.get("credits") else None,
            "currency": session.get("currency"),
            "amount": (session.get("amount_total") or 0) / 100 if session.get("amount_total") else None,
            "status": status_value,
            "payment_status": payment_status,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "veterinarian_id": metadata.get("veterinarian_id"),
            "stripe": True,
        }
        transaction, err = insert_payment_transaction(transaction_data)
        if err:
            print(f"[ERROR] Error insertando transacción: {err}")
            return {"received": True}
    else:
        err = update_payment_transaction(
            session_id,
            {
                "status": status_value,
                "payment_status": payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        if err:
            print(f"[ERROR] Error actualizando transacción: {err}")

    if payment_status != "paid":
        return {"received": True}

    transaction_type = transaction.get("type") or metadata.get("type")
    veterinarian_id = (
        transaction.get("veterinarian_id")
        or metadata.get("veterinarian_id")
        or ""
    ).strip()

    if transaction_type == "consultation_credits" and veterinarian_id:
        if not transaction.get("credits_applied"):
            credits = int(transaction.get("credits") or metadata.get("credits") or 0)
            veterinarian, err = get_profile(veterinarian_id)
            if veterinarian and not err:
                membership_type = veterinarian.get("membership_type")
                current = int(veterinarian.get("consultations_remaining") or 0)
                
                # Validar límite para usuarios sin membresía
                if not membership_type:
                    if current + credits > 3:
                        # Limitar a 3 máximo
                        new_remaining = 3
                        print(f"[WARN] Usuario sin membresía limitado a 3 consultas. Tenía {current}, intentó agregar {credits}")
                    else:
                        new_remaining = current + credits
                else:
                    new_remaining = current + credits
                
                err_upd = update_profile(
                    veterinarian_id,
                    {"consultations_remaining": new_remaining},
                )
                if err_upd:
                    print(f"[ERROR] Error actualizando perfil: {err_upd}")
                else:
                    err_tx = update_payment_transaction(
                        session_id,
                        {
                            "credits_applied": True,
                            "credits_applied_at": datetime.now(timezone.utc).isoformat(),
                            "consultations_remaining_after": new_remaining,
                        },
                    )
                    if err_tx:
                        print(f"[ERROR] Error actualizando transacción: {err_tx}")

    if transaction_type == "membership" and veterinarian_id:
        if not transaction.get("membership_activated"):
            package_key = (transaction.get("package") or metadata.get("package") or "").strip()
            billing_cycle = (transaction.get("billing_cycle") or metadata.get("billing_cycle") or "monthly").strip()
            package = MEMBERSHIP_PACKAGES.get(package_key)
            if package:
                consultations = package["consultations"]
                days = 30 if billing_cycle == "monthly" else 365
                expires = datetime.now(timezone.utc) + timedelta(days=days)
                await update_one_db(
                    "veterinarians",
                    {"id": veterinarian_id},
                    {
                        "membership_type": package_key,
                        "consultations_remaining": consultations,
                        "membership_expires": expires.isoformat(),
                    },
                )
                await update_one_db(
                    "payment_transactions",
                    {"session_id": session_id},
                    {
                        "membership_activated": True,
                        "membership_activated_at": datetime.now(timezone.utc).isoformat(),
                    },
                )

    return {"received": True}


@app.post("/api/payments/consultations/checkout/session")
async def create_consultations_checkout_session(payload: ConsultationCreditsPurchaseRequest):
    """Crea sesión de pago para recarga de consultas"""

    package = CONSULTATION_CREDIT_PACKAGES.get(payload.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    veterinarian, err = get_profile(payload.veterinarian_id)
    if err or not veterinarian:
        raise HTTPException(status_code=404, detail="Veterinario no encontrado")

    quantity = int(payload.quantity or 1)
    credits = int(package["credits"]) * max(1, quantity)
    amount = float(package["price"]) * max(1, quantity)

    session_id = f"sim_{uuid.uuid4()}"
    transaction_data = {
        "session_id": session_id,
        "type": "consultation_credits",
        "package_id": payload.package_id,
        "credits": credits,
        "amount": amount,
        "currency": package["currency"],
        "status": "open",
        "payment_status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "veterinarian_id": payload.veterinarian_id,
    }

    if stripe and STRIPE_API_KEY:
        stripe.api_key = STRIPE_API_KEY
        try:
            success_url = f"{payload.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{payload.origin_url}/dashboard"
            session = stripe.checkout.Session.create(
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                line_items=[
                    {
                        "price_data": {
                            "currency": package["currency"],
                            "product_data": {
                                "name": package["name"],
                            },
                            "unit_amount": int(round(float(package["price"]) * 100)),
                        },
                        "quantity": max(1, quantity),
                    }
                ],
                metadata={
                    "type": "consultation_credits",
                    "package_id": payload.package_id,
                    "credits": str(credits),
                    "veterinarian_id": payload.veterinarian_id,
                },
            )

            session_id = session.id
            transaction_data["session_id"] = session_id
            transaction_data["stripe"] = True
            transaction, err = insert_payment_transaction(transaction_data)
            if err:
                raise HTTPException(status_code=500, detail=f"Error guardando transacción: {err}")

            return {"checkout_url": session.url, "session_id": session_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creando sesión Stripe: {str(e)}")

    transaction, err = insert_payment_transaction(transaction_data)
    if err:
        raise HTTPException(status_code=500, detail=f"Error guardando transacción: {err}")
    checkout_url = f"{payload.origin_url}/payment-success?session_id={session_id}"
    return {
        "checkout_url": checkout_url,
        "session_id": session_id,
        "message": "Pago simulado - En producción, esto usaría Stripe",
    }


@app.get("/api/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, x_veterinarian_id: str = Header(None)):
    """Obtiene estado del pago (simulado como exitoso)"""

    transaction, err = get_payment_transaction_by_session_id(session_id)
    if err:
        raise HTTPException(status_code=500, detail=f"Error obteniendo transacción: {err}")

    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    status_value = transaction.get("status", "open")
    payment_status = transaction.get("payment_status", "unpaid")

    if stripe and STRIPE_API_KEY and str(session_id).startswith("cs_"):
        stripe.api_key = STRIPE_API_KEY
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            status_value = session.status
            payment_status = session.payment_status
            err_upd = update_payment_transaction(
                session_id,
                {
                    "status": status_value,
                    "payment_status": payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
            )
            if err_upd:
                print(f"[ERROR] Error actualizando transacción: {err_upd}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error verificando Stripe: {str(e)}")
    else:
        status_value = "complete"
        payment_status = "paid"
        err_upd = update_payment_transaction(
            session_id,
            {"status": status_value, "payment_status": payment_status},
        )
        if err_upd:
            print(f"[ERROR] Error actualizando transacción: {err_upd}")

    updated_veterinarian = None

    if payment_status == "paid":
        transaction_type = transaction.get("type")
        veterinarian_id = transaction.get("veterinarian_id") or x_veterinarian_id

        if transaction_type == "consultation_credits" and veterinarian_id:
            if not transaction.get("credits_applied"):
                credits = int(transaction.get("credits") or 0)
                veterinarian, err = get_profile(veterinarian_id)
                if veterinarian and not err:
                    current = int(veterinarian.get("consultations_remaining") or 0)
                    new_remaining = current + credits
                    err_upd = update_profile(
                        veterinarian_id,
                        {"consultations_remaining": new_remaining},
                    )
                    if not err_upd:
                        err_tx = update_payment_transaction(
                            session_id,
                            {
                                "credits_applied": True,
                                "credits_applied_at": datetime.now(timezone.utc).isoformat(),
                                "consultations_remaining_after": new_remaining,
                            },
                        )
                        if not err_tx:
                            updated_veterinarian, _ = get_profile(veterinarian_id)
        elif transaction_type == "membership" and veterinarian_id:
            if not transaction.get("membership_activated"):
                package = MEMBERSHIP_PACKAGES.get(transaction.get("package") or "")
                if package:
                    consultations = package["consultations"]
                    days = 30 if transaction.get("billing_cycle") == "monthly" else 365
                    expires = datetime.now(timezone.utc) + timedelta(days=days)
                    err_upd = update_profile(
                        veterinarian_id,
                        {
                            "membership_type": transaction.get("package"),
                            "consultations_remaining": consultations,
                            "membership_expires": expires.isoformat(),
                        },
                    )
                    if not err_upd:
                        err_tx = update_payment_transaction(
                            session_id,
                            {
                                "membership_activated": True,
                                "membership_activated_at": datetime.now(timezone.utc).isoformat(),
                            },
                        )
                        if not err_tx:
                            updated_veterinarian, _ = get_profile(veterinarian_id)

        if veterinarian_id and updated_veterinarian is None:
            updated_veterinarian, _ = get_profile(veterinarian_id)

    return {
        "status": status_value,
        "payment_status": payment_status,
        "session_id": session_id,
        "purchase_type": transaction.get("type"),
        "credits": transaction.get("credits"),
        "veterinarian": updated_veterinarian,
    }


# ============================================
# MEDICAL IMAGES (Simplified)
# ============================================


class ImageInterpretRequest(BaseModel):
    veterinarian_id: str
    image_base64: Optional[str] = Field(default=None)  # Opcional: puede ser None si solo se usan datos pegados
    image_type: str = "general"
    patient_name: Optional[str] = Field(default=None)
    consultation_id: Optional[str] = Field(default=None)
    additional_context: Optional[str] = Field(default=None)
    pasted_study_data: Optional[str] = Field(default=None)  # Datos de estudio pegados por el usuario


@app.post("/api/medical-images/interpret")
async def interpret_medical_image(request: ImageInterpretRequest):
    """Interpreta imagen médica usando Claude Vision y persiste en Supabase."""

    # Validar perfil en Supabase
    vet_profile, err_profile = get_profile(request.veterinarian_id)
    if err_profile:
        raise HTTPException(status_code=500, detail=f"Error perfil: {err_profile}")
    if not vet_profile:
        if request.veterinarian_id.startswith("dev-"):
            seed_profile = {
                "id": request.veterinarian_id,
                "email": f"{request.veterinarian_id}@example.com",
                "nombre": "Dev Veterinario",
                "membership_type": "premium",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            _, err_up = upsert_profile(seed_profile)
            if err_up:
                raise HTTPException(status_code=500, detail=f"Error creando perfil: {err_up}")
            vet_profile = seed_profile
        else:
            raise HTTPException(status_code=404, detail="Veterinario no encontrado")

    if (vet_profile.get("membership_type") or "basic").lower() != "premium":
        raise HTTPException(status_code=403, detail="Función exclusiva para miembros Premium")

    image_id = str(uuid.uuid4())
    
    # Verificar que no sea un PDF
    if request.image_type == "pdf_report" or (request.image_base64 and request.image_base64.startswith("JVBERi")):
        raise HTTPException(
            status_code=400, 
            detail="No se pueden analizar archivos PDF directamente. Por favor sube una foto o captura de pantalla del documento (JPG, PNG)."
        )
    
    # Preparar el análisis con Claude Vision
    type_descriptions = {
        "xray": "imagen médica/radiografía",
        "blood_test": "análisis de sangre/hemograma",
        "urinalysis": "urianálisis/examen de orina",
        "general": "imagen médica veterinaria"
    }
    
    image_type_desc = type_descriptions.get(request.image_type, "imagen médica")
    
    # El system prompt se toma exclusivamente desde instrucciones_veterinarias.txt

    # Construir mensaje para Claude - solo con datos pegados (sin imágenes)
    user_message = f"Analiza este {image_type_desc}."
    if request.patient_name:
        user_message += f"\n\nPaciente: {request.patient_name}"
    if request.additional_context:
        user_message += f"\n\nContexto adicional: {request.additional_context}"
    
    # Los datos pegados son obligatorios (ya no se usan imágenes)
    if not request.pasted_study_data or not request.pasted_study_data.strip():
        raise HTTPException(status_code=400, detail="Se requiere pegar los datos del estudio para el análisis")
    
    user_message += f"\n\n--- DATOS DEL ESTUDIO (copiados por el usuario) ---\n{request.pasted_study_data}"

    try:
        print(f"[DEBUG] Iniciando análisis de {image_type_desc} tipo: {request.image_type}")
        print(f"[DEBUG] API Key presente: {bool(ANTHROPIC_API_KEY)}")
        print(f"[DEBUG] Modelo: {ANTHROPIC_MODEL or 'claude-3-5-sonnet-20241022 (default)'}")
        print(f"[DEBUG] Modo: Solo texto (datos pegados) - sin imágenes")
        print(f"[DEBUG] Tiene datos pegados: {bool(request.pasted_study_data)}")
        if request.pasted_study_data:
            print(f"[DEBUG] Longitud de datos pegados: {len(request.pasted_study_data)} caracteres")
            print(f"[DEBUG] Primeros 200 caracteres de datos pegados:")
            print(f"[DEBUG] {request.pasted_study_data[:200]}...")
        print(f"[DEBUG] Mensaje de usuario (primeros 300 caracteres):")
        print(f"[DEBUG] {user_message[:300]}...")
        
        # Verificar que las instrucciones se cargaron
        instructions = _load_system_instructions()
        print(f"[DEBUG] Instrucciones cargadas: {bool(instructions)}")
        if instructions:
            print(f"[DEBUG] Longitud de instrucciones: {len(instructions)} caracteres")

        # Solo usar texto - no se procesan imágenes, solo datos pegados
        content_blocks = [{"type": "text", "text": user_message}]

        print(f"[DEBUG] Enviando solicitud a Claude...")
        analysis_text = await send_llm_message(content_blocks)

        print(f"[DEBUG] ✅ Respuesta recibida de Claude: {len(analysis_text)} caracteres")
        print(f"[DEBUG] Primeros 300 caracteres de la respuesta:")
        print(f"[DEBUG] {analysis_text[:300]}...")

        # Parsear hallazgos y recomendaciones del texto
        findings = []
        recommendations = []

        lines = analysis_text.split("\n")
        current_section = None
        for line in lines:
            line_lower = line.lower().strip()
            if "hallazgos" in line_lower:
                current_section = "findings"
            elif "recomendaciones" in line_lower or "recomendación" in line_lower:
                current_section = "recommendations"
            elif line.strip().startswith("-") or line.strip().startswith("•"):
                clean_line = line.strip().lstrip("-•").strip()
                if clean_line and current_section == "findings":
                    findings.append(clean_line)
                elif clean_line and current_section == "recommendations":
                    recommendations.append(clean_line)

        if not findings:
            findings = ["Ver análisis detallado"]
        if not recommendations:
            recommendations = ["Consultar análisis completo"]

    except ValueError as e:
        print(f"[ERROR] ValueError: {str(e)}")
        analysis_text = f"Error: {str(e)}"
        findings = ["API key no configurada"]
        recommendations = ["Configurar ANTHROPIC_API_KEY en backend/.env"]
    except RuntimeError as e:
        print(f"[ERROR] RuntimeError: {str(e)}")
        analysis_text = f"Error al analizar imagen: {str(e)}"
        findings = ["Error en servicio externo"]
        recommendations = ["Revisar conexión con Anthropic y reintentar"]
    except Exception as e:
        import traceback
        print(f"[ERROR] Exception: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        analysis_text = f"Error al analizar imagen: {str(e)}"
        findings = ["Error en el análisis"]
        recommendations = ["Verificar la imagen e intentar de nuevo"]

    # No se suben imágenes - solo se analizan datos de texto pegados
    public_url = None

    created_at = datetime.now(timezone.utc).isoformat()
    
    # Validar que consultation_id sea un UUID válido (si se proporciona)
    # Si viene con formato "CONS-XXXX" o no es UUID válido, usar None
    valid_consultation_id = None
    if request.consultation_id:
        try:
            # Intentar validar como UUID
            uuid.UUID(request.consultation_id)
            valid_consultation_id = request.consultation_id
        except (ValueError, AttributeError):
            # Si no es UUID válido, ignorarlo (no ligar la imagen a la consulta)
            print(f"[WARN] consultation_id inválido (no es UUID): {request.consultation_id}. No se ligará la imagen a la consulta.")
            valid_consultation_id = None
    
    analysis_row = {
        "id": image_id,
        "user_id": request.veterinarian_id,
        "consultation_id": valid_consultation_id,
        "image_type": request.image_type,
        "patient_name": request.patient_name,
        "image_url": public_url,
        "analysis": analysis_text,
        "findings": findings,
        "recommendations": recommendations,
        "additional_context": request.additional_context,
        "created_at": created_at,
    }

    inserted, err_ins = insert_medical_image(analysis_row)
    if err_ins:
        print(f"[ERROR] Error guardando análisis en medical_images: {err_ins}")
        print(f"[ERROR] Datos que se intentaron guardar: {analysis_row}")
        raise HTTPException(status_code=500, detail=f"Error guardando imagen: {err_ins}")
    else:
        print(f"[DEBUG] ✅ Análisis guardado correctamente en medical_images con ID: {image_id}")
        print(f"[DEBUG] user_id: {request.veterinarian_id}, image_type: {request.image_type}")

    # Ligar interpretación con la consulta (si se proporcionó un UUID válido)
    if valid_consultation_id:
        cons, err_cons = get_consultation_by_id(valid_consultation_id)
        if err_cons:
            print(f"[WARN] No se pudo obtener consulta para ligar imagen: {err_cons}")
        elif cons:
            payload = cons.get("payload") or {}
            linked_images = payload.get("medical_images", [])
            linked_images.append(
                {
                    "image_id": image_id,
                    "image_type": request.image_type,
                    "patient_name": request.patient_name,
                    "created_at": created_at,
                    "image_url": public_url,
                }
            )
            payload["medical_images"] = linked_images
            err_upd = update_consultation(valid_consultation_id, {"payload": payload})
            if err_upd:
                print(f"[WARN] No se pudo ligar imagen a consulta: {err_upd}")

    return jsonable_encoder(inserted or analysis_row)


@app.get("/api/medical-images/history")
async def get_image_history(x_veterinarian_id: str = Header(None), limit: int = 20):
    """Historial de imágenes desde Supabase"""

    if not x_veterinarian_id:
        raise HTTPException(status_code=401, detail="No autenticado")

    rows, err = list_medical_images(x_veterinarian_id, limit=limit)
    if err:
        raise HTTPException(status_code=500, detail=f"Error consultando: {err}")
    return {"images": rows}


# ============================================
# ADMIN ENDPOINTS
# ============================================

@app.post("/api/admin/give-trial-consultations")
async def give_trial_consultations_to_all_users():
    """
    Endpoint administrativo para dar 3 consultas premium a todos los usuarios
    que no tienen membresía activa y tienen 0 o menos consultas restantes.
    """
    print("[INFO] Iniciando proceso para dar 3 consultas premium a todos los usuarios sin membresía.")
    
    # Obtener todos los perfiles
    profiles, err = list_profiles()
    if err:
        raise HTTPException(status_code=500, detail=f"Error listando perfiles: {err}")
    
    updated_count = 0
    skipped_count = 0
    
    for profile in profiles:
        profile_id = profile.get("id")
        if not profile_id:
            continue
            
        membership_type = profile.get("membership_type")
        consultations_remaining = profile.get("consultations_remaining", 0)
        
        # Si no tiene membresía activa, validar y asignar consultas
        if not membership_type:
            # Asegurar que no tenga más de 3 consultas
            if consultations_remaining > 3:
                # No actualizar, solo loguear
                email = profile.get("email", "sin email")
                print(f"[WARN] Usuario {email} (ID: {profile_id}) ya tiene {consultations_remaining} consultas, omitiendo...")
                skipped_count += 1
                continue
            # Solo asignar si tiene 0 o menos
            if consultations_remaining <= 0:
                update_fields = {
                    "consultations_remaining": 3,
                    "membership_type": None,  # Asegurar que no tenga membresía activa
                    "membership_expires": None,
                }
                err_upd = update_profile(profile_id, update_fields)
                if err_upd:
                    print(f"[WARN] Error actualizando perfil {profile_id}: {err_upd}")
                else:
                    updated_count += 1
                    email = profile.get("email", "sin email")
                    print(f"[INFO] Usuario {email} (ID: {profile_id}) actualizado con 3 consultas premium.")
            else:
                skipped_count += 1
        else:
            skipped_count += 1
    
    return {
        "status": "ok",
        "message": f"Se asignaron 3 consultas premium a {updated_count} usuarios.",
        "updated_count": updated_count,
        "skipped_count": skipped_count,
        "total_profiles": len(profiles)
    }


@app.post("/api/admin/delete-user")
async def delete_user_by_email(email: str):
    """
    Endpoint administrativo para eliminar un usuario por email.
    """
    print(f"[INFO] Intentando eliminar usuario con email: {email}")
    
    from supabase_client import delete_profile_by_email
    
    success, error = delete_profile_by_email(email)
    
    if not success:
        raise HTTPException(
            status_code=404 if "no encontrado" in (error or "").lower() else 500,
            detail=error or "Error eliminando usuario"
        )
    
    return {
        "status": "ok",
        "message": f"Usuario {email} eliminado correctamente",
        "email": email,
    }


# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn

    print("Iniciando Savant Vet API - Modo Local")
    print("Base de datos: Supabase")
    print("Servidor: http://127.0.0.1:8000")
    print("Docs: http://127.0.0.1:8000/docs")
    # Usamos IPv4 explícito para evitar problemas en Windows cuando 'localhost' resuelve a IPv6 (::1).
    uvicorn.run(app, host="127.0.0.1", port=8000)
