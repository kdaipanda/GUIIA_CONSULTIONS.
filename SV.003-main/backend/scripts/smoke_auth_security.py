#!/usr/bin/env python3
"""Smoke test local de seguridad auth (Fase 1)."""
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

BASE = os.getenv("SMOKE_API_BASE", "http://127.0.0.1:8000").rstrip("/")
DEV_EMAIL = os.getenv("SMOKE_DEV_EMAIL", "carlos.hernandez@vetmed.com")
DEV_CEDULA = os.getenv("SMOKE_DEV_CEDULA", "87654321")


def req(method: str, path: str, *, headers=None, body=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json", **(headers or {})}
    request = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"detail": raw[:200]}
        return exc.code, payload


def main() -> int:
    print(f"=== Smoke auth security @ {BASE} ===\n")
    failures = 0

    # 1) Checkout status sin auth → 401
    code, _ = req("GET", "/api/payments/checkout/status/sim_test_session")
    ok = code == 401
    print(f"  [{'OK' if ok else 'FAIL'}] checkout/status sin JWT -> {code} (esperado 401)")
    failures += 0 if ok else 1

    # 2) Login dev
    code, login = req(
        "POST",
        "/api/auth/login",
        body={"email": DEV_EMAIL, "cedula_profesional": DEV_CEDULA},
    )
    token = login.get("access_token")
    vet_id = login.get("id")
    ok = code == 200 and token and vet_id
    print(f"  [{'OK' if ok else 'FAIL'}] login dev -> {code}, token={'si' if token else 'no'}")
    if not ok:
        print(f"       detalle: {login}")
        return 1

    auth_h = {
        "Authorization": f"Bearer {token}",
        "x-veterinarian-id": vet_id,
    }

    # 3) IDOR: header distinto al JWT → 403
    code, body = req(
        "GET",
        "/api/consultations",
        headers={**auth_h, "x-veterinarian-id": "00000000-0000-0000-0000-000000000099"},
    )
    ok = code == 403
    print(f"  [{'OK' if ok else 'FAIL'}] IDOR consultas header ajeno -> {code} (esperado 403)")
    if not ok:
        print(f"       detalle: {body}")
    failures += 0 if ok else 1

    # 4) Consultas propias → 200
    code, body = req("GET", "/api/consultations", headers=auth_h)
    ok = code == 200 and "consultations" in body
    print(f"  [{'OK' if ok else 'FAIL'}] consultas propias -> {code}")
    failures += 0 if ok else 1

    # 5) Historial ajeno en path → 403
    code, body = req(
        "GET",
        f"/api/consultations/00000000-0000-0000-0000-000000000099/history",
        headers=auth_h,
    )
    ok = code == 403
    print(f"  [{'OK' if ok else 'FAIL'}] historial ajeno -> {code} (esperado 403)")
    failures += 0 if ok else 1

    # 6) Perfil propio → 200
    code, _ = req("GET", "/api/auth/profile", headers=auth_h)
    ok = code == 200
    print(f"  [{'OK' if ok else 'FAIL'}] /api/auth/profile -> {code}")
    failures += 0 if ok else 1

    print()
    if failures:
        print(f"FALLO: {failures} comprobacion(es)")
        return 1
    print("Todas las comprobaciones pasaron.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
