#!/usr/bin/env python3
"""Prueba E2E del alta de usuario: registro → cédula → login con contraseña."""
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


def req(method: str, path: str, *, headers=None, body=None, raw_body: bytes | None = None):
    url = f"{API}{path}"
    data = raw_body if raw_body is not None else (json.dumps(body).encode() if body is not None else None)
    h = {"Origin": ORIGIN, **(headers or {})}
    if body is not None and raw_body is None:
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


def auth_headers(vet_id: str, token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "x-veterinarian-id": vet_id,
    }


def upload_cedula(vet_id: str, token: str) -> tuple[int, dict | str]:
    boundary = "----WebKitFormBoundaryE2ERegister"
    file_bytes = b"\xff\xd8\xff\xe0" + b"x" * 256
    raw = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="cedula-test.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode() + file_bytes + f"\r\n--{boundary}--\r\n".encode()
    return req(
        "POST",
        "/api/cedula/upload",
        headers={
            **auth_headers(vet_id, token),
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        raw_body=raw,
    )


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
    email = f"e2e-register-{suffix}@example.invalid"
    cedula = f"E2E{suffix}"
    nombre = "Dr E2E Registro Test"

    print(f"=== E2E alta de usuario @ {API} ===")
    print(f"Email prueba: {email}\n")

    failures = 0

    def check(label: str, ok: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  [{'OK' if ok else 'FAIL'}] {label}" + (f" — {detail}" if detail else ""))
        if not ok:
            failures += 1

    # 1) Registro
    code, reg = req(
        "POST",
        "/api/auth/register",
        body={
            "nombre": nombre,
            "email": email,
            "telefono": "5512345678",
            "profesional_pais": "MX",
            "cedula_profesional": cedula,
            "especialidad": "Medicina General",
            "años_experiencia": 3,
            "institucion": "UNAM",
            "password": PASSWORD,
        },
    )
    vet_id = reg.get("id") if isinstance(reg, dict) else None
    token = reg.get("access_token") if isinstance(reg, dict) else None
    check("1. Registro HTTP 200", code == 200, f"{code}")
    check("1. Registro devuelve id", bool(vet_id), str(vet_id)[:8] if vet_id else "")
    check("1. Registro devuelve access_token", bool(token), "")
    check(
        "1. Registro incluye cedula_profesional",
        isinstance(reg, dict) and reg.get("cedula_profesional") == cedula,
        reg.get("cedula_profesional") if isinstance(reg, dict) else "",
    )
    check(
        "1. has_password=true tras registro",
        isinstance(reg, dict) and reg.get("has_password") is True,
        f"has_password={reg.get('has_password') if isinstance(reg, dict) else '?'}",
    )
    check(
        "1. password_hash no expuesto",
        isinstance(reg, dict) and "password_hash" not in reg,
        "",
    )

    if not vet_id or not token:
        print("\nAbortando: registro incompleto.")
        cleanup_user(email)
        return 1

    auth = auth_headers(vet_id, token)

    # 2) Perfil con JWT
    code, profile = req("GET", "/api/auth/profile", headers=auth)
    check("2. Perfil autenticado", code == 200 and profile.get("email") == email, f"{code}")
    check(
        "2. Perfil conserva cedula",
        profile.get("cedula_profesional") == cedula,
        profile.get("cedula_profesional", ""),
    )

    # 3) Login con contraseña → flujo cédula con matrícula en respuesta
    code, login_pw = req(
        "POST",
        "/api/auth/login",
        body={"email": email, "password": PASSWORD},
    )
    flow = login_pw.get("status") if isinstance(login_pw, dict) else None
    check(
        "3. Login con contraseña → requires_cedula_flow",
        code == 200 and flow == "requires_cedula_flow",
        flow or str(code),
    )
    check(
        "3. Flujo cédula incluye cedula_profesional",
        login_pw.get("cedula_profesional") == cedula,
        login_pw.get("cedula_profesional", ""),
    )
    check(
        "3. Flujo cédula incluye nonce temporal",
        bool(login_pw.get("cedula_flow_nonce")),
        "",
    )
    check(
        "3. Flujo cédula incluye expected_nombre",
        login_pw.get("expected_nombre") == nombre,
        login_pw.get("expected_nombre", ""),
    )

    # 4) Subida de documento
    code, upload = upload_cedula(vet_id, token)
    check("4. Upload cédula HTTP 200", code == 200, f"{code} {upload}")
    doc_url = upload.get("cedula_document_url") if isinstance(upload, dict) else None
    check("4. Upload devuelve URL", bool(doc_url), str(doc_url)[:60] if doc_url else "")

    # 5) Verificación SEP/manual
    code, verify = req(
        "POST",
        "/api/cedula/verify",
        headers=auth,
        body={
            "veterinarian_id": vet_id,
            "cedula_profesional": cedula,
            "expected_nombre": nombre,
        },
    )
    status = verify.get("verification_status") if isinstance(verify, dict) else None
    check(
        "5. Verify cédula HTTP 200",
        code == 200,
        f"{code} status={status}",
    )
    check(
        "5. Estado pending o verified",
        status in ("pending", "verified"),
        status or "",
    )

    # 6) Login final con contraseña (usuario ya con documento)
    code, login_final = req(
        "POST",
        "/api/auth/login",
        body={"email": email, "password": PASSWORD},
    )
    final_token = login_final.get("access_token") if isinstance(login_final, dict) else None
    final_status = login_final.get("status") if isinstance(login_final, dict) else None
    check(
        "6. Login final con contraseña",
        code == 200 and bool(final_token) and final_status != "requires_cedula_flow",
        f"{code} status={final_status}",
    )

    # 7) Skip disponible para usuarios nuevos (opcional, no bloquea)
    if isinstance(login_final, dict) and login_final.get("status") == "requires_cedula_flow":
        nonce = login_pw.get("cedula_flow_nonce", "")
        code, skip = req(
            "POST",
            "/api/cedula/skip",
            headers={
                "x-veterinarian-id": vet_id,
                "x-cedula-flow-nonce": nonce,
            },
        )
        check("7. Skip cédula (si aplica)", code == 200, f"{code}")

    # 8) Limpieza
    cleanup_result = cleanup_user(email)
    check("8. Usuario de prueba eliminado", cleanup_result == "borrado", cleanup_result)

    print()
    if failures:
        print(f"FALLÓ: {failures} prueba(s)")
        return 1
    print("Flujo de alta completo: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
