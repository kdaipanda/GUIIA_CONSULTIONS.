"""Tests unitarios para admin_metrics (sin Supabase/PostHog reales)."""
from __future__ import annotations

import admin_metrics as am


def test_clamp_days():
    assert am._clamp_days(None) == 30
    assert am._clamp_days(7) == 7
    assert am._clamp_days(0) == 1
    assert am._clamp_days(999) == 90
    assert am._clamp_days("nope") == 30


def test_empty_day_series():
    series = am._empty_day_series("2026-09-01", "2026-09-03")
    assert list(series.keys()) == ["2026-09-01", "2026-09-02", "2026-09-03"]
    assert all(v == 0 for v in series.values())


def test_metric_value_and_change():
    assert am._metric_value({"current": 12}) == 12.0
    assert am._metric_value({"current": "3.5%"}) == 3.5
    assert am._metric_value(None) is None
    change = am._metric_change({"change": {"percent": 10, "direction": "Up"}})
    assert change == {"percent": 10, "direction": "Up"}


def test_posthog_config_unconfigured(monkeypatch):
    monkeypatch.delenv("POSTHOG_PERSONAL_API_KEY", raising=False)
    monkeypatch.delenv("POSTHOG_PROJECT_ID", raising=False)
    cfg = am.posthog_config()
    assert cfg["configured"] is False


def test_posthog_config_key_only(monkeypatch):
    monkeypatch.setenv("POSTHOG_PERSONAL_API_KEY", "phx_test")
    monkeypatch.delenv("POSTHOG_PROJECT_ID", raising=False)
    cfg = am.posthog_config()
    assert cfg["configured"] is True
    assert cfg["api_key"] == "phx_test"
    assert cfg["project_id"] is None
