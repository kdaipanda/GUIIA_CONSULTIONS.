"""Tests for public support chat abuse protection."""
from __future__ import annotations

import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-support-chat-tests")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")
os.environ.setdefault("ENVIRONMENT", "development")

import rate_limit  # noqa: E402
import server_simple  # noqa: E402


def test_public_support_chat_is_rate_limited_before_llm(monkeypatch):
    monkeypatch.delenv("DISABLE_RATE_LIMIT", raising=False)
    monkeypatch.setenv("SUPPORT_CHAT_RATE_LIMIT_MAX", "2")
    monkeypatch.setenv("SUPPORT_CHAT_RATE_LIMIT_WINDOW_SEC", "900")

    with rate_limit._LOCK:
        rate_limit._BUCKETS.clear()

    calls = 0

    async def fake_support_chat_message(**_kwargs):
        nonlocal calls
        calls += 1
        return "respuesta de soporte"

    monkeypatch.setattr(server_simple, "send_support_chat_message", fake_support_chat_message)
    client = TestClient(server_simple.app)
    payload = {"message": "Necesito ayuda para iniciar sesion", "history": []}

    assert client.post("/api/support/chat", json=payload).status_code == 200
    assert client.post("/api/support/chat", json=payload).status_code == 200

    blocked = client.post("/api/support/chat", json=payload)

    assert blocked.status_code == 429
    assert calls == 2

    with rate_limit._LOCK:
        rate_limit._BUCKETS.clear()
