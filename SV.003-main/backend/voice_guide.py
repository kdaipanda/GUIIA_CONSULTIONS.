"""
Guía por voz Doctor Plumitas — onboarding 1ª consulta (Perros).

Extrae valores de campos a partir de transcripciones (STT del navegador u OpenAI)
y opcionalmente genera audio TTS si hay OPENAI_API_KEY.
"""
from __future__ import annotations

import asyncio
import json
import os
import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

import auth_security

voice_guide_router = APIRouter(prefix="/api/voice-guide", tags=["voice-guide"])

# Script MVP: campos reales del formulario Perros (paso 1).
PERROS_GUIDE_FIELDS: List[Dict[str, Any]] = [
    {
        "id": "nombre_mascota",
        "type": "text",
        "section": "perros-info-basica",
        "prompt_es": "¿Cuál es el nombre de la mascota?",
        "prompt_en": "What is the pet's name?",
        "confirm_es": "Perfecto, el nombre es {value}.",
        "confirm_en": "Got it, the name is {value}.",
    },
    {
        "id": "nombre_dueño",
        "type": "text",
        "section": "perros-info-basica",
        "prompt_es": "¿Cómo se llama el dueño o tutor?",
        "prompt_en": "What is the owner's name?",
        "confirm_es": "Dueño registrado: {value}.",
        "confirm_en": "Owner recorded: {value}.",
    },
    {
        "id": "raza",
        "type": "text",
        "section": "perros-info-basica",
        "prompt_es": "¿De qué raza es el perro? Si es mestizo, dilo.",
        "prompt_en": "What breed is the dog? Say mixed if unknown.",
        "confirm_es": "Raza: {value}.",
        "confirm_en": "Breed: {value}.",
    },
    {
        "id": "sexo",
        "type": "enum",
        "values": ["macho", "hembra"],
        "section": "perros-info-basica",
        "prompt_es": "¿Es macho o hembra?",
        "prompt_en": "Is it male or female?",
        "confirm_es": "Sexo: {value}.",
        "confirm_en": "Sex: {value}.",
    },
    {
        "id": "edad",
        "type": "text",
        "section": "perros-info-basica",
        "prompt_es": "¿Qué edad tiene? Puedes decir años o meses.",
        "prompt_en": "How old is the pet? Years or months is fine.",
        "confirm_es": "Edad: {value}.",
        "confirm_en": "Age: {value}.",
    },
    {
        "id": "peso",
        "type": "number",
        "section": "perros-info-basica",
        "prompt_es": "¿Cuánto pesa en kilogramos?",
        "prompt_en": "What is the weight in kilograms?",
        "confirm_es": "Peso: {value} kg.",
        "confirm_en": "Weight: {value} kg.",
    },
    {
        "id": "estado_reproductivo",
        "type": "enum",
        "values": ["entero", "castrado"],
        "section": "perros-info-basica",
        "prompt_es": "¿Está entero o castrado/esterilizado?",
        "prompt_en": "Is it intact, or neutered/spayed?",
        "confirm_es": "Estado reproductivo: {value}.",
        "confirm_en": "Reproductive status: {value}.",
    },
    {
        "id": "vacunas_vigentes",
        "type": "yesno",
        "section": "perros-historial-medico",
        "prompt_es": "¿Tiene las vacunas vigentes? Responde sí o no.",
        "prompt_en": "Are vaccinations up to date? Yes or no.",
        "confirm_es": "Vacunas vigentes: {value}.",
        "confirm_en": "Vaccines current: {value}.",
    },
    {
        "id": "desparasitacion_interna",
        "type": "yesno",
        "section": "perros-historial-medico",
        "prompt_es": "¿Tiene desparasitación interna al día? Sí o no.",
        "prompt_en": "Is internal deworming up to date? Yes or no.",
        "confirm_es": "Desparasitación interna: {value}.",
        "confirm_en": "Internal deworming: {value}.",
    },
    {
        "id": "desparasitacion_externa",
        "type": "yesno",
        "section": "perros-historial-medico",
        "prompt_es": "¿Tiene desparasitación externa al día? Sí o no.",
        "prompt_en": "Is external parasite control up to date? Yes or no.",
        "confirm_es": "Desparasitación externa: {value}.",
        "confirm_en": "External deworming: {value}.",
    },
    {
        "id": "cirugias_previas",
        "type": "yesno",
        "section": "perros-historial-medico",
        "prompt_es": "¿Ha tenido cirugías previas? Sí o no.",
        "prompt_en": "Any previous surgeries? Yes or no.",
        "confirm_es": "Cirugías previas: {value}.",
        "confirm_en": "Previous surgeries: {value}.",
    },
    {
        "id": "habitat",
        "type": "enum",
        "values": ["INTERIOR", "EXTERIOR"],
        "section": "perros-habitat-alimentacion",
        "prompt_es": "¿Vive en interior o exterior? Di interior (casa/departamento) o exterior (patio/jardín).",
        "prompt_en": "Does it live indoors or outdoors? Say interior or exterior.",
        "confirm_es": "Hábitat: {value}.",
        "confirm_en": "Habitat: {value}.",
    },
    {
        "id": "zona_geografica",
        "type": "text",
        "section": "perros-habitat-alimentacion",
        "prompt_es": "¿En qué ciudad o zona geográfica vive?",
        "prompt_en": "What city or geographic area does it live in?",
        "confirm_es": "Zona: {value}.",
        "confirm_en": "Area: {value}.",
    },
    {
        "id": "temperatura",
        "type": "number",
        "section": "perros-examen-fisico",
        "prompt_es": "Si ya la mediste, ¿cuál es la temperatura en grados Celsius? Si no, di omitir.",
        "prompt_en": "If measured, what is the temperature in Celsius? Otherwise say skip.",
        "confirm_es": "Temperatura: {value} °C.",
        "confirm_en": "Temperature: {value} °C.",
        "skippable": True,
    },
    {
        "id": "frecuencia_cardiaca",
        "type": "number",
        "section": "perros-examen-fisico",
        "prompt_es": "¿Frecuencia cardíaca por minuto? Si no la tienes, di omitir.",
        "prompt_en": "Heart rate per minute? Say skip if unknown.",
        "confirm_es": "Frecuencia cardíaca: {value}.",
        "confirm_en": "Heart rate: {value}.",
        "skippable": True,
    },
    {
        "id": "frecuencia_respiratoria",
        "type": "number",
        "section": "perros-examen-fisico",
        "prompt_es": "¿Frecuencia respiratoria por minuto? Si no, di omitir.",
        "prompt_en": "Respiratory rate per minute? Say skip if unknown.",
        "confirm_es": "Frecuencia respiratoria: {value}.",
        "confirm_en": "Respiratory rate: {value}.",
        "skippable": True,
    },
]

GUIDE_SCRIPTS = {"perros": PERROS_GUIDE_FIELDS}

INTRO_ES = (
    "¡Hola! Soy el Doctor Plumitas, tu guía en GUIAA. "
    "Vamos a llenar juntos tu primera consulta, paso a paso. "
    "Cuando te pregunte, toca el micrófono y respóndeme con claridad. ¡Empezamos!"
)
INTRO_EN = (
    "Hi! I'm Doctor Plumitas, your guide in GUIAA. "
    "We'll fill your first consultation together, step by step. "
    "When I ask, tap the mic and answer clearly. Let's go!"
)
DONE_ES = (
    "¡Excelente trabajo! Completamos los datos principales. "
    "Revisa el formulario un momento y luego continúa al motivo de consulta. ¡Tú puedes!"
)
DONE_EN = (
    "Great job! We filled the main fields. "
    "Take a quick look at the form, then continue to the reason for visit. You've got this!"
)


def _tts_voice_default() -> str:
    # coral/shimmer suelen sonar más expresivas en gpt-4o-mini-tts
    return (os.getenv("OPENAI_TTS_VOICE", "coral") or "coral").strip()


def _plumitas_tts_instructions(language: str) -> str:
    if _lang(language) == "en":
        return (
            "You are Doctor Plumitas, a cheerful veterinary clinic mascot owl. "
            "Speak with lively warmth, light smile in the voice, natural energy, "
            "clear diction, and encouraging coach energy. Not robotic. Not overly childish. "
            "Keep a friendly upbeat pace suitable for guiding a form."
        )
    return (
        "Eres el Doctor Plumitas, una mascota búho alegre de clínica veterinaria. "
        "Habla en español latinoamericano con calidez viva, sonrisa en la voz, energía natural "
        "y dicción clara. Suena cercano y motivador, nunca robótico ni monótono. "
        "Ritmo ligeramente animado (no apresurado) para guiar un formulario. "
        "Puedes sonar entusiasta en saludos y confirmaciones, y más claro en preguntas."
    )


class ExtractRequest(BaseModel):
    category: str = "perros"
    field_id: str
    transcript: str = Field(..., min_length=1, max_length=2000)
    language: str = "es"
    current_value: Optional[str] = None


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    language: str = "es"
    voice: Optional[str] = None


def _lang(language: str) -> str:
    return "en" if (language or "").lower().startswith("en") else "es"


def _field_by_id(category: str, field_id: str) -> Optional[Dict[str, Any]]:
    for item in GUIDE_SCRIPTS.get(category, []):
        if item["id"] == field_id:
            return item
    return None


def _next_field(category: str, field_id: str) -> Optional[Dict[str, Any]]:
    fields = GUIDE_SCRIPTS.get(category, [])
    for idx, item in enumerate(fields):
        if item["id"] == field_id:
            if idx + 1 < len(fields):
                return fields[idx + 1]
            return None
    return None


def _is_skip(transcript: str) -> bool:
    t = (transcript or "").strip().lower()
    return bool(
        re.search(
            r"\b(omitir|saltar|skip|pasar|no\s+s[eé]|desconozco|ninguna|ninguno)\b",
            t,
        )
    )


def _parse_yesno(transcript: str) -> Optional[str]:
    t = (transcript or "").strip().lower()
    if re.search(r"\b(s[ií]|sip|claro|afirmativo|yes|yeah)\b", t):
        return "SI"
    if re.search(r"\b(no|nop|negativo|ninguna|ninguno)\b", t):
        return "NO"
    return None


def _parse_sexo(transcript: str) -> Optional[str]:
    t = (transcript or "").strip().lower()
    if re.search(r"\b(hembra|femenino|female|hembrita)\b", t):
        return "hembra"
    if re.search(r"\b(macho|masculino|male)\b", t):
        return "macho"
    return None


def _parse_repro(transcript: str) -> Optional[str]:
    """PerrosForm solo acepta entero | castrado (esterilizado → castrado)."""
    t = (transcript or "").strip().lower()
    if re.search(
        r"\b(esterilizad[oa]|castrad[oa]|spay|neuter|orquid|ovariectom|ovariohister|operad[oa])\b",
        t,
    ):
        return "castrado"
    if re.search(r"\b(enter[oa]|intact[oa]|completo|sin\s+operar)\b", t):
        return "entero"
    return None


def _parse_habitat(transcript: str) -> Optional[str]:
    """PerrosForm solo acepta INTERIOR | EXTERIOR."""
    t = (transcript or "").strip().lower()
    if re.search(
        r"\b(interior|dentro|casa|departamento|depto|apartamento|indoor|adentro)\b",
        t,
    ):
        return "INTERIOR"
    if re.search(
        r"\b(exterior|afuera|patio|jard[ií]n|calle|outdoor|fuera)\b",
        t,
    ):
        return "EXTERIOR"
    return None


def _parse_number(transcript: str) -> Optional[str]:
    t = (transcript or "").strip().lower().replace(",", ".")
    # "treinta y ocho punto cinco" is hard; catch digits first
    m = re.search(r"(\d+(?:\.\d+)?)", t)
    if m:
        return m.group(1)
    word_map = {
        "cero": "0",
        "uno": "1",
        "una": "1",
        "dos": "2",
        "tres": "3",
        "cuatro": "4",
        "cinco": "5",
        "seis": "6",
        "siete": "7",
        "ocho": "8",
        "nueve": "9",
        "diez": "10",
        "once": "11",
        "doce": "12",
        "trece": "13",
        "catorce": "14",
        "quince": "15",
        "veinte": "20",
        "treinta": "30",
        "cuarenta": "40",
        "cincuenta": "50",
    }
    for word, num in word_map.items():
        if re.search(rf"\b{word}\b", t):
            return num
    return None


def _clean_text(transcript: str) -> str:
    t = (transcript or "").strip()
    t = re.sub(r"^(el nombre es|se llama|es|la raza es|vive en|el dueño es|la dueña es)\s+", "", t, flags=re.I)
    t = t.strip("._,;: ")
    if t:
        t = t[0].upper() + t[1:]
    return t[:200]


def extract_value_rule_based(field: Dict[str, Any], transcript: str) -> Dict[str, Any]:
    ftype = field.get("type")
    skippable = bool(field.get("skippable"))
    if skippable and _is_skip(transcript):
        return {"value": None, "skipped": True, "confidence": 0.95, "source": "rule"}

    if ftype == "yesno":
        parsed = _parse_yesno(transcript)
        if parsed:
            return {"value": parsed, "skipped": False, "confidence": 0.95, "source": "rule"}
        return {"value": None, "skipped": False, "confidence": 0.0, "source": "rule", "error": "yesno"}

    if field["id"] == "sexo":
        parsed = _parse_sexo(transcript)
        if parsed:
            return {"value": parsed, "skipped": False, "confidence": 0.95, "source": "rule"}
        return {"value": None, "skipped": False, "confidence": 0.0, "source": "rule", "error": "sexo"}

    if field["id"] == "estado_reproductivo":
        parsed = _parse_repro(transcript)
        if parsed:
            return {"value": parsed, "skipped": False, "confidence": 0.9, "source": "rule"}
        return {"value": None, "skipped": False, "confidence": 0.0, "source": "rule", "error": "repro"}

    if field["id"] == "habitat":
        parsed = _parse_habitat(transcript)
        if parsed:
            return {"value": parsed, "skipped": False, "confidence": 0.9, "source": "rule"}
        return {"value": None, "skipped": False, "confidence": 0.0, "source": "rule", "error": "habitat"}

    if ftype == "enum":
        allowed = [str(v) for v in (field.get("values") or [])]
        t = (transcript or "").strip().lower()
        for allowed_val in allowed:
            if allowed_val.lower() in t:
                return {
                    "value": allowed_val,
                    "skipped": False,
                    "confidence": 0.9,
                    "source": "rule",
                }
        return {"value": None, "skipped": False, "confidence": 0.0, "source": "rule", "error": "enum"}

    if ftype == "number":
        parsed = _parse_number(transcript)
        if parsed:
            return {"value": parsed, "skipped": False, "confidence": 0.9, "source": "rule"}
        return {"value": None, "skipped": False, "confidence": 0.0, "source": "rule", "error": "number"}

    # text
    cleaned = _clean_text(transcript)
    if cleaned:
        return {"value": cleaned, "skipped": False, "confidence": 0.85, "source": "rule"}
    return {"value": None, "skipped": False, "confidence": 0.0, "source": "rule", "error": "empty"}


async def extract_value_with_llm(field: Dict[str, Any], transcript: str, language: str) -> Dict[str, Any]:
    """Fallback con Anthropic cuando las reglas no alcanzan."""
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return {"value": None, "skipped": False, "confidence": 0.0, "source": "llm", "error": "no_llm"}

    try:
        from anthropic import Anthropic
    except ImportError:
        return {"value": None, "skipped": False, "confidence": 0.0, "source": "llm", "error": "no_sdk"}

    model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6").strip() or "claude-sonnet-4-6"
    values = field.get("values") or []
    schema_hint = {
        "field_id": field["id"],
        "type": field.get("type"),
        "allowed_values": values,
        "yesno_maps_to": ["SI", "NO"] if field.get("type") == "yesno" else None,
        "skippable": bool(field.get("skippable")),
    }
    system = (
        "Eres un extractor de campos clínicos veterinarios. "
        "Devuelve SOLO JSON válido con keys: value (string|null), skipped (bool), confidence (0-1). "
        "Si el usuario pide omitir y el campo es skippable, skipped=true y value=null. "
        "No inventes datos clínicos. Respuestas en el idioma del usuario solo dentro de value cuando sea texto libre."
    )
    user = (
        f"Idioma: {language}\n"
        f"Campo: {json.dumps(schema_hint, ensure_ascii=False)}\n"
        f"Transcripción: {transcript.strip()[:1200]}\n"
    )

    def _call() -> Dict[str, Any]:
        client = Anthropic(api_key=api_key)
        resp = client.messages.create(
            model=model,
            max_tokens=200,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        text = "".join(
            getattr(b, "text", "") for b in resp.content if getattr(b, "type", "") == "text"
        ).strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        data = json.loads(text)
        return {
            "value": data.get("value"),
            "skipped": bool(data.get("skipped")),
            "confidence": float(data.get("confidence") or 0.7),
            "source": "llm",
        }

    try:
        return await asyncio.to_thread(_call)
    except Exception as exc:  # noqa: BLE001
        return {
            "value": None,
            "skipped": False,
            "confidence": 0.0,
            "source": "llm",
            "error": str(exc)[:200],
        }


def _friendly_tts_error(exc: Exception) -> str:
    msg = str(exc)
    low = msg.lower()
    if "credit_balance_exhausted" in low or "no credits remaining" in low or "insufficient_quota" in low:
        return (
            "OpenAI sin créditos. Recarga billing en "
            "https://platform.openai.com/settings/organization/billing/ "
            "para usar la voz ChatGPT."
        )
    if "incorrect api key" in low or "invalid_api_key" in low:
        return "OPENAI_API_KEY inválida. Revisa el .env del backend."
    if "429" in msg:
        return "OpenAI rate limit / cuota. Espera un momento o revisa billing."
    return f"TTS OpenAI falló: {msg[:180]}"


async def synthesize_speech(
    text: str,
    language: str = "es",
    voice: Optional[str] = None,
) -> tuple[Optional[bytes], Optional[str]]:
    """TTS ChatGPT (OpenAI). Requiere OPENAI_API_KEY + paquete openai.

    Returns:
        (audio_bytes, error_message)
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None, "Falta OPENAI_API_KEY en el .env del backend."
    try:
        from openai import OpenAI
    except ImportError:
        print("[WARN] voice_guide TTS: instala openai (pip install openai)")
        return None, "Falta el paquete openai en el backend (pip install openai)."

    chosen_voice = (voice or _tts_voice_default()).strip() or "coral"
    model = (os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts") or "gpt-4o-mini-tts").strip()

    def _call() -> bytes:
        client = OpenAI(api_key=api_key)
        kwargs: Dict[str, Any] = {
            "model": model,
            "voice": chosen_voice,
            "input": text[:500],
            "response_format": "mp3",
        }
        try:
            kwargs["instructions"] = _plumitas_tts_instructions(language)
            speech = client.audio.speech.create(**kwargs)
        except TypeError:
            # SDKs viejos / modelos sin instructions
            kwargs.pop("instructions", None)
            kwargs["model"] = os.getenv("OPENAI_TTS_FALLBACK_MODEL", "tts-1-hd")
            speech = client.audio.speech.create(**kwargs)
        except Exception as first_exc:  # noqa: BLE001
            # Si es cuota, no reintentar (mismo error)
            friendly = _friendly_tts_error(first_exc)
            if "créditos" in friendly or "crédito" in friendly or "billing" in friendly.lower():
                raise
            print(f"[WARN] voice_guide TTS primary failed ({first_exc}); retry nova/tts-1-hd")
            kwargs.pop("instructions", None)
            kwargs["model"] = "tts-1-hd"
            kwargs["voice"] = "nova"
            speech = client.audio.speech.create(**kwargs)
        return speech.content

    try:
        audio = await asyncio.to_thread(_call)
        return audio, None
    except Exception as exc:  # noqa: BLE001
        print(f"[ERROR] voice_guide TTS: {exc}")
        return None, _friendly_tts_error(exc)


@voice_guide_router.get("/script/{category}")
async def get_script(
    category: str,
    language: str = "es",
    x_veterinarian_id: Optional[str] = Header(default=None),
):
    auth_security.resolve_authenticated_vet_id(x_veterinarian_id)
    cat = (category or "perros").strip().lower()
    fields = GUIDE_SCRIPTS.get(cat)
    if not fields:
        raise HTTPException(status_code=404, detail=f"No hay guía de voz para categoría '{cat}'")
    lang = _lang(language)
    prompt_key = f"prompt_{lang}"
    confirm_key = f"confirm_{lang}"
    payload_fields = []
    for f in fields:
        payload_fields.append(
            {
                "id": f["id"],
                "type": f.get("type", "text"),
                "section": f.get("section"),
                "skippable": bool(f.get("skippable")),
                "values": f.get("values") or [],
                "prompt": f.get(prompt_key) or f.get("prompt_es"),
                "confirm_template": f.get(confirm_key) or f.get("confirm_es"),
            }
        )
    openai_ready = bool(os.getenv("OPENAI_API_KEY", "").strip())
    return {
        "category": cat,
        "language": lang,
        "intro": INTRO_ES if lang == "es" else INTRO_EN,
        "done": DONE_ES if lang == "es" else DONE_EN,
        "fields": payload_fields,
        "tts_available": openai_ready,
        "tts_engine": "openai" if openai_ready else "browser",
        "tts_voice": _tts_voice_default() if openai_ready else None,
        "tts_model": (os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts") if openai_ready else None),
    }


@voice_guide_router.post("/extract")
async def extract_field(
    body: ExtractRequest,
    x_veterinarian_id: Optional[str] = Header(default=None),
):
    auth_security.resolve_authenticated_vet_id(x_veterinarian_id)
    cat = (body.category or "perros").strip().lower()
    field = _field_by_id(cat, body.field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Campo no encontrado en la guía")

    lang = _lang(body.language)
    result = extract_value_rule_based(field, body.transcript)
    if result.get("value") is None and not result.get("skipped"):
        llm = await extract_value_with_llm(field, body.transcript, lang)
        if llm.get("value") is not None or llm.get("skipped"):
            result = llm

    skipped = bool(result.get("skipped"))
    value = result.get("value")
    ok = skipped or (value is not None and str(value).strip() != "")

    confirm = None
    if ok and not skipped:
        tmpl = field.get(f"confirm_{lang}") or field.get("confirm_es")
        confirm = tmpl.format(value=value)
    elif skipped:
        confirm = "De acuerdo, lo omitimos." if lang == "es" else "Okay, skipping that."

    nxt = _next_field(cat, body.field_id)
    retry_prompt = None
    if not ok:
        retry_prompt = (
            "No te entendí bien. "
            + (field.get(f"prompt_{lang}") or field.get("prompt_es"))
            if lang == "es"
            else "I didn't catch that. " + (field.get(f"prompt_{lang}") or field.get("prompt_en"))
        )

    return {
        "ok": ok,
        "field_id": body.field_id,
        "value": value,
        "skipped": skipped,
        "confidence": result.get("confidence", 0),
        "source": result.get("source"),
        "speak_confirm": confirm,
        "retry_prompt": retry_prompt,
        "next_field_id": nxt["id"] if nxt else None,
        "done": nxt is None and ok,
        "section": field.get("section"),
    }


@voice_guide_router.post("/speak")
async def speak(
    body: SpeakRequest,
    x_veterinarian_id: Optional[str] = Header(default=None),
):
    auth_security.resolve_authenticated_vet_id(x_veterinarian_id)
    audio, err = await synthesize_speech(body.text, body.language, body.voice)
    if not audio:
        raise HTTPException(
            status_code=503,
            detail=err
            or "TTS no disponible. Configura OPENAI_API_KEY o usa voz del navegador.",
        )
    return Response(content=audio, media_type="audio/mpeg")
