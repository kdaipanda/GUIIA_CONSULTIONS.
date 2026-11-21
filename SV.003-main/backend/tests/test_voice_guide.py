"""Tests unitarios — extracción regla-based guía de voz Plumitas."""
from fastapi import FastAPI
from fastapi.testclient import TestClient

import voice_guide
from voice_guide import (
    PERROS_GUIDE_FIELDS,
    extract_value_rule_based,
    _field_by_id,
    voice_guide_router,
)


def _field(field_id: str):
    f = _field_by_id("perros", field_id)
    assert f is not None
    return f


def test_script_has_core_fields():
    ids = {f["id"] for f in PERROS_GUIDE_FIELDS}
    assert "nombre_mascota" in ids
    assert "sexo" in ids
    assert "vacunas_vigentes" in ids


def test_extract_nombre():
    r = extract_value_rule_based(_field("nombre_mascota"), "se llama Luna")
    assert r["value"] == "Luna"
    assert r["skipped"] is False


def test_extract_sexo():
    assert extract_value_rule_based(_field("sexo"), "es hembra")["value"] == "hembra"
    assert extract_value_rule_based(_field("sexo"), "macho")["value"] == "macho"


def test_extract_yesno():
    assert extract_value_rule_based(_field("vacunas_vigentes"), "sí")["value"] == "SI"
    assert extract_value_rule_based(_field("vacunas_vigentes"), "no")["value"] == "NO"


def test_extract_peso():
    assert extract_value_rule_based(_field("peso"), "pesa 12.5 kilos")["value"] == "12.5"


def test_skip_vitals():
    r = extract_value_rule_based(_field("temperatura"), "omitir")
    assert r["skipped"] is True
    assert r["value"] is None


def test_repro_status():
    assert (
        extract_value_rule_based(_field("estado_reproductivo"), "está esterilizada")["value"]
        == "castrado"
    )


def test_habitat_maps_to_enum():
    assert extract_value_rule_based(_field("habitat"), "vive en casa")["value"] == "INTERIOR"
    assert extract_value_rule_based(_field("habitat"), "en el patio")["value"] == "EXTERIOR"


def test_speak_endpoint_rate_limits_before_tts(monkeypatch):
    app = FastAPI()
    app.include_router(voice_guide_router)
    calls = []

    monkeypatch.setattr(
        voice_guide.auth_security,
        "resolve_authenticated_vet_id",
        lambda _header=None: "vet-123",
    )

    def fake_check_rate_limit(request, scope, identifier="", *, max_attempts=None, window_seconds=None):
        calls.append((scope, identifier, max_attempts, window_seconds))
        if scope == "voice_guide_speak_user":
            from fastapi import HTTPException

            raise HTTPException(status_code=429, detail="limited")

    monkeypatch.setattr(voice_guide.rate_limit, "check_rate_limit", fake_check_rate_limit)

    async def fail_tts(*args, **kwargs):
        raise AssertionError("TTS should not run after rate limiting")

    monkeypatch.setattr(voice_guide, "synthesize_speech", fail_tts)

    response = TestClient(app).post("/api/voice-guide/speak", json={"text": "hola"})

    assert response.status_code == 429
    assert calls == [("voice_guide_speak_user", "vet-123", 40, 600)]
