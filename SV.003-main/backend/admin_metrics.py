"""
Métricas de plataforma para Admin GUIAA: negocio (Supabase) + tráfico (PostHog).
"""
from __future__ import annotations

import logging
import os
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx

from supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

POSTHOG_HOST_DEFAULT = "https://us.posthog.com"
# Token público del snippet (index.html) — solo para elegir el proyecto correcto al autodescubrir.
POSTHOG_PROJECT_TOKEN_HINT = (os.getenv("POSTHOG_PROJECT_API_KEY") or "").strip() or (
    "phc_yJW1VjHGGwmCbbrtczfqqNxgBDbhlhOWcdzcIJEOTFE"
)
MAX_DAYS = 90
DEFAULT_DAYS = 30


def _clamp_days(days: Optional[int]) -> int:
    try:
        value = int(days if days is not None else DEFAULT_DAYS)
    except (TypeError, ValueError):
        value = DEFAULT_DAYS
    return max(1, min(MAX_DAYS, value))


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _range_bounds(days: int) -> Tuple[datetime, datetime, str, str]:
    end = _utc_now()
    start = end - timedelta(days=days - 1)
    start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    from_iso = start.isoformat()
    to_iso = end.isoformat()
    return start, end, from_iso, to_iso


def _parse_day(iso_value: Optional[str]) -> Optional[str]:
    if not iso_value:
        return None
    return str(iso_value)[:10]


def _empty_day_series(from_day: str, to_day: str) -> Dict[str, int]:
    start = date.fromisoformat(from_day)
    end = date.fromisoformat(to_day)
    series: Dict[str, int] = {}
    current = start
    while current <= end:
        series[current.isoformat()] = 0
        current += timedelta(days=1)
    return series


def _series_to_list(series: Dict[str, int]) -> List[Dict[str, Any]]:
    return [{"day": day, "count": count} for day, count in series.items()]


def _fetch_dated_rows(
    table: str,
    columns: str,
    from_iso: str,
    to_iso: str,
    date_col: str = "created_at",
    extra_eq: Optional[Dict[str, Any]] = None,
    limit: int = 10000,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    client = get_supabase_client()
    page_size = 1000
    target = max(1, int(limit or 10000))
    out: List[Dict[str, Any]] = []
    try:
        offset = 0
        while len(out) < target:
            take = min(page_size, target - len(out))
            query = (
                client.table(table)
                .select(columns)
                .gte(date_col, from_iso)
                .lte(date_col, to_iso)
                .order(date_col, desc=False)
            )
            if extra_eq:
                for key, value in extra_eq.items():
                    query = query.eq(key, value)
            resp = query.range(offset, offset + take - 1).execute()
            rows = resp.data or []
            out.extend(rows)
            if len(rows) < take:
                break
            offset += take
        return (out, None)
    except Exception as exc:  # noqa: BLE001
        return ([], str(exc))


def get_business_metrics(days: int = DEFAULT_DAYS) -> Dict[str, Any]:
    days = _clamp_days(days)
    start, end, from_iso, to_iso = _range_bounds(days)
    from_day = start.date().isoformat()
    to_day = end.date().isoformat()

    signups_series = _empty_day_series(from_day, to_day)
    cds_series = _empty_day_series(from_day, to_day)
    paid_series = _empty_day_series(from_day, to_day)

    profiles, profiles_err = _fetch_dated_rows(
        "profiles",
        "id, created_at, membership_type",
        from_iso,
        to_iso,
    )
    consultations, cds_err = _fetch_dated_rows(
        "consultations",
        "id, created_at",
        from_iso,
        to_iso,
    )
    payments, pay_err = _fetch_dated_rows(
        "payment_transactions",
        "id, created_at, type, payment_status, membership_activated, membership_activated_at",
        from_iso,
        to_iso,
        date_col="created_at",
    )

    for row in profiles:
        day = _parse_day(row.get("created_at"))
        if day and day in signups_series:
            signups_series[day] += 1

    for row in consultations:
        day = _parse_day(row.get("created_at"))
        if day and day in cds_series:
            cds_series[day] += 1

    paid_conversions = 0
    for row in payments:
        is_paid = (row.get("payment_status") or "").lower() == "paid"
        is_membership = (row.get("type") or "").lower() == "membership"
        activated = bool(row.get("membership_activated"))
        if not (is_paid and (is_membership or activated)):
            continue
        day = _parse_day(row.get("membership_activated_at") or row.get("created_at"))
        if day and day in paid_series:
            paid_series[day] += 1
            paid_conversions += 1

    signups_total = sum(signups_series.values())
    cds_total = sum(cds_series.values())
    conversion_rate = round((paid_conversions / signups_total) * 100, 1) if signups_total else 0.0

    errors = [e for e in (profiles_err, cds_err, pay_err) if e]

    return {
        "days": days,
        "from": from_iso,
        "to": to_iso,
        "totals": {
            "signups": signups_total,
            "consultations": cds_total,
            "paid_conversions": paid_conversions,
            "signup_to_paid_rate": conversion_rate,
        },
        "series": {
            "signups": _series_to_list(signups_series),
            "consultations": _series_to_list(cds_series),
            "paid_conversions": _series_to_list(paid_series),
        },
        "errors": errors,
    }


def posthog_config() -> Dict[str, Optional[str]]:
    api_key = (os.getenv("POSTHOG_PERSONAL_API_KEY") or "").strip()
    project_id = (os.getenv("POSTHOG_PROJECT_ID") or "").strip()
    host = (os.getenv("POSTHOG_HOST") or POSTHOG_HOST_DEFAULT).strip().rstrip("/")
    dashboard_url = (os.getenv("POSTHOG_DASHBOARD_URL") or "").strip()
    if not dashboard_url and project_id:
        dashboard_url = f"{host}/project/{project_id}/web"
    return {
        "api_key": api_key or None,
        "project_id": project_id or None,
        "host": host,
        "dashboard_url": dashboard_url or None,
        # Con API key personal basta: el project_id se puede autodescubrir.
        "configured": bool(api_key),
    }


async def resolve_posthog_project_id(cfg: Dict[str, Optional[str]]) -> Optional[str]:
    """Si no hay POSTHOG_PROJECT_ID, lo obtiene con la personal API key."""
    if cfg.get("project_id"):
        return cfg["project_id"]
    api_key = cfg.get("api_key")
    host = cfg.get("host") or POSTHOG_HOST_DEFAULT
    if not api_key:
        return None
    url = f"{host}/api/projects/"
    headers = {"Authorization": f"Bearer {api_key}"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    results = data.get("results") if isinstance(data, dict) else data
    if not isinstance(results, list) or not results:
        return None
    hint = POSTHOG_PROJECT_TOKEN_HINT
    for row in results:
        if not isinstance(row, dict):
            continue
        api_token = str(row.get("api_token") or "")
        if hint and api_token == hint:
            return str(row.get("id") or "")
    first = results[0]
    if isinstance(first, dict) and first.get("id") is not None:
        return str(first["id"])
    return None


def _metric_value(block: Any) -> Optional[float]:
    if block is None:
        return None
    if isinstance(block, (int, float)):
        return float(block)
    if isinstance(block, dict):
        current = block.get("current")
        if current is None:
            return None
        if isinstance(current, (int, float)):
            return float(current)
        try:
            return float(str(current).replace("%", "").strip())
        except ValueError:
            return None
    return None


def _metric_change(block: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(block, dict):
        return None
    change = block.get("change")
    if not isinstance(change, dict):
        return None
    return {
        "percent": change.get("percent"),
        "direction": change.get("direction"),
    }


async def _posthog_weekly_digest(days: int, cfg: Dict[str, Optional[str]]) -> Dict[str, Any]:
    url = (
        f"{cfg['host']}/api/projects/{cfg['project_id']}/web_analytics/weekly_digest/"
        f"?days={days}&compare=true"
    )
    headers = {"Authorization": f"Bearer {cfg['api_key']}"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        return resp.json()


async def _posthog_daily_pageviews(days: int, cfg: Dict[str, Optional[str]]) -> List[Dict[str, Any]]:
    """Serie diaria de pageviews vía HogQL (opcional; si falla, se omite)."""
    query = {
        "query": {
            "kind": "HogQLQuery",
            "query": (
                "SELECT toDate(timestamp) AS day, count() AS pageviews "
                "FROM events "
                f"WHERE event = '$pageview' AND timestamp >= now() - INTERVAL {int(days)} DAY "
                "GROUP BY day ORDER BY day"
            ),
        }
    }
    url = f"{cfg['host']}/api/projects/{cfg['project_id']}/query/"
    headers = {
        "Authorization": f"Bearer {cfg['api_key']}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=25.0) as client:
        resp = await client.post(url, headers=headers, json=query)
        resp.raise_for_status()
        data = resp.json()
    results = data.get("results") or []
    series: List[Dict[str, Any]] = []
    for row in results:
        if not isinstance(row, (list, tuple)) or len(row) < 2:
            continue
        day = str(row[0])[:10]
        try:
            count = int(row[1] or 0)
        except (TypeError, ValueError):
            count = 0
        series.append({"day": day, "count": count})
    return series


async def get_traffic_metrics(days: int = DEFAULT_DAYS) -> Dict[str, Any]:
    days = _clamp_days(days)
    cfg = posthog_config()
    if not cfg["configured"]:
        return {
            "configured": False,
            "days": days,
            "dashboard_url": cfg.get("dashboard_url"),
            "message": (
                "Configura POSTHOG_PERSONAL_API_KEY en el backend "
                "(scopes query:read y web_analytics:read). "
                "El Project ID se detecta solo si no lo defines."
            ),
        }

    try:
        project_id = await resolve_posthog_project_id(cfg)
    except Exception as exc:  # noqa: BLE001
        logger.warning("PostHog project resolve failed: %s", exc)
        return {
            "configured": True,
            "days": days,
            "error": f"No se pudo resolver el proyecto PostHog: {exc}",
            "dashboard_url": cfg.get("dashboard_url"),
            "totals": {},
            "top_pages": [],
            "top_sources": [],
            "series": {"pageviews": []},
        }

    if not project_id:
        return {
            "configured": True,
            "days": days,
            "error": "La API key no tiene acceso a ningún proyecto PostHog.",
            "dashboard_url": cfg.get("dashboard_url"),
            "totals": {},
            "top_pages": [],
            "top_sources": [],
            "series": {"pageviews": []},
        }

    cfg = {**cfg, "project_id": project_id}
    if not cfg.get("dashboard_url"):
        cfg["dashboard_url"] = f"{cfg['host']}/project/{project_id}/web"

    try:
        digest = await _posthog_weekly_digest(days, cfg)
    except Exception as exc:  # noqa: BLE001
        logger.warning("PostHog weekly_digest failed: %s", exc)
        return {
            "configured": True,
            "days": days,
            "error": str(exc),
            "dashboard_url": cfg.get("dashboard_url"),
            "totals": {},
            "top_pages": [],
            "top_sources": [],
            "series": {"pageviews": []},
        }

    daily: List[Dict[str, Any]] = []
    try:
        daily = await _posthog_daily_pageviews(days, cfg)
    except Exception as exc:  # noqa: BLE001
        logger.info("PostHog daily pageviews omitted: %s", exc)

    visitors_block = digest.get("visitors")
    pageviews_block = digest.get("pageviews")
    sessions_block = digest.get("sessions")
    bounce_block = digest.get("bounce_rate")
    duration_block = digest.get("avg_session_duration")

    top_pages = []
    for item in digest.get("top_pages") or []:
        if not isinstance(item, dict):
            continue
        path = item.get("path") or item.get("name") or "/"
        host = item.get("host") or ""
        top_pages.append(
            {
                "path": path,
                "host": host,
                "visitors": item.get("visitors") or 0,
                "change": _metric_change(item),
            }
        )

    top_sources = []
    for item in digest.get("top_sources") or []:
        if not isinstance(item, dict):
            continue
        top_sources.append(
            {
                "name": item.get("name") or "Direct",
                "visitors": item.get("visitors") or 0,
                "change": _metric_change(item),
            }
        )

    return {
        "configured": True,
        "days": days,
        "project_id": project_id,
        "dashboard_url": digest.get("dashboard_url") or cfg.get("dashboard_url"),
        "totals": {
            "visitors": _metric_value(visitors_block),
            "pageviews": _metric_value(pageviews_block),
            "sessions": _metric_value(sessions_block),
            "bounce_rate": _metric_value(bounce_block),
            "avg_session_duration": (
                duration_block.get("current")
                if isinstance(duration_block, dict)
                else duration_block
            ),
        },
        "changes": {
            "visitors": _metric_change(visitors_block),
            "pageviews": _metric_change(pageviews_block),
            "sessions": _metric_change(sessions_block),
            "bounce_rate": _metric_change(bounce_block),
        },
        "top_pages": top_pages[:8],
        "top_sources": top_sources[:8],
        "series": {"pageviews": daily},
    }


async def get_admin_platform_metrics(days: int = DEFAULT_DAYS) -> Dict[str, Any]:
    days = _clamp_days(days)
    business = get_business_metrics(days)
    traffic = await get_traffic_metrics(days)
    return {
        "days": days,
        "business": business,
        "traffic": traffic,
    }
