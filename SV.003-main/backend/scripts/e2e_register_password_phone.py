#!/usr/bin/env python3
"""Prueba E2E: registro con teléfono + contraseña válida + login.

Uso:
  python scripts/e2e_register_password_phone.py
"""
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
PASSWORD = "Vet2024"
PHONE = "+52 55 9988 7766"


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
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                payload = {"raw": raw[:500]}
            return resp.status, payload
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"detail": raw[:500]}
        return exc.code, payload


def cleanup_user(email: str) -> str:
    try:
        from user_deletion import delete_user_account

        ok, err, detail = delete_user_account(email)
        if ok:
            return "borrado"
        return f"no borrado: {err or detail}"
    except Exception as exc:  # noqa: BLE001
        return f"cleanup omitido: {exc}"


def main() -> int:
    suffix = random.randint(100000, 999999)
    email = f"e2e-pwphone-{suffix}@example.invalid"
    cedula = f"E2E{suffix}"
    failures = 0

    def check(label: str, ok: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  [{'OK' if ok else 'FAIL'}] {label}" + (f" -- {detail}" if detail else ""))
        if not ok:
            failures += 1

    print(f"=== E2E registro + teléfono + contraseña @ {API} ===")
    print(f"Email: {email}\n")

    # 1) Contraseña inválida debe rechazarse
    code, bad = req(
        "POST",
        "/api/auth/register",
        body={
            "nombre": "Dr E2E Password",
            "email": f"bad-{email}",
            "telefono": PHONE,
            "profesional_pais": "MX",
            "cedula_profesional": f"BAD{suffix}",
            "especialidad": "Medicina General",
            "años_experiencia": 2,
            "institucion": "UNAM",
            "password": "abc",  # muy corta, sin número
        },
    )
    check(
        "1. Contrasena invalida -> HTTP 4xx",
        code in (400, 422),
        f"{code} {bad.get('detail')}",
    )

    # 2) Teléfono inválido debe rechazarse
    code, bad_phone = req(
        "POST",
        "/api/auth/register",
        body={
            "nombre": "Dr E2E Phone",
            "email": f"phone-{email}",
            "telefono": "123",
            "profesional_pais": "MX",
            "cedula_profesional": f"PH{suffix}",
            "especialidad": "Medicina General",
            "años_experiencia": 2,
            "institucion": "UNAM",
            "password": PASSWORD,
        },
    )
    check(
        "2. Telefono invalido -> HTTP 4xx",
        code in (400, 422),
        f"{code} {bad_phone.get('detail')}",
    )

    # 3) Registro válido
    code, reg = req(
        "POST",
        "/api/auth/register",
        body={
            "nombre": "Dr E2E Password Phone",
            "email": email,
            "telefono": PHONE,
            "profesional_pais": "MX",
            "cedula_profesional": cedula,
            "especialidad": "Medicina General",
            "años_experiencia": 2,
            "institucion": "UNAM",
            "password": PASSWORD,
        },
    )
    vet_id = reg.get("id") if isinstance(reg, dict) else None
    token = reg.get("access_token") if isinstance(reg, dict) else None
    check("3. Registro válido HTTP 200", code == 200, str(code))
    check("3. Devuelve id + token", bool(vet_id and token))
    check("3. has_password=true", isinstance(reg, dict) and reg.get("has_password") is True)
    check(
        "3. Teléfono guardado",
        isinstance(reg, dict) and PHONE in str(reg.get("telefono") or ""),
        str(reg.get("telefono") if isinstance(reg, dict) else ""),
    )
    check(
        "3. password_hash no expuesto",
        isinstance(reg, dict) and "password_hash" not in reg,
    )

    if not vet_id:
        print("\nAbortando: registro incompleto.")
        cleanup_user(email)
        return 1

    # 4) Login con la misma contraseña
    code, login = req(
        "POST",
        "/api/auth/login",
        body={"email": email, "password": PASSWORD},
    )
    check(
        "4. Login con contraseña válida",
        code == 200
        and (
            bool(login.get("access_token"))
            or login.get("status") == "requires_cedula_flow"
        ),
        f"{code} status={login.get('status') if isinstance(login, dict) else None}",
    )

    # 5) Login con contraseña incorrecta
    code, bad_login = req(
        "POST",
        "/api/auth/login",
        body={"email": email, "password": "Wrong99"},
    )
    check("5. Login contrasena incorrecta -> 401", code == 401, str(code))

    # 6) Cleanup
    cleanup = cleanup_user(email)
    check("6. Usuario de prueba eliminado", cleanup == "borrado", cleanup)

    print()
    if failures:
        print(f"FALLÓ: {failures} prueba(s)")
        return 1
    print("Registro + teléfono + contraseña: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
