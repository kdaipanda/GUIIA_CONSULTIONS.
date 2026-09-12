"""Sync between species form_data and patients.clinical_chart."""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

EMPTY_CHART: Dict[str, Any] = {
    "allergies": [],
    "chronic_conditions": [],
    "surgeries": [],
    "vaccines": [],
    "deworming": [],
    "problems": [],
    "reproductive": {"sterilized": None, "notes": ""},
    "form_snapshot": None,
    "form_category": None,
    "updated_at": None,
    "updated_from_consultation_id": None,
}

LIST_KEYS = (
    "allergies",
    "chronic_conditions",
    "surgeries",
    "vaccines",
    "deworming",
    "problems",
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_chart(raw: Any) -> Dict[str, Any]:
    base = {**EMPTY_CHART, "reproductive": {**EMPTY_CHART["reproductive"]}}
    if not isinstance(raw, dict):
        return base
    out = {**base, **raw}
    for key in LIST_KEYS:
        val = out.get(key)
        out[key] = list(val) if isinstance(val, list) else []
    repro = out.get("reproductive")
    out["reproductive"] = (
        {**EMPTY_CHART["reproductive"], **repro} if isinstance(repro, dict) else {**EMPTY_CHART["reproductive"]}
    )
    snap = out.get("form_snapshot")
    out["form_snapshot"] = snap if isinstance(snap, dict) else None
    cat = out.get("form_category")
    out["form_category"] = str(cat).strip() if cat else None
    return out


def _truthy_si(value: Any) -> bool:
    if value is True:
        return True
    s = str(value or "").strip().upper()
    return s in {"SI", "SÍ", "YES", "TRUE", "1"}


def _parse_weight(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().replace(",", ".")
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    try:
        return float(match.group(1))
    except ValueError:
        return None


def _item_key(item: Dict[str, Any], fields: Tuple[str, ...]) -> str:
    parts = [str(item.get(f) or "").strip().lower() for f in fields]
    return "|".join(parts)


def _merge_list(
    existing: List[Dict[str, Any]],
    incoming: List[Dict[str, Any]],
    key_fields: Tuple[str, ...],
) -> List[Dict[str, Any]]:
    merged = [dict(x) for x in existing if isinstance(x, dict)]
    seen = {_item_key(x, key_fields) for x in merged}
    for item in incoming:
        if not isinstance(item, dict):
            continue
        key = _item_key(item, key_fields)
        if not key or key == "|" * (len(key_fields) - 1) or key in seen:
            # allow empty-label skip
            if not any(str(item.get(f) or "").strip() for f in key_fields):
                continue
            if key in seen:
                continue
        seen.add(key)
        merged.append(dict(item))
    return merged


def merge_clinical_chart(existing: Any, patch: Any) -> Dict[str, Any]:
    base = normalize_chart(existing)
    if not isinstance(patch, dict):
        return base

    out = {**base}
    out["allergies"] = _merge_list(base["allergies"], patch.get("allergies") or [], ("label", "noted_at"))
    out["chronic_conditions"] = _merge_list(
        base["chronic_conditions"], patch.get("chronic_conditions") or [], ("label", "noted_at")
    )
    out["surgeries"] = _merge_list(base["surgeries"], patch.get("surgeries") or [], ("label", "date"))
    out["vaccines"] = _merge_list(base["vaccines"], patch.get("vaccines") or [], ("label", "date"))
    out["deworming"] = _merge_list(
        base["deworming"], patch.get("deworming") or [], ("type", "product", "date")
    )

    if isinstance(patch.get("problems"), list):
        # problems: replace-aware merge by id, else by title+opened_at
        by_id = {str(p.get("id")): dict(p) for p in out["problems"] if isinstance(p, dict) and p.get("id")}
        order = [str(p.get("id")) for p in out["problems"] if isinstance(p, dict) and p.get("id")]
        open_titles = {
            str(p.get("title") or "").strip().lower()
            for p in by_id.values()
            if (p.get("status") or "open") != "closed"
        }
        for p in patch["problems"]:
            if not isinstance(p, dict):
                continue
            title_key = str(p.get("title") or "").strip().lower()
            if title_key and title_key in open_titles and (p.get("status") or "open") != "closed":
                continue
            pid = str(p.get("id") or "") or str(uuid.uuid4())
            if pid in by_id:
                by_id[pid] = {**by_id[pid], **p, "id": pid}
            else:
                by_id[pid] = {**p, "id": pid}
                order.append(pid)
                if title_key:
                    open_titles.add(title_key)
        out["problems"] = [by_id[i] for i in order if i in by_id]

    if isinstance(patch.get("reproductive"), dict):
        out["reproductive"] = {**out["reproductive"], **patch["reproductive"]}

    if isinstance(patch.get("form_snapshot"), dict):
        out["form_snapshot"] = dict(patch["form_snapshot"])
    if patch.get("form_category") is not None and str(patch.get("form_category") or "").strip():
        out["form_category"] = str(patch["form_category"]).strip()

    if patch.get("updated_from_consultation_id"):
        out["updated_from_consultation_id"] = patch["updated_from_consultation_id"]
    out["updated_at"] = patch.get("updated_at") or _now_iso()
    return out


def extract_chart_patch_from_form_data(
    category: Optional[str],
    form_data: Optional[Dict[str, Any]],
    *,
    consultation_id: Optional[str] = None,
    noted_at: Optional[str] = None,
) -> Dict[str, Any]:
    fd = form_data if isinstance(form_data, dict) else {}
    when = noted_at or _now_iso()[:10]
    patch: Dict[str, Any] = {
        "vaccines": [],
        "surgeries": [],
        "deworming": [],
        "chronic_conditions": [],
        "allergies": [],
        "problems": [],
        "reproductive": {},
        "updated_from_consultation_id": consultation_id,
        "updated_at": _now_iso(),
    }

    # Vaccines (dogs/cats and similar)
    if _truthy_si(fd.get("vacunas_vigentes")) or fd.get("vacunas_cual"):
        label = str(fd.get("vacunas_cual") or "").strip() or "Vacunas vigentes"
        patch["vaccines"].append({"label": label, "date": when, "notes": ""})

    # Rabbit-specific vaccines
    for key, label in (
        ("vacuna_mixomatosis", "Mixomatosis"),
        ("vacuna_vhd", "VHD"),
        ("vacuna_rabia", "Rabia"),
    ):
        if _truthy_si(fd.get(key)) or (fd.get(key) and str(fd.get(key)).upper() not in {"NO", "FALSE", "0", ""}):
            if str(fd.get(key) or "").strip().upper() in {"NO", "FALSE", "0"}:
                continue
            detail = str(fd.get(f"{key}_fecha") or fd.get(f"{key}_cual") or "").strip()
            patch["vaccines"].append({"label": label, "date": detail or when, "notes": ""})

    # Surgeries
    if _truthy_si(fd.get("cirugias_previas")) or fd.get("cirugias_cual"):
        label = str(fd.get("cirugias_cual") or "").strip() or "Cirugía previa"
        patch["surgeries"].append({"label": label, "date": when, "notes": ""})

    # Deworming
    if _truthy_si(fd.get("desparasitacion_interna")):
        product = str(
            fd.get("desparasitacion_interna_cual")
            or fd.get("desparasitacion_interna_producto")
            or ""
        ).strip()
        date = str(fd.get("desparasitacion_interna_fecha") or when).strip()
        patch["deworming"].append({"type": "internal", "product": product or "Interna", "date": date})

    if _truthy_si(fd.get("desparasitacion_externa")):
        product = str(
            fd.get("desparasitacion_externa_producto")
            or fd.get("desparasitacion_externa_cual")
            or ""
        ).strip()
        date = str(fd.get("desparasitacion_externa_fecha") or when).strip()
        patch["deworming"].append({"type": "external", "product": product or "Externa", "date": date})

    # Allergies / chronic (free text fields when present)
    for field, target in (
        ("alergias", "allergies"),
        ("alergia", "allergies"),
        ("enfermedades_cronicas", "chronic_conditions"),
        ("enfermedades_previas", "chronic_conditions"),
    ):
        raw = str(fd.get(field) or "").strip()
        if raw and raw.upper() not in {"NO", "N/A", "NA", "-"}:
            item = {"label": raw, "noted_at": when}
            if target == "allergies":
                item["severity"] = ""
                patch["allergies"].append(item)
            else:
                item["status"] = "active"
                patch["chronic_conditions"].append(item)

    # Reproductive
    esterilizado = fd.get("esterilizado") or fd.get("estado_reproductivo")
    if esterilizado is not None and str(esterilizado).strip() != "":
        s = str(esterilizado).strip().upper()
        if s in {"SI", "SÍ", "YES", "ESTERILIZADO", "CASTRADO", "OVH", "ORQUIECTOMIA"}:
            patch["reproductive"]["sterilized"] = True
        elif s in {"NO", "ENTERO", "ENTERA", "NO ESTERILIZADO"}:
            patch["reproductive"]["sterilized"] = False
        else:
            patch["reproductive"]["notes"] = str(esterilizado).strip()

    # Open problem from motivo
    motivo = str(fd.get("motivo_consulta") or fd.get("sintomas") or "").strip()
    if motivo and consultation_id:
        patch["problems"].append(
            {
                "id": str(uuid.uuid4()),
                "title": motivo[:200],
                "status": "open",
                "opened_at": when,
                "closed_at": "",
                "source_consultation_id": consultation_id,
            }
        )

    # Drop empty lists so merge can skip noise when replacing via API full lists
    return patch


def extract_weight_kg(form_data: Optional[Dict[str, Any]]) -> Optional[float]:
    if not isinstance(form_data, dict):
        return None
    return _parse_weight(form_data.get("peso"))


def build_vitals_series(consultations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Build chronological vitals from serialized or raw consultation rows."""
    series: List[Dict[str, Any]] = []
    for row in consultations or []:
        if not isinstance(row, dict):
            continue
        # Accept already-serialized or raw DB row
        payload = row.get("payload") if isinstance(row.get("payload"), dict) else {}
        form_data = row.get("form_data")
        if not isinstance(form_data, dict):
            form_data = (payload or {}).get("form_data") or (payload or {}).get("consultation_data") or {}
        parametros = row.get("parametros_vitales")
        if parametros is None:
            parametros = (payload or {}).get("parametros_vitales")
        weight = _parse_weight(form_data.get("peso") if isinstance(form_data, dict) else None)
        if weight is None and isinstance(parametros, dict):
            weight = _parse_weight(parametros.get("peso") or parametros.get("weight") or parametros.get("weight_kg"))
        entry = {
            "consultation_id": row.get("id"),
            "created_at": row.get("created_at"),
            "weight_kg": weight,
            "parametros_vitales": parametros if isinstance(parametros, dict) else None,
        }
        if entry["weight_kg"] is not None or entry["parametros_vitales"]:
            series.append(entry)
    series.sort(key=lambda x: x.get("created_at") or "")
    return series
