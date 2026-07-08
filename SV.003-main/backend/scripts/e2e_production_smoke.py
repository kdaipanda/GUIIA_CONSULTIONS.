#!/usr/bin/env python3
"""Prueba funcional de producción GUIAA (solo API, sin crear cuentas)."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

API = os.getenv("PROBE_API_BASE", "https://api.guiaa.vet").rstrip("/")
DEV_EMAIL = os.getenv("SMOKE_DEV_EMAIL", "carlos.hernandez@vetmed.com")
DEV_CEDULA = os.getenv("SMOKE_DEV_CEDULA", "87654321")
ORIGIN = "https://guiaa.vet"


def req(method: str, path: str, *, headers=None, body=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json", **(headers or {})}
    request = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(request, timeout=25) as resp:
            raw = resp.read().decode()
            try:
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                payload = {"raw": raw[:300]}
            return resp.status, payload
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"detail": raw[:300]}
        return exc.code, payload


def main() -> int:
    print(f"=== Prueba funcional @ {API} ===\n")
    failures = 0
    token = None
    vet_id = None

    def check(label: str, ok: bool, detail: str = ""):
        nonlocal failures
        print(f"  [{'OK' if ok else 'FAIL'}] {label}" + (f" — {detail}" if detail else ""))
        if not ok:
            failures += 1

    # Infra
    code, health = req("GET", "/health")
    check("Health", code == 200 and health.get("status") == "healthy", str(health.get("environment")))
    check("Email Resend", health.get("email_configured") is True)
    check("Stripe publishable", health.get("stripe_publishable_configured") is True)
    check("Frontend URL", health.get("frontend_url_ok") is True)

    # Públicos
    code, pkgs = req("GET", "/api/membership/packages", headers={"Origin": ORIGIN})
    check("Membresías", code == 200 and bool(pkgs.get("packages")), f"{code}")

    code, stripe = req("GET", "/api/stripe/config", headers={"Origin": ORIGIN})
    check(
        "Stripe config",
        code == 200 and stripe.get("publishable_key_configured"),
        stripe.get("mode", ""),
    )

    code, _ = req("GET", "/api/payments/checkout/status/sim_probe_test")
    check("Checkout protegido", code == 401, f"{code}")

    # Login legacy dev
    code, login = req(
        "POST",
        "/api/auth/login",
        headers={"Origin": ORIGIN},
        body={"email": DEV_EMAIL, "cedula_profesional": DEV_CEDULA},
    )
    has_token = bool(login.get("access_token"))
    vet_id = login.get("id") or login.get("veterinarian_id")
    flow = login.get("status")
    if flow == "requires_cedula_flow":
        check("Login dev (flujo cédula)", bool(vet_id), flow)
    else:
        check("Login dev", code == 200 and has_token, f"{code} id={str(vet_id)[:8] if vet_id else '?'}…")
    token = login.get("access_token")

    if token and vet_id:
        auth = {
            "Authorization": f"Bearer {token}",
            "x-veterinarian-id": vet_id,
            "Origin": ORIGIN,
        }
        code, profile = req("GET", "/api/auth/profile", headers=auth)
        check(
            "Perfil autenticado",
            code == 200 and profile.get("email"),
            profile.get("email", ""),
        )
        check(
            "Perfil sin password_hash expuesto",
            "password_hash" not in profile,
        )
        has_pw = profile.get("has_password")
        check("Campo has_password", "has_password" in profile, f"has_password={has_pw}")

        code, cons = req("GET", "/api/consultations", headers=auth)
        n = len(cons.get("consultations") or [])
        check("Listar consultas", code == 200, f"{n} consultas")

        code, _ = req(
            "GET",
            f"/api/consultations/{vet_id}/history",
            headers=auth,
        )
        check("Historial propio", code == 200, f"{code}")

        code, _ = req(
            "GET",
            "/api/consultations",
            headers={**auth, "x-veterinarian-id": "00000000-0000-0000-0000-000000000099"},
        )
        check("IDOR bloqueado", code == 403, f"{code}")

        code, cats = req("GET", "/api/animal-categories", headers=auth)
        check("Categorías animales", code == 200 and bool(cats.get("categories")), f"{code}")

    # Validación registro (no crea cuenta)
    code, reg = req(
        "POST",
        "/api/auth/register",
        headers={"Origin": ORIGIN},
        body={
            "nombre": "Test",
            "email": "invalid",
            "telefono": "555",
            "cedula_profesional": "1",
            "especialidad": "General",
            "años_experiencia": 1,
            "institucion": "Test",
            "password": "short",
        },
    )
    check("Registro valida entrada", code in (400, 422), f"{code}")

    code, bad = req(
        "POST",
        "/api/auth/login",
        headers={"Origin": ORIGIN},
        body={"email": "noexiste@guiaa.vet", "password": "wrongpassword123"},
    )
    check("Login inválido rechazado", code == 401, f"{code}")

    print()
    if failures:
        print(f"FALLÓ: {failures} prueba(s)")
        return 1
    print("Todas las pruebas pasaron. Prueba manual en navegador: login, registro, membresía.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
