#!/usr/bin/env python3
"""Verifica en producción el historial clínico unificado (CDS + laboratorio)."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

API = os.getenv("PROBE_API_BASE", "https://api.guiaa.vet").rstrip("/")
ORIGIN = os.getenv("PROBE_WEB_BASE", "https://guiaa.vet").rstrip("/")
DEV_EMAIL = os.getenv("SMOKE_DEV_EMAIL", "carlos.hernandez@vetmed.com")
DEV_CEDULA = os.getenv("SMOKE_DEV_CEDULA", "87654321")


def req(method: str, path: str, *, headers=None, body=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json", **(headers or {})}
    request = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as resp:
            raw = resp.read().decode()
            payload = json.loads(raw) if raw else {}
            return resp.status, payload
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"detail": raw[:400]}
        return exc.code, payload


def main() -> int:
    print(f"=== Verificación historial clínico @ {API} ===\n")
    failures = 0

    def check(label: str, ok: bool, detail: str = ""):
        nonlocal failures
        print(f"  [{'OK' if ok else 'FAIL'}] {label}" + (f" — {detail}" if detail else ""))
        if not ok:
            failures += 1

    code, login = req(
        "POST",
        "/api/auth/login",
        headers={"Origin": ORIGIN},
        body={"email": DEV_EMAIL, "cedula_profesional": DEV_CEDULA},
    )
    token = login.get("access_token")
    vet_id = login.get("id") or login.get("veterinarian_id")
    check("Login dev", code == 200 and bool(token), f"{code} flow={login.get('status')}")
    if not token or not vet_id:
        print("\nNo se pudo autenticar. Revisa credenciales SMOKE_DEV_EMAIL / SMOKE_DEV_CEDULA.")
        return 1

    auth = {
        "Authorization": f"Bearer {token}",
        "x-veterinarian-id": vet_id,
        "Origin": ORIGIN,
    }

    code, history = req("GET", f"/api/consultations/{vet_id}/history?limit=100", headers=auth)
    consultations = history.get("consultations") or []
    check("Historial consultas", code == 200, f"{len(consultations)} registros")

    code, images_payload = req("GET", "/api/medical-images/history?limit=100", headers=auth)
    images = images_payload.get("images") or []
    check("Historial laboratorio", code == 200, f"{len(images)} interpretaciones")

    consultation_ids = {c.get("id") for c in consultations if c.get("id")}
    linked = [img for img in images if img.get("consultation_id") in consultation_ids]
    standalone = [img for img in images if not img.get("consultation_id") or img.get("consultation_id") not in consultation_ids]
    check(
        "Datos para timeline unificado",
        len(consultations) > 0 or len(images) > 0,
        f"consultas={len(consultations)}, lab={len(images)}, ligados={len(linked)}, sueltos={len(standalone)}",
    )

    sample_consultation = None
    sample_with_refs = next((c for c in consultations if c.get("medical_images")), None)
    if linked:
        linked_cid = linked[0].get("consultation_id")
        sample_consultation = next((c for c in consultations if c.get("id") == linked_cid), None)
    if not sample_consultation and consultations:
        sample_consultation = consultations[0]

    if sample_consultation:
        cid = sample_consultation.get("id")
        code, detail = req("GET", f"/api/consultation/{cid}", headers=auth)
        linked_studies = detail.get("linked_studies") or []
        refs = detail.get("medical_images") or []
        check(
            "Detalle consulta con linked_studies",
            code == 200 and "linked_studies" in detail,
            f"{code} linked={len(linked_studies)} refs_payload={len(refs)}",
        )
        if linked_studies:
            first = linked_studies[0]
            check(
                "Interpretación ligada trae análisis",
                bool(first.get("analysis") or first.get("findings")),
                f"id={str(first.get('id'))[:8]}… type={first.get('image_type')}",
            )
        print(f"\n  Muestra consulta: {cid}")
        print(f"    Mascota: {(detail.get('nombre_mascota') or detail.get('form_data', {}).get('nombre_mascota') or '—')}")
        print(f"    Fecha: {detail.get('created_at')}")
        print(f"    Estudios vinculados: {len(linked_studies)}")
    else:
        check("Detalle consulta", False, "sin consultas para probar")

    code, patients_payload = req("GET", "/api/patients?limit=50", headers=auth)
    patients = patients_payload.get("patients") or []
    check("Listar pacientes clínica", code == 200, f"{len(patients)} pacientes")

    patient_with_history = None
    for patient in patients[:10]:
        pid = patient.get("id")
        if not pid:
            continue
        code, pdata = req("GET", f"/api/patients/{pid}", headers=auth)
        if code != 200:
            continue
        p_cons = pdata.get("consultations") or []
        p_imgs = pdata.get("medical_images") or []
        if p_cons or p_imgs:
            patient_with_history = pdata
            print(f"\n  Muestra paciente: {patient.get('name')} ({pid})")
            print(f"    Consultas: {len(p_cons)} · Laboratorio: {len(p_imgs)}")
            break

    check(
        "Ficha paciente con historial mixto",
        patient_with_history is not None,
        "al menos un paciente con consultas o estudios" if patient_with_history else "ningún paciente con datos",
    )

    print("\n=== Resumen para revision manual en https://guiaa.vet ===")
    print("  1. /app/historial - ver consultas + laboratorio juntos")
    print("  2. Clinica - Mascotas - abrir ficha - Historial clinico unificado")
    if sample_consultation:
        print(f"  3. Abrir consulta {sample_consultation.get('id')} - seccion laboratorio vinculado")
    if patient_with_history:
        pname = patient_with_history.get("patient", {}).get("name")
        print(f"  4. Paciente {pname} - timeline + PDF")

    print()
    if failures:
        print(f"FALLÓ: {failures} comprobación(es)")
        return 1
    print("Verificación API OK. Revisa en navegador con Ctrl+Shift+R.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
