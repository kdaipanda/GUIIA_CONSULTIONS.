#!/usr/bin/env python3
"""Verifica en producción Stripe, membresías, checkout y webhooks (sin cobrar)."""
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
ORIGIN = os.getenv("PROBE_WEB_BASE", "https://guiaa.vet").rstrip("/")
DEV_EMAIL = os.getenv("SMOKE_DEV_EMAIL", "carlos.hernandez@vetmed.com")
DEV_CEDULA = os.getenv("SMOKE_DEV_CEDULA", "87654321")


def req(method: str, path: str, *, headers=None, body=None, raw: bytes | None = None):
    url = f"{API}{path}"
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    h = {"Origin": ORIGIN, **(headers or {})}
    if body is not None and raw is None:
        h.setdefault("Content-Type", "application/json")
    request = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(request, timeout=45) as resp:
            payload_raw = resp.read().decode()
            try:
                payload = json.loads(payload_raw) if payload_raw else {}
            except json.JSONDecodeError:
                payload = {"raw": payload_raw[:400]}
            return resp.status, payload
    except urllib.error.HTTPError as exc:
        payload_raw = exc.read().decode()
        try:
            payload = json.loads(payload_raw) if payload_raw else {}
        except json.JSONDecodeError:
            payload = {"detail": payload_raw[:400]}
        return exc.code, payload


def main() -> int:
    print(f"=== Verificacion de pagos @ {API} ===\n")
    failures = 0
    created_sessions: list[str] = []

    def check(label: str, ok: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  [{'OK' if ok else 'FAIL'}] {label}" + (f" — {detail}" if detail else ""))
        if not ok:
            failures += 1

    # 1) Infra / Stripe flags
    code, health = req("GET", "/health")
    check("Health", code == 200 and health.get("status") == "healthy", str(health.get("environment")))
    check("Stripe secret configurado", health.get("stripe_secret_configured") is True)
    check("Stripe publishable configurado", health.get("stripe_publishable_configured") is True)
    check("Frontend URL", health.get("frontend_url_ok") is True)

    code, stripe_cfg = req("GET", "/api/stripe/config")
    mode = (stripe_cfg.get("mode") or "").lower()
    check("Stripe config HTTP 200", code == 200, f"mode={mode}")
    check("Modo live (produccion)", mode == "live", mode or "sin mode")
    check("Webhook secret configurado", stripe_cfg.get("webhook_secret_configured") is True)
    check("SDK Stripe disponible", stripe_cfg.get("stripe_sdk_available") is True)
    check(
        "Metodos MX incluyen card",
        "card" in (stripe_cfg.get("payment_methods_mexico") or []),
        str(stripe_cfg.get("payment_methods_mexico")),
    )

    # 2) Catalogos
    code, pkgs = req("GET", "/api/membership/packages")
    packages = pkgs.get("packages") or {}
    check(
        "Paquetes membresia",
        code == 200 and all(k in packages for k in ("basic", "professional", "premium")),
        f"keys={list(packages.keys()) if isinstance(packages, dict) else type(packages)}",
    )
    if isinstance(packages, dict) and packages.get("professional"):
        pro = packages["professional"]
        check(
            "Precio profesional mensual > 0",
            float(pro.get("price_monthly") or 0) > 0,
            f"{pro.get('price_monthly')} {pro.get('currency')}",
        )

    code, credits = req("GET", "/api/consultations/credit-packages")
    credit_pkgs = credits.get("packages") or {}
    check(
        "Paquetes recarga consultas",
        code == 200 and bool(credit_pkgs),
        f"keys={list(credit_pkgs.keys()) if isinstance(credit_pkgs, dict) else '?'}",
    )

    code, promo = req("GET", "/api/stripe/promo-status")
    check("Promo status responde", code == 200, str(promo.get("status") or promo.get("error") or code))

    # 3) Seguridad
    code, _ = req("GET", "/api/payments/checkout/status/cs_test_probe")
    check("Status checkout sin auth -> 401", code == 401, f"{code}")

    code, _ = req("POST", "/api/payments/checkout/session", body={"package": "professional", "billing_cycle": "monthly", "origin_url": ORIGIN})
    check("Checkout membresia sin auth -> 401/403", code in (401, 403), f"{code}")

    code, wh = req("POST", "/api/payments/stripe/webhook", raw=b"{}", headers={"Content-Type": "application/json"})
    check(
        "Webhook sin firma Stripe rechazado",
        code in (400, 401, 403),
        f"{code} {wh.get('detail') if isinstance(wh, dict) else ''}"[:120],
    )

    # 4) Login + crear sesiones reales (sin pagar)
    code, login = req(
        "POST",
        "/api/auth/login",
        body={"email": DEV_EMAIL, "cedula_profesional": DEV_CEDULA},
    )
    token = login.get("access_token")
    vet_id = login.get("id") or login.get("veterinarian_id")
    check("Login para checkout", code == 200 and bool(token), f"{code}")
    if not token or not vet_id:
        print("\nAbortando: no hay sesion autenticada.")
        return 1

    auth = {
        "Authorization": f"Bearer {token}",
        "x-veterinarian-id": vet_id,
    }

    # Membresia
    code, member_session = req(
        "POST",
        "/api/payments/checkout/session",
        headers=auth,
        body={
            "package": "professional",
            "package_id": "professional",
            "billing_cycle": "monthly",
            "origin_url": ORIGIN,
        },
    )
    m_url = member_session.get("checkout_url") if isinstance(member_session, dict) else None
    m_sid = member_session.get("session_id") if isinstance(member_session, dict) else None
    check("Crear checkout membresia", code == 200 and bool(m_url) and bool(m_sid), f"{code}")
    if m_sid:
        created_sessions.append(m_sid)
    check(
        "URL checkout Stripe (membresia)",
        bool(m_url) and "checkout.stripe.com" in str(m_url),
        (str(m_url)[:70] + "...") if m_url else "",
    )
    check(
        "Session ID live (cs_live_...)",
        bool(m_sid) and str(m_sid).startswith("cs_live_"),
        str(m_sid)[:24] if m_sid else "",
    )
    if isinstance(member_session, dict) and member_session.get("promo_requested"):
        check(
            "Promo solicitada aplicada o advertencia clara",
            member_session.get("promo_applied") is True or bool(member_session.get("promo_warning")),
            f"applied={member_session.get('promo_applied')} warn={member_session.get('promo_warning')}",
        )

    # Creditos
    credit_key = next(iter(credit_pkgs.keys()), None) if isinstance(credit_pkgs, dict) else None
    if credit_key:
        code, credit_session = req(
            "POST",
            "/api/payments/consultations/checkout/session",
            headers=auth,
            body={
                "veterinarian_id": vet_id,
                "package_id": credit_key,
                "quantity": 1,
                "origin_url": ORIGIN,
            },
        )
        c_url = credit_session.get("checkout_url") if isinstance(credit_session, dict) else None
        c_sid = credit_session.get("session_id") if isinstance(credit_session, dict) else None
        check("Crear checkout recarga consultas", code == 200 and bool(c_url), f"{code} pkg={credit_key}")
        if c_sid:
            created_sessions.append(c_sid)
        check(
            "URL checkout Stripe (creditos)",
            bool(c_url) and "checkout.stripe.com" in str(c_url),
            (str(c_url)[:70] + "...") if c_url else "",
        )
        check(
            "Session ID live creditos",
            bool(c_sid) and str(c_sid).startswith("cs_live_"),
            str(c_sid)[:24] if c_sid else "",
        )
    else:
        check("Paquete de creditos disponible", False, "catalogo vacio")

    # 5) Status de sesion creada
    if created_sessions:
        sid = created_sessions[0]
        code, status = req("GET", f"/api/payments/checkout/status/{sid}", headers=auth)
        pay_status = status.get("payment_status") or status.get("status")
        check(
            "Status checkout de sesion propia",
            code == 200,
            f"{code} payment_status={pay_status}",
        )
        # IDOR
        code, _ = req(
            "GET",
            f"/api/payments/checkout/status/{sid}",
            headers={**auth, "x-veterinarian-id": "00000000-0000-0000-0000-000000000099"},
        )
        check("IDOR status checkout bloqueado", code == 403, f"{code}")

    # 6) Transacciones recientes en Supabase (si hay credenciales locales)
    try:
        from supabase_client import get_supabase_client

        client = get_supabase_client()
        resp = (
            client.table("payment_transactions")
            .select("session_id,type,status,payment_status,amount,currency,stripe,created_at")
            .eq("veterinarian_id", vet_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        rows = resp.data or []
        check("Transacciones guardadas en DB", len(rows) > 0, f"{len(rows)} recientes")
        if created_sessions and rows:
            matched = any(r.get("session_id") in created_sessions for r in rows)
            check("Sesion de prueba persistida", matched, created_sessions[0][:20])
            unpaid_ok = all(
                (r.get("payment_status") in (None, "unpaid", "open") or r.get("status") in ("open", "pending"))
                for r in rows
                if r.get("session_id") in created_sessions
            )
            check("Sesiones de prueba siguen unpaid/open", unpaid_ok)
    except Exception as exc:  # noqa: BLE001
        print(f"  [SKIP] Lectura payment_transactions: {exc}")

    print("\n=== Resumen ===")
    print("  Sesiones Stripe creadas (no cobradas, puedes ignorarlas o expirarlas):")
    for sid in created_sessions:
        print(f"    - {sid}")
    print("  Para prueba manual: Membresia en https://guiaa.vet/app/membresia")
    print("  Usa tarjeta de prueba solo en modo test; en live usa monto real o cancela en Stripe Checkout.")

    print()
    if failures:
        print(f"FALLO: {failures} comprobacion(es)")
        return 1
    print("Pagos: nucleo OK (config live, catalogos, checkout Stripe, webhook protegido).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
