"""Tests for development-only account shortcuts."""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import cedula_verification  # noqa: E402
import server_simple  # noqa: E402


def test_dev_account_shortcuts_are_disabled_in_production(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("ALLOW_DEV_ACCOUNT_SHORTCUTS", raising=False)

    assert server_simple.is_dev_user("basico@guiaa.vet") is False
    assert cedula_verification.is_dev_user("basico@guiaa.vet") is False


def test_dev_account_shortcuts_still_work_outside_production(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.delenv("ALLOW_DEV_ACCOUNT_SHORTCUTS", raising=False)

    assert server_simple.is_dev_user("basico@guiaa.vet") is True
    assert cedula_verification.is_dev_user("basico@guiaa.vet") is True


def test_dev_account_shortcuts_can_be_explicitly_enabled(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("ALLOW_DEV_ACCOUNT_SHORTCUTS", "true")

    assert server_simple.is_dev_user("basico@guiaa.vet") is True
    assert cedula_verification.is_dev_user("basico@guiaa.vet") is True
