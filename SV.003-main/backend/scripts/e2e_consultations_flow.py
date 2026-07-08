#!/usr/bin/env python3
"""E2E consultas: crear, payload, listar, historial (producción)."""
from __future__ import annotations

import json
import os
import random
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

API = os.getenv("PROBE_API_BASE", "https://api.guiaa.vet").rstrip("/")
ORIGIN = "https://guiaa.vet"
DEV_EMAIL = os.getenv("SMOKE_DEV_EMAIL", "carlos.hernandez@vetmed.com")
DEV_CEDULA = os.getenv("SMOKE_DEV_CEDULA", "87654321")


def req(method: str, path: str, *, headers=None, body=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    h = {"Origin": ORIGIN, **(headers or {})}
    if body is not None:
        h.setdefault("Content-Type", "application/json")
    request = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as resp:
            raw = resp.read().decode()
            try:
                return resp.status, json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return resp.status, {"raw": raw[:400]}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            return exc.code, json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return exc.code, {"detail": raw[:400]}


def auth(vet_id: str, token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "x-veterinarian-id": vet_id,
    }


def main() -> int:
    print(f"=== E2E consultas @ {API} ===\n")
    failures = 0
    created_id = None
    profile_before = None

    def check(label: str, ok: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  [{'OK' if ok else 'FAIL'}] {label}" + (f" — {detail}" if detail else ""))
        if not ok:
            failures += 1

    # Login dev
    code, login = req(
        "POST",
        "/api/auth/login",
        body={"email": DEV_EMAIL, "cedula_profesional": DEV_CEDULA},
    )
    vet_id = login.get("id") or login.get("veterinarian_id")
    token = login.get("access_token")
    check("Login dev", code == 200 and bool(token), f"{code}")
    if not vet_id or not token:
        return 1

    h = auth(vet_id, token)

    code, profile_before = req("GET", "/api/auth/profile", headers=h)
    remaining_before = profile_before.get("consultations_remaining") if isinstance(profile_before, dict) else None
    check("Perfil antes de consulta", code == 200, f"remaining={remaining_before}")

    # Categorías
    code, cats = req("GET", "/api/animal-categories", headers=h)
    categories = cats.get("categories") or []
    check("Categorías animales", code == 200 and len(categories) > 0, f"{len(categories)} especies")

    category = "perros"
    if categories:
        category = categories[0].get("id") or category

    # Crear consulta
    code, created = req(
        "POST",
        "/api/consultations",
        headers=h,
        body={
            "veterinarian_id": vet_id,
            "category": category,
            "consultation_data": {
                "nombre_mascota": "Luna E2E",
                "nombre_dueño": "QA Test",
                "raza": "Mestizo",
                "edad": "3 años",
                "motivo_consulta": "Prueba automatizada E2E",
            },
        },
    )
    created_id = created.get("id") if isinstance(created, dict) else None
    check("Crear consulta", code == 200 and bool(created_id), f"{code} id={str(created_id)[:8] if created_id else '?'}")

    # Listar consultas
    code, listing = req("GET", "/api/consultations", headers=h)
    items = listing.get("consultations") or []
    found = any((c.get("id") == created_id) for c in items) if created_id else False
    check("Listar consultas incluye nueva", code == 200 and (found or not created_id), f"{len(items)} total")

    # Historial
    code, hist = req("GET", f"/api/consultations/{vet_id}/history", headers=h)
    hist_items = hist.get("consultations") or hist.get("history") or hist if isinstance(hist, list) else []
    if isinstance(hist, dict):
        hist_items = hist.get("consultations") or []
    check("Historial propio", code == 200, f"{code} items={len(hist_items)}")

    # Detalle
    if created_id:
        code, detail = req("GET", f"/api/consultation/{created_id}", headers=h)
        check(
            "Detalle consulta",
            code == 200 and (detail.get("id") == created_id or detail.get("data", {}).get("id") == created_id),
            f"{code}",
        )

        # Actualizar payload
        code, updated = req(
            "PUT",
            f"/api/consultations/{created_id}/payload",
            headers=h,
            body={
                "payload": {
                    "category": category,
                    "form_data": {
                        "nombre_mascota": "Luna E2E",
                        "observaciones": "Actualizado por E2E",
                    },
                },
            },
        )
        check("Actualizar payload", code == 200, f"{code}")

        # IDOR: otro vet no puede leer
        code, idor = req(
            "GET",
            f"/api/consultation/{created_id}",
            headers=auth("00000000-0000-0000-0000-000000000099", token),
        )
        check("IDOR bloqueado en detalle", code == 403, f"{code}")

    # Créditos (solo si premium no unlimited - dev user is premium)
    code, profile_after = req("GET", "/api/auth/profile", headers=h)
    remaining_after = profile_after.get("consultations_remaining") if isinstance(profile_after, dict) else None
    if isinstance(profile_before, dict) and profile_before.get("membership_type") == "premium":
        check(
            "Premium no descuenta créditos al crear",
            remaining_after == remaining_before,
            f"{remaining_before} -> {remaining_after}",
        )
    elif remaining_before is not None and remaining_after is not None and created_id:
        check(
            "Trial/basic descuenta 1 crédito",
            remaining_after == max(0, int(remaining_before) - 1),
            f"{remaining_before} -> {remaining_after}",
        )

    # Fernando (usuario trial reciente)
    try:
        from supabase_client import get_profile_by_email

        fernando, _ = get_profile_by_email("ferciento@gmail.com")
        if fernando:
            rem = fernando.get("consultations_remaining")
            ced = fernando.get("cedula_verification_status")
            check(
                "Usuario Fernando tiene consultas trial",
                int(rem or 0) > 0,
                f"remaining={rem} cedula={ced}",
            )
    except Exception as exc:  # noqa: BLE001
        print(f"  [SKIP] Chequeo Fernando: {exc}")

    # Trial: registrar, posponer cédula, login de nuevo y crear consulta
    suffix = random.randint(100000, 999999)
    email = f"e2e-consult-{suffix}@example.invalid"
    cedula = f"CON{suffix}"
    code, reg = req(
        "POST",
        "/api/auth/register",
        body={
            "nombre": "Trial Consult Test",
            "email": email,
            "telefono": "5512345678",
            "profesional_pais": "MX",
            "cedula_profesional": cedula,
            "especialidad": "Medicina General",
            "años_experiencia": 2,
            "institucion": "UNAM",
            "password": "Vet2024",
        },
    )
    trial_id = reg.get("id") if isinstance(reg, dict) else None
    trial_token = reg.get("access_token") if isinstance(reg, dict) else None
    if code == 200 and trial_id and trial_token:
        th = auth(trial_id, trial_token)
        code, skip = req("POST", "/api/cedula/skip", headers=th)
        check("Trial: posponer cédula", code == 200, str(skip.get("cedula_skip_count") if isinstance(skip, dict) else code))

        code, relogin = req(
            "POST",
            "/api/auth/login",
            body={"email": email, "password": "Vet2024"},
        )
        relogin_token = relogin.get("access_token") if isinstance(relogin, dict) else None
        check(
            "Trial: re-login tras skip devuelve JWT",
            code == 200 and bool(relogin_token) and relogin.get("status") != "requires_cedula_flow",
            relogin.get("status") or str(code),
        )

        if relogin_token:
            rh = auth(trial_id, relogin_token)
            code, trial_cons = req(
                "POST",
                "/api/consultations",
                headers=rh,
                body={
                    "veterinarian_id": trial_id,
                    "category": category,
                    "consultation_data": {
                        "nombre_mascota": "Trial Skip",
                        "motivo_consulta": "E2E post-skip",
                    },
                },
            )
            check(
                "Trial: crear consulta tras re-login",
                code == 200 and bool(trial_cons.get("id")),
                f"{code}",
            )

        try:
            from user_deletion import delete_user_account

            check("Trial: limpieza usuario", delete_user_account(email)[0], email)
        except Exception as exc:  # noqa: BLE001
            print(f"  [SKIP] Limpieza trial: {exc}")
    else:
        check("Trial: registro para prueba skip", False, f"{code}")

    print()
    if failures:
        print(f"FALLÓ: {failures} prueba(s)")
        return 1
    print("Flujo de consultas: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
