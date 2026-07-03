"""
Meta Conversions API (CAPI) — eventos server-side para deduplicar con Meta Pixel.

Requiere META_PIXEL_ID (o REACT_APP_META_PIXEL_ID) y META_CAPI_ACCESS_TOKEN.
Opcional: META_CAPI_TEST_EVENT_CODE para Events Manager → Test Events.
"""

from __future__ import annotations

import hashlib
import os
import time
from typing import Any, Dict, Optional

import httpx

META_PIXEL_ID = (
    os.getenv("META_PIXEL_ID", "").strip()
    or os.getenv("REACT_APP_META_PIXEL_ID", "").strip()
)
META_CAPI_ACCESS_TOKEN = os.getenv("META_CAPI_ACCESS_TOKEN", "").strip()
META_CAPI_API_VERSION = os.getenv("META_CAPI_API_VERSION", "v21.0").strip()
META_CAPI_TEST_EVENT_CODE = os.getenv("META_CAPI_TEST_EVENT_CODE", "").strip()
GUIAA_SITE_URL = os.getenv("GUIAA_SITE_URL", "https://guiaa.vet").rstrip("/")


def is_meta_capi_enabled() -> bool:
    return bool(META_PIXEL_ID and META_CAPI_ACCESS_TOKEN)


def get_client_ip(request) -> Optional[str]:
    forwarded = request.headers.get("x-forwarded-for") if request else None
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request and request.client:
        return request.client.host
    return None


def _hash_normalized(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()


def _hash_phone(phone: str, default_country_code: str = "52") -> str:
    digits = "".join(char for char in phone if char.isdigit())
    if not digits:
        return ""
    if not digits.startswith(default_country_code):
        digits = f"{default_country_code}{digits.lstrip('0')}"
    return hashlib.sha256(digits.encode("utf-8")).hexdigest()


def build_user_data(
    *,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    external_id: Optional[str] = None,
    client_ip: Optional[str] = None,
    client_user_agent: Optional[str] = None,
    country: Optional[str] = None,
) -> Dict[str, Any]:
    user_data: Dict[str, Any] = {}
    if email:
        user_data["em"] = [_hash_normalized(email)]
    if phone:
        hashed_phone = _hash_phone(phone)
        if hashed_phone:
            user_data["ph"] = [hashed_phone]
    if external_id:
        user_data["external_id"] = [_hash_normalized(str(external_id))]
    if client_ip:
        user_data["client_ip_address"] = client_ip
    if client_user_agent:
        user_data["client_user_agent"] = client_user_agent
    if country:
        user_data["country"] = [country.strip().lower()[:2]]
    return user_data


async def send_meta_capi_event(
    event_name: str,
    *,
    event_id: Optional[str] = None,
    event_source_url: Optional[str] = None,
    user_data: Optional[Dict[str, Any]] = None,
    custom_data: Optional[Dict[str, Any]] = None,
) -> bool:
    if not is_meta_capi_enabled():
        return False

    event: Dict[str, Any] = {
        "event_name": event_name,
        "event_time": int(time.time()),
        "action_source": "website",
    }
    if event_id:
        event["event_id"] = event_id
    if event_source_url:
        event["event_source_url"] = event_source_url
    if user_data:
        event["user_data"] = user_data
    if custom_data:
        event["custom_data"] = custom_data

    payload: Dict[str, Any] = {"data": [event]}
    if META_CAPI_TEST_EVENT_CODE:
        payload["test_event_code"] = META_CAPI_TEST_EVENT_CODE

    url = f"https://graph.facebook.com/{META_CAPI_API_VERSION}/{META_PIXEL_ID}/events"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url,
                params={"access_token": META_CAPI_ACCESS_TOKEN},
                json=payload,
            )
        if response.status_code >= 400:
            print(
                f"[WARN] Meta CAPI {event_name} failed: "
                f"{response.status_code} {response.text[:300]}"
            )
            return False
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[WARN] Meta CAPI {event_name} error: {exc}")
        return False


async def track_complete_registration_capi(
    *,
    veterinarian_id: str,
    email: Optional[str],
    phone: Optional[str] = None,
    country: Optional[str] = None,
    request=None,
) -> bool:
    user_data = build_user_data(
        email=email,
        phone=phone,
        external_id=veterinarian_id,
        client_ip=get_client_ip(request),
        client_user_agent=request.headers.get("user-agent") if request else None,
        country=country,
    )
    return await send_meta_capi_event(
        "CompleteRegistration",
        event_id=veterinarian_id,
        event_source_url=f"{GUIAA_SITE_URL}/registro",
        user_data=user_data,
        custom_data={
            "content_name": "MVZ Registration",
            "status": True,
        },
    )


async def track_initiate_checkout_capi(
    *,
    session_id: str,
    package_id: str,
    value: Optional[float],
    currency: str = "MXN",
    content_category: str = "membership",
    veterinarian_id: Optional[str] = None,
    email: Optional[str] = None,
    request=None,
) -> bool:
    custom_data: Dict[str, Any] = {
        "content_name": package_id,
        "content_category": content_category,
        "currency": currency.upper(),
        "num_items": 1,
    }
    if value is not None:
        custom_data["value"] = float(value)

    user_data = build_user_data(
        email=email,
        external_id=veterinarian_id,
        client_ip=get_client_ip(request),
        client_user_agent=request.headers.get("user-agent") if request else None,
    )
    return await send_meta_capi_event(
        "InitiateCheckout",
        event_id=f"checkout_{session_id}",
        event_source_url=f"{GUIAA_SITE_URL}/membership",
        user_data=user_data,
        custom_data=custom_data,
    )


async def track_purchase_capi(
    *,
    session_id: str,
    purchase_type: Optional[str],
    package_id: Optional[str],
    value: Optional[float],
    currency: str = "MXN",
    veterinarian_id: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
) -> bool:
    custom_data: Dict[str, Any] = {
        "content_type": purchase_type or "product",
        "currency": currency.upper(),
        "num_items": 1,
    }
    if package_id:
        custom_data["content_ids"] = [package_id]
    if value is not None:
        custom_data["value"] = float(value)

    user_data = build_user_data(
        email=email,
        phone=phone,
        external_id=veterinarian_id,
    )
    return await send_meta_capi_event(
        "Purchase",
        event_id=session_id,
        event_source_url=f"{GUIAA_SITE_URL}/payment-success",
        user_data=user_data,
        custom_data=custom_data,
    )
