"""Verifica la interpretación de laboratorio y sus fallos críticos."""

import asyncio

import pytest
from fastapi import HTTPException

import server_simple
from server_simple import _lab_analysis_prompt


def test_lab_prompt_text_paste_has_no_competing_instructions():
    prompt = _lab_analysis_prompt(
        "blood_test",
        patient_name="Max",
        additional_context="Vómito desde ayer",
        pasted="Hemoglobina: 12 g/dL",
        from_markitdown=False,
    )
    lowered = prompt.lower()
    assert "hemoglobina: 12 g/dl" in lowered
    assert "max" in lowered
    assert "vómito desde ayer" in lowered
    for forbidden in (
        "estructura tu respuesta",
        "hallazgos principales",
        "recomendaciones:",
        "interpreta los resultados",
        "analiza este",
    ):
        assert forbidden not in lowered


def test_lab_prompt_pdf_markdown_label():
    prompt = _lab_analysis_prompt(
        "pdf_report",
        patient_name=None,
        additional_context=None,
        pasted="Glucosa: 110 mg/dL",
        from_markitdown=True,
    )
    assert "extraídos del pdf" in prompt.lower()
    assert "glucosa: 110 mg/dl" in prompt.lower()


def test_lab_prompt_vision_attachment_note():
    prompt = _lab_analysis_prompt(
        "pdf_report",
        patient_name="Luna",
        additional_context=None,
        pasted=None,
        has_image_attachment=True,
    )
    assert "imágenes adjuntas" in prompt.lower()
    assert "luna" in prompt.lower()


def test_lab_interpretation_failure_does_not_persist_record(monkeypatch):
    async def fail_llm(*_args, **_kwargs):
        raise RuntimeError("Claude no disponible")

    def fail_insert(_row):
        raise AssertionError("No debe guardar un estudio cuando falla el LLM")

    monkeypatch.setattr(server_simple, "_require_vet_id", lambda _header=None: "vet-1")
    monkeypatch.setattr(
        server_simple,
        "get_profile",
        lambda _vet_id: ({"id": "vet-1", "email": "vet@test.com", "membership_type": "premium"}, None),
    )
    monkeypatch.setattr(server_simple, "send_llm_message", fail_llm)
    monkeypatch.setattr(server_simple, "insert_medical_image", fail_insert)

    request = server_simple.ImageInterpretRequest(
        veterinarian_id="vet-1",
        image_type="blood_test",
        patient_name="Max",
        pasted_study_data="Hemoglobina: 12 g/dL",
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(server_simple.interpret_medical_image(request, x_veterinarian_id="vet-1"))

    assert exc.value.status_code == 502
    assert "Claude no disponible" in exc.value.detail
