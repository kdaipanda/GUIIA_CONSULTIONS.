"""Regresiones para merges de payload al completar análisis CDS."""

from __future__ import annotations

from server_simple import _payload_with_charged_credit


def test_charged_credit_preserves_latest_payload_fields():
    initial_payload = {
        "category": "perros",
        "form_data": {"nombre_mascota": "Max", "peso": "10"},
        "detalle_paciente": "observación inicial",
        "credit": {"policy": "on_analysis"},
    }
    latest_payload = {
        "category": "perros",
        "form_data": {"nombre_mascota": "Max", "peso": "12"},
        "detalle_paciente": "observación guardada durante el análisis",
        "credit": {"policy": "on_analysis", "reserved_at": "2026-11-25T12:00:00Z"},
    }

    merged = _payload_with_charged_credit(
        latest_payload,
        initial_payload,
        initial_payload["credit"],
        "2026-11-25T12:05:00Z",
    )

    assert merged["form_data"]["peso"] == "12"
    assert merged["detalle_paciente"] == "observación guardada durante el análisis"
    assert merged["credit"]["policy"] == "on_analysis"
    assert merged["credit"]["reserved_at"] == "2026-11-25T12:00:00Z"
    assert merged["credit"]["charged_at"] == "2026-11-25T12:05:00Z"
