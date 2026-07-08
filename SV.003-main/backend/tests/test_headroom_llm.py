"""Tests para integración Headroom en consultas clínicas."""

from headroom_llm import (
    HEADROOM_AVAILABLE,
    build_system_with_cache,
    get_status,
    is_headroom_enabled,
    optimize_consultation_messages,
)


def test_build_system_with_cache_returns_list(monkeypatch):
    monkeypatch.setenv("HEADROOM_PROMPT_CACHE", "1")
    result = build_system_with_cache("instrucciones veterinarias")
    assert isinstance(result, list)
    assert result[0]["cache_control"] == {"type": "ephemeral"}
    assert result[0]["text"] == "instrucciones veterinarias"


def test_build_system_with_cache_disabled(monkeypatch):
    monkeypatch.setenv("HEADROOM_PROMPT_CACHE", "0")
    result = build_system_with_cache("texto plano")
    assert result == "texto plano"


def test_optimize_passthrough_when_disabled(monkeypatch):
    monkeypatch.setenv("HEADROOM_ENABLED", "0")
    messages = [{"role": "user", "content": [{"type": "text", "text": "hola"}]}]
    out, stats = optimize_consultation_messages(messages, "claude-sonnet-4-6")
    assert out == messages
    assert stats == {}


def test_get_status_shape():
    status = get_status()
    assert "available" in status
    assert "enabled" in status
    assert "mode" in status
    if HEADROOM_AVAILABLE:
        assert status["available"] is True


def test_is_headroom_enabled_respects_env(monkeypatch):
    if not HEADROOM_AVAILABLE:
        monkeypatch.setenv("HEADROOM_ENABLED", "1")
        assert is_headroom_enabled() is False
        return
    monkeypatch.setenv("HEADROOM_ENABLED", "1")
    assert is_headroom_enabled() is True
    monkeypatch.setenv("HEADROOM_ENABLED", "0")
    assert is_headroom_enabled() is False
