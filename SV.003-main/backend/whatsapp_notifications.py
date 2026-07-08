"""Envío de mensajes WhatsApp vía Meta Cloud API (plantillas con imagen)."""
from __future__ import annotations

import os
import re
from typing import Any, Dict, Optional

try:
    import httpx
except ImportError:  # pragma: no cover
    httpx = None


def is_whatsapp_configured() -> bool:
    return bool(
        os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
        and os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    )


def get_whatsapp_config_status() -> dict:
    return {
        "configured": is_whatsapp_configured(),
        "phone_number_id_set": bool(os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()),
        "access_token_set": bool(os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()),
        "default_template": os.getenv("WHATSAPP_PROMO_TEMPLATE", "").strip() or None,
    }


def normalize_phone_e164(phone: str, default_country_code: str = "52") -> Optional[str]:
    """Normaliza teléfono mexicano/LATAM a E.164 (+CC...)."""
    raw = (phone or "").strip()
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    if raw.startswith("+"):
        return f"+{digits}"
    if len(digits) == 10 and default_country_code:
        return f"+{default_country_code}{digits}"
    if len(digits) >= 11:
        return f"+{digits}"
    return None


def send_whatsapp_template(
    to_e164: str,
    template_name: str,
    body_params: Optional[list[str]] = None,
    image_url: Optional[str] = None,
    language_code: str = "es_MX",
) -> tuple[Optional[str], Optional[str]]:
    """
    Envía plantilla de WhatsApp. Devuelve (external_id, error).
  """
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    if not phone_id or not token:
        return (None, "WhatsApp no configurado")
    if httpx is None:
        return (None, "httpx no disponible")

    to_digits = re.sub(r"\D", "", to_e164 or "")
    if not to_digits:
        return (None, "Teléfono inválido")

    components: list[Dict[str, Any]] = []
    if image_url:
        components.append(
            {
                "type": "header",
                "parameters": [{"type": "image", "image": {"link": image_url}}],
            }
        )
    if body_params:
        components.append(
            {
                "type": "body",
                "parameters": [{"type": "text", "text": p} for p in body_params],
            }
        )

    payload: Dict[str, Any] = {
        "messaging_product": "whatsapp",
        "to": to_digits,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language_code},
        },
    }
    if components:
        payload["template"]["components"] = components

    url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"
    try:
        response = httpx.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=20.0,
        )
        if response.status_code >= 400:
            return (None, f"WhatsApp {response.status_code}: {response.text[:400]}")
        data = response.json()
        msg_id = (data.get("messages") or [{}])[0].get("id")
        return (msg_id, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def send_promotional_whatsapp(
    to_phone: str,
    offer: Dict[str, Any],
    image_url: Optional[str] = None,
    country_code: str = "52",
) -> tuple[Optional[str], Optional[str]]:
    """Envía oferta promocional por WhatsApp usando plantilla configurada."""
    e164 = normalize_phone_e164(to_phone, default_country_code=country_code)
    if not e164:
        return (None, "Teléfono inválido")

    template = (
        os.getenv("WHATSAPP_PROMO_TEMPLATE", "").strip() or "guiaa_promo_oferta"
    )
    headline = (offer.get("headline") or "Oferta GUIAA").strip()
    promo = (offer.get("promo_code") or "").strip()
    plan = (offer.get("plan_name") or "Premium").strip()
    body_params = [headline, plan]
    if promo:
        body_params.append(promo)
    else:
        body_params.append("guiaa.vet")

    return send_whatsapp_template(
        to_e164=e164,
        template_name=template,
        body_params=body_params,
        image_url=image_url,
    )


WHATSAPP_PROMO_TEMPLATE_SPEC = {
    "name": "guiaa_promo_oferta",
    "language": "es_MX",
    "category": "MARKETING",
    "components": [
        {"type": "HEADER", "format": "IMAGE"},
        {
            "type": "BODY",
            "text": (
                "¡Hola! Tenemos una oferta para ti:\n\n"
                "{{1}}\n\n"
                "Plan {{2}} — cupón: {{3}}\n\n"
                "Contrata en guiaa.vet y sigue usando GUIAA en tu consulta."
            ),
        },
        {"type": "FOOTER", "text": "GUIAA — software clínico veterinario"},
        {
            "type": "BUTTONS",
            "buttons": [
                {
                    "type": "URL",
                    "text": "Ver oferta",
                    "url": "https://guiaa.vet/app/membership",
                }
            ],
        },
    ],
}


def create_whatsapp_promo_template(
    waba_id: Optional[str] = None,
) -> tuple[Optional[dict], Optional[str]]:
    """Crea la plantilla guiaa_promo_oferta en Meta WhatsApp Business."""
    if httpx is None:
        return (None, "httpx no disponible")
    account_id = (waba_id or os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")).strip()
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    if not account_id or not token:
        return (None, "Falta WHATSAPP_BUSINESS_ACCOUNT_ID o WHATSAPP_ACCESS_TOKEN")

    url = f"https://graph.facebook.com/v21.0/{account_id}/message_templates"
    try:
        response = httpx.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=WHATSAPP_PROMO_TEMPLATE_SPEC,
            timeout=30.0,
        )
        if response.status_code >= 400:
            return (None, f"Meta {response.status_code}: {response.text[:500]}")
        return (response.json(), None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def list_whatsapp_templates(waba_id: Optional[str] = None) -> tuple[list[dict], Optional[str]]:
    """Lista plantillas existentes en la cuenta WABA."""
    if httpx is None:
        return ([], "httpx no disponible")
    account_id = (waba_id or os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")).strip()
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    if not account_id or not token:
        return ([], "Falta WHATSAPP_BUSINESS_ACCOUNT_ID o WHATSAPP_ACCESS_TOKEN")
    try:
        response = httpx.get(
            f"https://graph.facebook.com/v21.0/{account_id}/message_templates",
            headers={"Authorization": f"Bearer {token}"},
            params={"limit": 100},
            timeout=20.0,
        )
        if response.status_code >= 400:
            return ([], f"Meta {response.status_code}: {response.text[:300]}")
        data = response.json()
        return (data.get("data") or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))
