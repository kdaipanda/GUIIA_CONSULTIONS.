"""
Integración opcional con Headroom (https://github.com/headroomlabs-ai/headroom).

Optimiza el contexto enviado a Claude en consultas clínicas:
- Prompt caching de Anthropic en instrucciones_veterinarias.txt (sin pérdida de datos).
- Compresión conservadora del mensaje del usuario cuando supera umbral de tokens.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

HEADROOM_AVAILABLE = False
HeadroomClient: Any = None
AnthropicProvider: Any = None
CompressConfig: Any = None
compress: Any = None

try:
    from headroom import AnthropicProvider as _AnthropicProvider
    from headroom import CompressConfig as _CompressConfig
    from headroom import HeadroomClient as _HeadroomClient
    from headroom import compress as _compress

    HeadroomClient = _HeadroomClient
    AnthropicProvider = _AnthropicProvider
    CompressConfig = _CompressConfig
    compress = _compress
    HEADROOM_AVAILABLE = True
except ImportError:
    pass

_headroom_client: Any = None
_last_stats: Dict[str, Any] = {}


def _env_bool(key: str, default: bool = True) -> bool:
    raw = os.getenv(key, "").strip().lower()
    if not raw:
        return default
    return raw in ("1", "true", "yes", "on")


def is_headroom_enabled() -> bool:
    if not HEADROOM_AVAILABLE:
        return False
    return _env_bool("HEADROOM_ENABLED", default=True)


def get_headroom_mode() -> str:
    mode = os.getenv("HEADROOM_MODE", "optimize").strip().lower()
    if mode in ("audit", "optimize", "off"):
        return mode
    return "optimize"


def build_system_with_cache(system_text: str) -> Any:
    """Formato Anthropic con cache_control (lossless) para el system prompt largo."""
    if not _env_bool("HEADROOM_PROMPT_CACHE", default=True):
        return system_text
    return [
        {
            "type": "text",
            "text": system_text,
            "cache_control": {"type": "ephemeral"},
        }
    ]


def _veterinary_compress_config() -> Any:
    min_tokens = 800
    try:
        min_tokens = int(os.getenv("HEADROOM_MIN_TOKENS", "800"))
    except ValueError:
        pass

    target_ratio = 0.7
    try:
        target_ratio = float(os.getenv("HEADROOM_TARGET_RATIO", "0.7"))
    except ValueError:
        pass

    kompress_model = os.getenv("HEADROOM_KOMPRESS_MODEL", "disabled").strip() or "disabled"

    return CompressConfig(
        compress_system_messages=False,
        compress_user_messages=True,
        protect_analysis_context=False,
        protect_recent=1,
        min_tokens_to_compress=min_tokens,
        target_ratio=target_ratio,
        kompress_model=kompress_model,
    )


def optimize_consultation_messages(
    messages: List[Dict[str, Any]],
    model: str,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Comprime mensajes de usuario de forma conservadora antes de llamar a Claude."""
    global _last_stats

    if not is_headroom_enabled() or compress is None:
        return messages, {}

    mode = get_headroom_mode()
    if mode == "off":
        return messages, {}

    try:
        cfg = _veterinary_compress_config()
        result = compress(
            messages,
            model=model,
            config=cfg,
            optimize=(mode == "optimize"),
        )
        stats = {
            "mode": mode,
            "tokens_before": result.tokens_before,
            "tokens_after": result.tokens_after,
            "tokens_saved": result.tokens_saved,
            "transforms": result.transforms_applied,
        }
        _last_stats = stats
        if result.tokens_saved > 0:
            logger.info(
                "[Headroom] consulta %d -> %d tokens (ahorro %d, %s)",
                result.tokens_before,
                result.tokens_after,
                result.tokens_saved,
                ", ".join(result.transforms_applied[:3]),
            )
        return result.messages, stats
    except Exception as exc:  # noqa: BLE001
        logger.warning("[Headroom] compress falló, payload original: %s", exc)
        stats = {"mode": mode, "error": str(exc)}
        _last_stats = stats
        return messages, stats


def get_llm_client(base_client: Any) -> Any:
    """Devuelve HeadroomClient envolviendo Anthropic si está habilitado."""
    global _headroom_client

    if not is_headroom_enabled() or HeadroomClient is None or AnthropicProvider is None:
        return base_client

    if _headroom_client is None:
        _headroom_client = HeadroomClient(
            original_client=base_client,
            provider=AnthropicProvider(client=base_client),
            default_mode=get_headroom_mode(),
            enable_cache_optimizer=True,
        )
    return _headroom_client


def get_status() -> Dict[str, Any]:
    return {
        "available": HEADROOM_AVAILABLE,
        "enabled": is_headroom_enabled(),
        "mode": get_headroom_mode() if is_headroom_enabled() else "off",
        "prompt_cache": _env_bool("HEADROOM_PROMPT_CACHE", default=True),
        "last_request": _last_stats or None,
    }
