"""Servicio de campañas promocionales multicanal (email + WhatsApp)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import canva_offers
import email_notifications
import trial_survey
import whatsapp_notifications
from supabase_client import get_supabase_client, list_profiles

VALID_SEGMENTS = {
    "trial_exhausted",
    "trial_survey_completed",
    "guia_leads_new",
    "membership_expiring",
    "all_marketing_opt_in",
}

VALID_CHANNELS = {"email", "whatsapp"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _marketing_blocked(profile: Dict[str, Any]) -> bool:
    if profile.get("marketing_unsubscribed_at"):
        return True
    return False


def _profile_eligible_for_marketing(profile: Dict[str, Any], segment: str) -> bool:
    if _marketing_blocked(profile):
        return False
    membership = (profile.get("membership_type") or "").strip().lower()
    remaining = int(profile.get("consultations_remaining") or 0)

    if segment == "trial_exhausted":
        return not membership and remaining <= 0
    if segment == "trial_survey_completed":
        return bool(profile.get("trial_survey_completed_at"))
    if segment == "membership_expiring":
        expires = profile.get("membership_expires")
        if not expires or not membership:
            return False
        try:
            exp_dt = datetime.fromisoformat(str(expires).replace("Z", "+00:00"))
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            return exp_dt <= datetime.now(timezone.utc) + timedelta(days=14)
        except ValueError:
            return False
    if segment == "all_marketing_opt_in":
        return bool(profile.get("marketing_opt_in"))
    return False


def _list_guia_leads_new() -> Tuple[List[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        resp = (
            client.table("guia_consultas_leads")
            .select("*")
            .eq("status", "new")
            .order("created_at", desc=True)
            .limit(2000)
            .execute()
        )
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def resolve_segment_recipients(
    segment: str,
    limit: int = 500,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """Devuelve lista de destinatarios normalizados para el segmento."""
    segment = (segment or "").strip().lower()
    if segment not in VALID_SEGMENTS:
        return ([], f"Segmento inválido: {segment}")

    if segment == "guia_leads_new":
        leads, err = _list_guia_leads_new()
        if err:
            return ([], err)
        recipients = []
        for lead in leads[:limit]:
            recipients.append(
                {
                    "recipient_type": "guia_lead",
                    "recipient_id": lead.get("id"),
                    "nombre": lead.get("name"),
                    "email": (lead.get("email") or "").strip() or None,
                    "telefono": (lead.get("phone") or "").strip() or None,
                    "country_code": "52",
                }
            )
        return (recipients, None)

    profiles, err = list_profiles(limit=5000)
    if err:
        return ([], err)

    recipients = []
    for profile in profiles:
        if not _profile_eligible_for_marketing(profile, segment):
            continue
        recipients.append(
            {
                "recipient_type": "profile",
                "recipient_id": profile.get("id"),
                "nombre": profile.get("nombre"),
                "email": (profile.get("email") or "").strip() or None,
                "telefono": (
                    profile.get("telefono_e164")
                    or profile.get("telefono")
                    or ""
                ).strip()
                or None,
                "country_code": _country_code_from_profile(profile),
            }
        )
        if len(recipients) >= limit:
            break
    return (recipients, None)


def _country_code_from_profile(profile: Dict[str, Any]) -> str:
    pais = (profile.get("profesional_pais") or "").upper()
    mapping = {
        "MX": "52",
        "MEX": "52",
        "MÉXICO": "52",
        "MEXICO": "52",
        "CO": "57",
        "COL": "57",
        "COLOMBIA": "57",
        "AR": "54",
        "ARG": "54",
        "ARGENTINA": "54",
        "CL": "56",
        "CHL": "56",
        "CHILE": "56",
        "PE": "51",
        "PER": "51",
        "PERU": "51",
        "PERÚ": "51",
        "EC": "593",
        "ECU": "593",
        "ECUADOR": "593",
    }
    return mapping.get(pais, "52")


def build_offer_payload(custom_offer: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if custom_offer:
        base = trial_survey.build_premium_offer()
        merged = {**base, **{k: v for k, v in custom_offer.items() if v is not None}}
        return merged
    return trial_survey.build_premium_offer()


def preview_campaign(
    segment: str,
    channels: List[str],
    custom_offer: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    segment = (segment or "").strip().lower()
    channel_set = {c.strip().lower() for c in channels if c}
    invalid = channel_set - VALID_CHANNELS
    if invalid:
        return {"ok": False, "error": f"Canales inválidos: {', '.join(sorted(invalid))}"}
    if segment not in VALID_SEGMENTS:
        return {"ok": False, "error": f"Segmento inválido: {segment}"}
    if not channel_set:
        channel_set = {"email"}

    recipients, err = resolve_segment_recipients(segment, limit=500)
    if err:
        return {"ok": False, "error": err}

    offer = build_offer_payload(custom_offer)
    image_url, image_err, image_source = canva_offers.generate_offer_image(offer)

    with_email = sum(1 for r in recipients if r.get("email"))
    with_phone = sum(1 for r in recipients if r.get("telefono"))

    return {
        "ok": True,
        "segment": segment,
        "channels": sorted(channel_set),
        "offer": offer,
        "image_url": image_url,
        "image_source": image_source,
        "image_error": image_err,
        "recipient_count": len(recipients),
        "with_email": with_email,
        "with_phone": with_phone,
        "sample_recipients": recipients[:5],
        "integrations": {
            "email": email_notifications.get_email_config_status(),
            "whatsapp": whatsapp_notifications.get_whatsapp_config_status(),
            "canva": canva_offers.get_canva_config_status(),
        },
    }


def _insert_campaign(row: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    client = get_supabase_client()
    try:
        resp = client.table("promotion_campaigns").insert(row, returning="representation").execute()
        campaign_id = (resp.data or [{}])[0].get("id")
        return (campaign_id, None)
    except Exception as exc:  # noqa: BLE001
        return (None, str(exc))


def _insert_send(row: Dict[str, Any]) -> None:
    client = get_supabase_client()
    try:
        client.table("promotion_sends").insert(row).execute()
    except Exception:  # noqa: BLE001
        pass


def _update_campaign(campaign_id: str, fields: Dict[str, Any]) -> None:
    client = get_supabase_client()
    try:
        client.table("promotion_campaigns").update(fields).eq("id", campaign_id).execute()
    except Exception:  # noqa: BLE001
        pass


def _mark_guia_lead_contacted(lead_id: str) -> None:
    client = get_supabase_client()
    try:
        client.table("guia_consultas_leads").update(
            {"status": "contacted", "updated_at": _now_iso()}
        ).eq("id", lead_id).execute()
    except Exception:  # noqa: BLE001
        pass


def send_campaign(
    segment: str,
    channels: List[str],
    created_by_profile_id: Optional[str] = None,
    campaign_name: Optional[str] = None,
    custom_offer: Optional[Dict[str, Any]] = None,
    dry_run: bool = False,
    limit: int = 200,
) -> Dict[str, Any]:
    preview = preview_campaign(segment, channels, custom_offer)
    if not preview.get("ok"):
        return preview

    channel_set = set(preview["channels"])
    offer = preview["offer"]
    image_url = preview.get("image_url")
    recipients, err = resolve_segment_recipients(segment, limit=limit)
    if err:
        return {"ok": False, "error": err}

    campaign_row = {
        "name": campaign_name or f"Promo {segment} {_now_iso()[:10]}",
        "segment": segment,
        "channels": list(channel_set),
        "offer": offer,
        "image_url": image_url,
        "created_by_profile_id": created_by_profile_id,
        "status": "sending",
        "dry_run": dry_run,
        "stats": {},
    }
    campaign_id, camp_err = _insert_campaign(campaign_row)
    if camp_err:
        return {"ok": False, "error": camp_err}

    stats = {"sent": 0, "failed": 0, "skipped": 0, "email": 0, "whatsapp": 0}
    nombre_default = "colega"

    for recipient in recipients:
        nombre = (recipient.get("nombre") or nombre_default).split()[0]
        email = recipient.get("email")
        telefono = recipient.get("telefono")
        country = recipient.get("country_code") or "52"

        if dry_run:
            stats["skipped"] += 1
            _insert_send(
                {
                    "campaign_id": campaign_id,
                    "channel": "email",
                    "recipient_type": recipient.get("recipient_type"),
                    "recipient_id": recipient.get("recipient_id"),
                    "recipient_email": email,
                    "recipient_phone": telefono,
                    "status": "skipped",
                    "error_message": "dry_run",
                }
            )
            continue

        if "email" in channel_set and email:
            err_msg = email_notifications.send_promotional_email(
                to_addr=email,
                nombre=nombre,
                offer=offer,
                image_url=image_url,
                segment=segment,
            )
            if err_msg:
                stats["failed"] += 1
                _insert_send(
                    {
                        "campaign_id": campaign_id,
                        "channel": "email",
                        "recipient_type": recipient.get("recipient_type"),
                        "recipient_id": recipient.get("recipient_id"),
                        "recipient_email": email,
                        "status": "failed",
                        "error_message": err_msg,
                    }
                )
            else:
                stats["sent"] += 1
                stats["email"] += 1
                _insert_send(
                    {
                        "campaign_id": campaign_id,
                        "channel": "email",
                        "recipient_type": recipient.get("recipient_type"),
                        "recipient_id": recipient.get("recipient_id"),
                        "recipient_email": email,
                        "status": "sent",
                        "sent_at": _now_iso(),
                    }
                )

        if "whatsapp" in channel_set and telefono:
            ext_id, wa_err = whatsapp_notifications.send_promotional_whatsapp(
                to_phone=telefono,
                offer=offer,
                image_url=image_url,
                country_code=country,
            )
            if wa_err:
                stats["failed"] += 1
                _insert_send(
                    {
                        "campaign_id": campaign_id,
                        "channel": "whatsapp",
                        "recipient_type": recipient.get("recipient_type"),
                        "recipient_id": recipient.get("recipient_id"),
                        "recipient_phone": telefono,
                        "status": "failed",
                        "error_message": wa_err,
                    }
                )
            else:
                stats["sent"] += 1
                stats["whatsapp"] += 1
                _insert_send(
                    {
                        "campaign_id": campaign_id,
                        "channel": "whatsapp",
                        "recipient_type": recipient.get("recipient_type"),
                        "recipient_id": recipient.get("recipient_id"),
                        "recipient_phone": telefono,
                        "status": "sent",
                        "external_id": ext_id,
                        "sent_at": _now_iso(),
                    }
                )

        if (
            segment == "guia_leads_new"
            and recipient.get("recipient_type") == "guia_lead"
            and recipient.get("recipient_id")
            and not dry_run
        ):
            _mark_guia_lead_contacted(str(recipient["recipient_id"]))

    _update_campaign(
        campaign_id,
        {
            "status": "completed",
            "stats": stats,
            "completed_at": _now_iso(),
        },
    )

    return {
        "ok": True,
        "campaign_id": campaign_id,
        "dry_run": dry_run,
        "segment": segment,
        "channels": list(channel_set),
        "image_url": image_url,
        "stats": stats,
        "recipient_count": len(recipients),
    }


def list_campaigns(limit: int = 50) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    try:
        resp = (
            client.table("promotion_campaigns")
            .select("*")
            .order("created_at", desc=True)
            .limit(min(limit, 200))
            .execute()
        )
        return (resp.data or [], None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def list_segments() -> List[Dict[str, str]]:
    labels = {
        "trial_exhausted": "Prueba agotada (sin plan)",
        "trial_survey_completed": "Completaron encuesta post-prueba",
        "guia_leads_new": "Leads Guía Consultas (nuevos)",
        "membership_expiring": "Membresía por vencer (14 días)",
        "all_marketing_opt_in": "Opt-in marketing explícito",
    }
    return [{"id": key, "label": labels[key]} for key in sorted(VALID_SEGMENTS)]
