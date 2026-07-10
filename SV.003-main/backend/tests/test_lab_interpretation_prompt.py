"""Verifica que la interpretación de laboratorio no añada prompts competidores."""

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
