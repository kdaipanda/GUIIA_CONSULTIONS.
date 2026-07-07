"""Rate limiting en memoria para endpoints de autenticación."""
from __future__ import annotations

import os
import time
from collections import defaultdict
from threading import Lock
from typing import DefaultDict, List

from fastapi import HTTPException, Request

_BUCKETS: DefaultDict[str, List[float]] = defaultdict(list)
_LOCK = Lock()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _bucket_key(request: Request, scope: str, identifier: str = "") -> str:
    ident = (identifier or "").strip().lower()[:160]
    return f"{scope}:{_client_ip(request)}:{ident}"


def check_rate_limit(
    request: Request,
    scope: str,
    identifier: str = "",
    *,
    max_attempts: int | None = None,
    window_seconds: int | None = None,
) -> None:
    if os.getenv("DISABLE_RATE_LIMIT", "").lower() in ("1", "true", "yes"):
        return

    limit = max_attempts
    if limit is None:
        limit = int(os.getenv("AUTH_RATE_LIMIT_MAX", "8"))
    window = window_seconds
    if window is None:
        window = int(os.getenv("AUTH_RATE_LIMIT_WINDOW_SEC", "900"))

    key = _bucket_key(request, scope, identifier)
    now = time.time()
    with _LOCK:
        recent = [t for t in _BUCKETS[key] if now - t < window]
        if len(recent) >= limit:
            raise HTTPException(
                status_code=429,
                detail="Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
            )
        recent.append(now)
        _BUCKETS[key] = recent


def reset_rate_limit(request: Request, scope: str, identifier: str = "") -> None:
    key = _bucket_key(request, scope, identifier)
    with _LOCK:
        _BUCKETS.pop(key, None)
