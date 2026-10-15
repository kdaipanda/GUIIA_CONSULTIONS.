"""Tests para compatibilidad del LLM B2C de dueños."""

from owner_llm import resolve_owner_anthropic_model


def test_owner_llm_defaults_to_current_model(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_MODEL", raising=False)

    assert resolve_owner_anthropic_model() == "claude-sonnet-4-6"


def test_owner_llm_remaps_deprecated_model(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")

    assert resolve_owner_anthropic_model() == "claude-sonnet-4-6"


def test_owner_llm_keeps_explicit_current_model(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_MODEL", "claude-opus-4-1")

    assert resolve_owner_anthropic_model() == "claude-opus-4-1"
