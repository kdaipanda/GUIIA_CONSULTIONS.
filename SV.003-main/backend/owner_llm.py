"""LLM exclusivo para dueños B2C.

NUNCA usa instrucciones_veterinarias.txt (prompt MVZ/CDS).
Solo lee instrucciones_dueno_mascota.txt.
"""
from __future__ import annotations

import asyncio
import os
from typing import Any, Dict, List, Optional, Tuple

try:
    from anthropic import Anthropic  # type: ignore
except Exception:  # noqa: BLE001
    Anthropic = None  # type: ignore[assignment]

OWNER_INSTRUCTIONS_FILE = os.path.join(
    os.path.dirname(__file__), "instrucciones_dueno_mascota.txt"
)
ANTHROPIC_MODEL_DEFAULT = "claude-sonnet-4-6"
DEPRECATED_ANTHROPIC_MODELS = {
    "claude-sonnet-4-20250514": ANTHROPIC_MODEL_DEFAULT,
    "claude-3-5-sonnet-20241022": ANTHROPIC_MODEL_DEFAULT,
    "claude-3-5-sonnet-latest": ANTHROPIC_MODEL_DEFAULT,
}

_owner_client: Any = None
_owner_prompt_cache: Optional[Tuple[float, str]] = None


def resolve_owner_anthropic_model(raw: Optional[str] = None) -> str:
    model = (raw if raw is not None else os.getenv("ANTHROPIC_MODEL") or "").strip()
    model = model or ANTHROPIC_MODEL_DEFAULT
    mapped = DEPRECATED_ANTHROPIC_MODELS.get(model)
    if mapped:
        print(f"[WARN] OWNER Anthropic model '{model}' está obsoleto; usando '{mapped}'.")
        return mapped
    return model


def load_owner_system_instructions() -> str:
    """Carga el system prompt B2C. Recarga si el archivo cambia en disco."""
    global _owner_prompt_cache
    try:
        mtime = os.path.getmtime(OWNER_INSTRUCTIONS_FILE)
        with open(OWNER_INSTRUCTIONS_FILE, "r", encoding="utf-8") as fh:
            text = (fh.read() or "").strip()
    except OSError as exc:
        raise ValueError(
            f"No se pudo leer el prompt de dueños '{OWNER_INSTRUCTIONS_FILE}': {exc}"
        ) from exc
    if not text:
        raise ValueError(
            f"El archivo de instrucciones de dueño '{OWNER_INSTRUCTIONS_FILE}' "
            "está vacío. Es obligatorio y está separado del prompt MVZ."
        )
    if _owner_prompt_cache and _owner_prompt_cache[0] == mtime:
        return _owner_prompt_cache[1]
    _owner_prompt_cache = (mtime, text)
    return text


def _get_owner_client() -> Any:
    global _owner_client
    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY no está configurada. "
            "Requerida para orientación clínica informativa de dueños."
        )
    if Anthropic is None:
        raise ValueError(
            "El paquete 'anthropic' no está instalado en el backend."
        )
    if _owner_client is None:
        # Por defecto API oficial. El .env local a veces apunta ANTHROPIC_BASE_URL
        # a Ollama (localhost:11434); eso rompe B2C si Ollama no está arriba.
        # Override opcional: OWNER_LLM_BASE_URL o OWNER_LLM_USE_LOCAL=1.
        kwargs: Dict[str, Any] = {"api_key": api_key}
        owner_base = (os.getenv("OWNER_LLM_BASE_URL") or "").strip()
        use_local = os.getenv("OWNER_LLM_USE_LOCAL", "").lower() in (
            "1",
            "true",
            "yes",
        )
        env_base = (os.getenv("ANTHROPIC_BASE_URL") or "").strip()
        if owner_base:
            kwargs["base_url"] = owner_base
        elif use_local and env_base:
            kwargs["base_url"] = env_base
        else:
            kwargs["base_url"] = "https://api.anthropic.com"
        _owner_client = Anthropic(**kwargs)
    return _owner_client


async def send_owner_llm_message(user_text: str) -> str:
    """
    Genera orientación clínica informativa para dueño.
    System prompt: SOLO instrucciones_dueno_mascota.txt (nunca el prompt MVZ).
    """
    system_prompt = load_owner_system_instructions()
    model = resolve_owner_anthropic_model()
    max_tokens = int(os.getenv("ANTHROPIC_MAX_TOKENS") or "4096")
    client = _get_owner_client()

    messages_payload: List[Dict[str, Any]] = [
        {"role": "user", "content": [{"type": "text", "text": user_text}]},
    ]

    def _call() -> str:
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages_payload,
        )
        text_blocks = [
            block.text
            for block in response.content
            if getattr(block, "type", "") == "text" and getattr(block, "text", None)
        ]
        text = "\n".join(text_blocks).strip()
        if not text:
            raise RuntimeError("El modelo no devolvió texto para la orientación de dueño.")
        return text

    return await asyncio.to_thread(_call)
