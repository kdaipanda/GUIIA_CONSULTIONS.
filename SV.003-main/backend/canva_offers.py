"""Generación de imágenes de oferta vía Canva Connect API."""
from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

try:
    import httpx
except ImportError:  # pragma: no cover
    httpx = None

CANVA_API_BASE = "https://api.canva.com/rest/v1"

# Campos que la plantilla de marca en Canva debe exponer para autofill
OFFER_TEMPLATE_FIELDS = ("headline", "plan_name", "promo_code", "message", "cta")

OFFER_TEMPLATE_DESIGN_SPEC = {
    "size": "1080x1080",
    "colors": {"navy": "#0c2d4d", "blue": "#265B93", "green": "#3d9b8f"},
    "layout": [
        "Fondo navy #0c2d4d con degradado sutil hacia blue #265B93",
        "Logo GUIAA arriba centrado",
        "Campo headline — texto grande blanco, bold",
        "Campo message — párrafo breve gris claro",
        "Badge plan_name — fondo green #3d9b8f",
        "Campo promo_code — tipografía monoespaciada, destacado",
        "Campo cta — botón blanco con texto blue",
    ],
    "autofill_fields": list(OFFER_TEMPLATE_FIELDS),
}


def is_canva_configured() -> bool:
    return bool(
        os.getenv("CANVA_CLIENT_ID", "").strip()
        and os.getenv("CANVA_CLIENT_SECRET", "").strip()
        and os.getenv("CANVA_REFRESH_TOKEN", "").strip()
        and os.getenv("CANVA_OFFER_TEMPLATE_ID", "").strip()
    )


def get_canva_config_status() -> dict:
    return {
        "configured": is_canva_configured(),
        "template_id": os.getenv("CANVA_OFFER_TEMPLATE_ID", "").strip() or None,
        "client_id_set": bool(os.getenv("CANVA_CLIENT_ID", "").strip()),
        "refresh_token_set": bool(os.getenv("CANVA_REFRESH_TOKEN", "").strip()),
        "fallback_image_url": os.getenv("PROMO_OFFER_IMAGE_URL", "").strip() or None,
    }


def _canva_access_token() -> tuple[Optional[str], Optional[str]]:
    if httpx is None:
        return (None, "httpx no disponible")
    client_id = os.getenv("CANVA_CLIENT_ID", "").strip()
    client_secret = os.getenv("CANVA_CLIENT_SECRET", "").strip()
    refresh_token = os.getenv("CANVA_REFRESH_TOKEN", "").strip()
    if not all([client_id, client_secret, refresh_token]):
        return (None, "Canva no configurado")

    try:
        response = httpx.post(
            "https://api.canva.com/rest/v1/oauth/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=20.0,
        )
        if response.status_code >= 400:
            return (None, f"Canva OAuth {response.status_code}: {response.text[:300]}")
        return (response.json().get("access_token"), None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def _poll_export(access_token: str, job_id: str, max_wait_sec: int = 45) -> tuple[Optional[str], Optional[str]]:
    if httpx is None:
        return (None, "httpx no disponible")
    headers = {"Authorization": f"Bearer {access_token}"}
    deadline = time.time() + max_wait_sec
    while time.time() < deadline:
        try:
            response = httpx.get(
                f"{CANVA_API_BASE}/exports/{job_id}",
                headers=headers,
                timeout=15.0,
            )
            if response.status_code >= 400:
                return (None, f"Canva export {response.status_code}: {response.text[:300]}")
            data = response.json()
            job = data.get("job") or data
            status = (job.get("status") or "").lower()
            if status in ("success", "succeeded", "completed"):
                urls = job.get("urls") or []
                if urls:
                    return (urls[0], None)
                url = job.get("url")
                if url:
                    return (url, None)
                return (None, "Export sin URL")
            if status in ("failed", "error"):
                return (None, job.get("error") or "Export fallido")
            time.sleep(2)
        except Exception as exc:  # noqa: BLE001
            return (None, str(exc))
    return (None, "Timeout esperando export Canva")


def generate_offer_image(offer: Dict[str, Any]) -> tuple[Optional[str], Optional[str], str]:
    """
    Genera URL de imagen de oferta.
    Devuelve (image_url, error, source) donde source es canva|fallback|none.
    """
    fallback = os.getenv("PROMO_OFFER_IMAGE_URL", "").strip()
    if not is_canva_configured():
        if fallback:
            return (fallback, None, "fallback")
        return (None, "Canva no configurado y sin PROMO_OFFER_IMAGE_URL", "none")

    access_token, token_err = _canva_access_token()
    if token_err or not access_token:
        if fallback:
            return (fallback, token_err, "fallback")
        return (None, token_err or "Sin token Canva", "none")

    template_id = os.getenv("CANVA_OFFER_TEMPLATE_ID", "").strip()
    headline = (offer.get("headline") or "Oferta exclusiva GUIAA").strip()
    promo = (offer.get("promo_code") or "").strip()
    plan = (offer.get("plan_name") or "Premium").strip()
    message = (offer.get("message") or "").strip()[:200]

    autofill_payload = {
        "brand_template_id": template_id,
        "title": f"GUIAA Oferta {plan}",
        "data": {
            "headline": {"type": "text", "text": headline},
            "plan_name": {"type": "text", "text": plan},
            "promo_code": {"type": "text", "text": promo or "GUIAA"},
            "message": {"type": "text", "text": message},
            "cta": {"type": "text", "text": "Contratar en guiaa.vet"},
        },
    }

    if httpx is None:
        if fallback:
            return (fallback, "httpx no disponible", "fallback")
        return (None, "httpx no disponible", "none")

    try:
        autofill_resp = httpx.post(
            f"{CANVA_API_BASE}/autofills",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=autofill_payload,
            timeout=30.0,
        )
        if autofill_resp.status_code >= 400:
            if fallback:
                return (fallback, f"Canva autofill {autofill_resp.status_code}", "fallback")
            return (None, f"Canva autofill {autofill_resp.status_code}: {autofill_resp.text[:300]}", "none")

        autofill_data = autofill_resp.json()
        design_id = (
            autofill_data.get("design", {}).get("id")
            or autofill_data.get("design_id")
            or autofill_data.get("id")
        )
        if not design_id:
            if fallback:
                return (fallback, "Canva sin design_id", "fallback")
            return (None, "Canva autofill sin design_id", "none")

        export_resp = httpx.post(
            f"{CANVA_API_BASE}/exports",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={
                "design_id": design_id,
                "format": {"type": "png", "width": 1080, "height": 1080},
            },
            timeout=30.0,
        )
        if export_resp.status_code >= 400:
            if fallback:
                return (fallback, f"Canva export start {export_resp.status_code}", "fallback")
            return (None, f"Canva export {export_resp.status_code}: {export_resp.text[:300]}", "none")

        export_data = export_resp.json()
        job_id = (export_data.get("job") or export_data).get("id")
        if not job_id:
            if fallback:
                return (fallback, "Canva sin job_id de export", "fallback")
            return (None, "Canva export sin job_id", "none")

        image_url, export_err = _poll_export(access_token, job_id)
        if image_url:
            return (image_url, None, "canva")
        if fallback:
            return (fallback, export_err, "fallback")
        return (None, export_err, "none")
    except Exception as exc:  # noqa: BLE001
        if fallback:
            return (fallback, str(exc), "fallback")
        return (None, str(exc), "none")


def list_brand_templates() -> tuple[list[dict], Optional[str]]:
    """Lista plantillas de marca disponibles en Canva (para setup)."""
    if httpx is None:
        return ([], "httpx no disponible")
    access_token, token_err = _canva_access_token()
    if token_err or not access_token:
        return ([], token_err or "Sin token Canva")
    try:
        response = httpx.get(
            f"{CANVA_API_BASE}/brand-templates",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=20.0,
        )
        if response.status_code >= 400:
            return ([], f"Canva {response.status_code}: {response.text[:300]}")
        data = response.json()
        items = data.get("items") or data.get("brand_templates") or []
        return (items, None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))
