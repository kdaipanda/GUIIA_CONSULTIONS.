#!/usr/bin/env python3
"""Checklist de producción GUIAA (api.guiaa.vet + guiaa.vet)."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

API = os.getenv("PROBE_API_BASE", "https://api.guiaa.vet").rstrip("/")
WEB = os.getenv("PROBE_WEB_BASE", "https://guiaa.vet").rstrip("/")


def req(method: str, url: str, *, headers=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json", **(headers or {})}
    request = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as resp:
            raw = resp.read().decode()
            try:
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                payload = {"raw": raw[:200]}
            return resp.status, payload, dict(resp.headers)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"detail": raw[:200]}
        return exc.code, payload, dict(exc.headers)


def main() -> int:
    print(f"=== Producción GUIAA @ {API} ===\n")
    failures = 0

    code, health, _ = req("GET", f"{API}/health")
    ok = code == 200 and health.get("status") == "healthy"
    print(f"  [{'OK' if ok else 'FAIL'}] /health -> {code}")
    failures += 0 if ok else 1

    checks = [
        ("jwt_configured", "JWT_SECRET"),
        ("frontend_url_ok", "FRONTEND_URL=https://guiaa.vet"),
        ("stripe_secret_configured", "STRIPE_API_KEY"),
        ("stripe_publishable_configured", "STRIPE_PUBLISHABLE_KEY"),
        ("email_configured", "RESEND_API_KEY (+ RESEND_FROM)"),
        ("meta_capi_enabled", "META_PIXEL_ID + META_CAPI_ACCESS_TOKEN"),
    ]
    for key, hint in checks:
        val = health.get(key)
        item_ok = bool(val)
        print(f"  [{'OK' if item_ok else 'PEND'}] {key}: {val!s}  ({hint})")
        if key in ("jwt_configured", "frontend_url_ok", "stripe_secret_configured") and not item_ok:
            failures += 1

    code, _, _ = req("GET", f"{API}/api/payments/checkout/status/sim_probe")
    ok = code == 401
    print(f"\n  [{'OK' if ok else 'FAIL'}] checkout/status sin auth -> {code} (esperado 401)")
    failures += 0 if ok else 1

    code, stripe, _ = req("GET", f"{API}/api/stripe/config")
    pub = stripe.get("publishable_key_configured") or stripe.get("publishable_key")
    print(f"  [{'OK' if pub else 'PEND'}] /api/stripe/config publishable -> {code}")
    if not pub:
        print("       El frontend de membresía necesita STRIPE_PUBLISHABLE_KEY en Railway.")

    code, _, cors_h = req(
        "GET",
        f"{API}/api/membership/packages",
        headers={"Origin": WEB},
    )
    cors = cors_h.get("Access-Control-Allow-Origin") or cors_h.get("access-control-allow-origin")
    ok = code == 200 and cors in (WEB, "*")
    print(f"  [{'OK' if ok else 'FAIL'}] CORS desde {WEB} -> {code}, allow-origin={cors}")
    failures += 0 if ok else 1

    try:
        with urllib.request.urlopen(WEB, timeout=20) as resp:
            web_ok = resp.status in (200, 301, 302)
            print(f"\n  [{'OK' if web_ok else 'WARN'}] {WEB} -> {resp.status}")
            if not web_ok:
                print("       (403 desde scripts es normal si Vercel bloquea bots; prueba en navegador.)")
    except urllib.error.HTTPError as exc:
        if exc.code in (403, 401):
            print(f"\n  [WARN] {WEB} -> {exc.code} (bloqueo anti-bot; abre en navegador para confirmar)")
        else:
            print(f"\n  [FAIL] {WEB} -> HTTP {exc.code}")
            failures += 1
    except Exception as exc:
        print(f"\n  [FAIL] {WEB} -> {exc}")
        failures += 1

    print("\n=== Railway (backend) — variables recomendadas ===")
    print("  RESEND_API_KEY, RESEND_FROM, RESEND_REPLY_TO")
    print("  STRIPE_PUBLISHABLE_KEY, STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET")
    print("  FRONTEND_URL=https://guiaa.vet")
    print("  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET")
    print("  META_PIXEL_ID, META_CAPI_ACCESS_TOKEN (opcional)")

    if failures:
        print(f"\n{failures} comprobación(es) crítica(s) fallaron.")
        return 1
    print("\nNúcleo API OK. Revisa líneas PEND para email/Stripe/Meta.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
