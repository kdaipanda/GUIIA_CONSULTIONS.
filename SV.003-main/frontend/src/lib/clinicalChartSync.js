/**
 * Sync between species form_data and patients.clinical_chart.
 */

export const EMPTY_CLINICAL_CHART = {
  allergies: [],
  chronic_conditions: [],
  surgeries: [],
  vaccines: [],
  deworming: [],
  problems: [],
  reproductive: { sterilized: null, notes: "" },
  form_snapshot: null,
  form_category: null,
  updated_at: null,
  updated_from_consultation_id: null,
};

const LIST_KEYS = [
  "allergies",
  "chronic_conditions",
  "surgeries",
  "vaccines",
  "deworming",
  "problems",
];

function nowIso() {
  return new Date().toISOString();
}

function todayDate() {
  return nowIso().slice(0, 10);
}

export function normalizeClinicalChart(raw) {
  const base = {
    ...EMPTY_CLINICAL_CHART,
    reproductive: { ...EMPTY_CLINICAL_CHART.reproductive },
  };
  if (!raw || typeof raw !== "object") return base;
  const out = { ...base, ...raw };
  for (const key of LIST_KEYS) {
    out[key] = Array.isArray(out[key]) ? out[key] : [];
  }
  out.reproductive =
    out.reproductive && typeof out.reproductive === "object"
      ? { ...EMPTY_CLINICAL_CHART.reproductive, ...out.reproductive }
      : { ...EMPTY_CLINICAL_CHART.reproductive };
  out.form_snapshot =
    out.form_snapshot && typeof out.form_snapshot === "object" ? out.form_snapshot : null;
  out.form_category = out.form_category ? String(out.form_category) : null;
  return out;
}

function truthySi(value) {
  if (value === true) return true;
  const s = String(value || "")
    .trim()
    .toUpperCase();
  return ["SI", "SÍ", "YES", "TRUE", "1"].includes(s);
}

export function parseWeightKg(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value).trim().replace(",", ".");
  const match = text.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function itemKey(item, fields) {
  return fields.map((f) => String(item?.[f] || "").trim().toLowerCase()).join("|");
}

function mergeList(existing, incoming, keyFields) {
  const merged = (existing || []).filter((x) => x && typeof x === "object").map((x) => ({ ...x }));
  const seen = new Set(merged.map((x) => itemKey(x, keyFields)));
  for (const item of incoming || []) {
    if (!item || typeof item !== "object") continue;
    if (!keyFields.some((f) => String(item[f] || "").trim())) continue;
    const key = itemKey(item, keyFields);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ ...item });
  }
  return merged;
}

export function mergeClinicalChart(existing, patch) {
  const base = normalizeClinicalChart(existing);
  if (!patch || typeof patch !== "object") return base;

  const out = { ...base };
  out.allergies = mergeList(base.allergies, patch.allergies, ["label", "noted_at"]);
  out.chronic_conditions = mergeList(base.chronic_conditions, patch.chronic_conditions, [
    "label",
    "noted_at",
  ]);
  out.surgeries = mergeList(base.surgeries, patch.surgeries, ["label", "date"]);
  out.vaccines = mergeList(base.vaccines, patch.vaccines, ["label", "date"]);
  out.deworming = mergeList(base.deworming, patch.deworming, ["type", "product", "date"]);

  if (Array.isArray(patch.problems)) {
    const byId = new Map();
    const order = [];
    for (const p of out.problems) {
      if (!p?.id) continue;
      byId.set(String(p.id), { ...p });
      order.push(String(p.id));
    }
    const openTitles = new Set(
      [...byId.values()]
        .filter((p) => (p.status || "open") !== "closed")
        .map((p) => String(p.title || "").trim().toLowerCase())
        .filter(Boolean),
    );
    for (const p of patch.problems) {
      if (!p || typeof p !== "object") continue;
      const titleKey = String(p.title || "").trim().toLowerCase();
      if (titleKey && openTitles.has(titleKey) && (p.status || "open") !== "closed") {
        continue;
      }
      const id = String(p.id || cryptoRandomId());
      if (byId.has(id)) {
        byId.set(id, { ...byId.get(id), ...p, id });
      } else {
        byId.set(id, { ...p, id });
        order.push(id);
        if (titleKey) openTitles.add(titleKey);
      }
    }
    out.problems = order.map((id) => byId.get(id)).filter(Boolean);
  }

  if (patch.reproductive && typeof patch.reproductive === "object") {
    out.reproductive = { ...out.reproductive, ...patch.reproductive };
  }
  if (patch.form_snapshot && typeof patch.form_snapshot === "object") {
    out.form_snapshot = { ...patch.form_snapshot };
  }
  if (patch.form_category != null && String(patch.form_category).trim()) {
    out.form_category = String(patch.form_category).trim();
  }
  if (patch.updated_from_consultation_id) {
    out.updated_from_consultation_id = patch.updated_from_consultation_id;
  }
  out.updated_at = patch.updated_at || nowIso();
  return out;
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Extract a clinical_chart patch from species form fields.
 * Pass consultationId only from Diagnóstico (creates open problems from motivo).
 */
export function extractChartPatchFromFormData(category, formData, { consultationId, notedAt } = {}) {
  const fd = formData && typeof formData === "object" ? formData : {};
  const when = notedAt || todayDate();
  const patch = {
    vaccines: [],
    surgeries: [],
    deworming: [],
    chronic_conditions: [],
    allergies: [],
    problems: [],
    reproductive: {},
    updated_from_consultation_id: consultationId || null,
    updated_at: nowIso(),
  };

  if (truthySi(fd.vacunas_vigentes) || fd.vacunas_cual) {
    patch.vaccines.push({
      label: String(fd.vacunas_cual || "").trim() || "Vacunas vigentes",
      date: when,
      notes: "",
    });
  }

  for (const [key, label] of [
    ["vacuna_mixomatosis", "Mixomatosis"],
    ["vacuna_vhd", "VHD"],
    ["vacuna_rabia", "Rabia"],
  ]) {
    const raw = fd[key];
    if (!raw || String(raw).trim().toUpperCase() === "NO") continue;
    if (truthySi(raw) || String(raw).trim()) {
      const detail = String(fd[`${key}_fecha`] || fd[`${key}_cual`] || "").trim();
      patch.vaccines.push({ label, date: detail || when, notes: "" });
    }
  }

  if (truthySi(fd.cirugias_previas) || fd.cirugias_cual) {
    patch.surgeries.push({
      label: String(fd.cirugias_cual || "").trim() || "Cirugía previa",
      date: when,
      notes: "",
    });
  }

  if (truthySi(fd.desparasitacion_interna)) {
    const product = String(
      fd.desparasitacion_interna_cual || fd.desparasitacion_interna_producto || "",
    ).trim();
    const date = String(fd.desparasitacion_interna_fecha || when).trim();
    patch.deworming.push({ type: "internal", product: product || "Interna", date });
  }

  if (truthySi(fd.desparasitacion_externa)) {
    const product = String(
      fd.desparasitacion_externa_producto || fd.desparasitacion_externa_cual || "",
    ).trim();
    const date = String(fd.desparasitacion_externa_fecha || when).trim();
    patch.deworming.push({ type: "external", product: product || "Externa", date });
  }

  for (const [field, target] of [
    ["alergias", "allergies"],
    ["alergia", "allergies"],
    ["enfermedades_cronicas", "chronic_conditions"],
    ["enfermedades_previas", "chronic_conditions"],
  ]) {
    const raw = String(fd[field] || "").trim();
    if (!raw || ["NO", "N/A", "NA", "-"].includes(raw.toUpperCase())) continue;
    if (target === "allergies") {
      patch.allergies.push({ label: raw, severity: "", noted_at: when });
    } else {
      patch.chronic_conditions.push({ label: raw, status: "active", noted_at: when });
    }
  }

  const esterilizado = fd.esterilizado || fd.estado_reproductivo;
  if (esterilizado != null && String(esterilizado).trim() !== "") {
    const s = String(esterilizado).trim().toUpperCase();
    if (["SI", "SÍ", "YES", "ESTERILIZADO", "CASTRADO", "OVH", "ORQUIECTOMIA"].includes(s)) {
      patch.reproductive.sterilized = true;
    } else if (["NO", "ENTERO", "ENTERA", "NO ESTERILIZADO"].includes(s)) {
      patch.reproductive.sterilized = false;
    } else {
      patch.reproductive.notes = String(esterilizado).trim();
    }
  }

  const motivo = String(fd.motivo_consulta || fd.sintomas || "").trim();
  if (motivo && consultationId) {
    patch.problems.push({
      id: cryptoRandomId(),
      title: motivo.slice(0, 200),
      status: "open",
      opened_at: when,
      closed_at: "",
      source_consultation_id: consultationId,
    });
  }

  void category;
  return patch;
}

/**
 * Patch for saving species form as patient chart (no CDS consultation, no problems).
 */
export function buildSpeciesFormChartPatch(category, formData) {
  const patch = extractChartPatchFromFormData(category, formData, { consultationId: null });
  patch.problems = [];
  patch.updated_from_consultation_id = null;
  patch.form_snapshot = formData && typeof formData === "object" ? { ...formData } : {};
  patch.form_category = category || null;
  return patch;
}

function setIfEmpty(target, key, value) {
  if (value == null || value === "") return;
  if (target[key] == null || String(target[key]).trim() === "") {
    target[key] = value;
  }
}

/**
 * Prefill form fields from patient + clinical chart + last consultation.
 * Priority: form_snapshot > chart lists > patient demographics > last consultation.
 */
export function hydrateFormDataFromChart(category, chart, patient, lastConsultation) {
  const c = normalizeClinicalChart(chart || patient?.clinical_chart);
  const snapshot =
    c.form_snapshot && typeof c.form_snapshot === "object" ? { ...c.form_snapshot } : {};
  const lastFd =
    lastConsultation?.form_data && typeof lastConsultation.form_data === "object"
      ? lastConsultation.form_data
      : {};
  const next = { ...snapshot };

  if (patient?.name) setIfEmpty(next, "nombre_mascota", patient.name);
  if (patient?.breed) setIfEmpty(next, "raza", patient.breed);
  if (patient?.sex) setIfEmpty(next, "sexo", patient.sex);
  if (patient?.weight_kg != null) setIfEmpty(next, "peso", String(patient.weight_kg));
  const owner = patient?.clients;
  if (owner?.name) setIfEmpty(next, "nombre_dueño", owner.name);

  const lastVaccine = [...(c.vaccines || [])].reverse().find((v) => v?.label);
  if (lastVaccine) {
    setIfEmpty(next, "vacunas_vigentes", "SI");
    setIfEmpty(next, "vacunas_cual", lastVaccine.label);
  }

  const lastSurgery = [...(c.surgeries || [])].reverse().find((s) => s?.label);
  if (lastSurgery) {
    setIfEmpty(next, "cirugias_previas", "SI");
    setIfEmpty(next, "cirugias_cual", lastSurgery.label);
  }

  const lastInternal = [...(c.deworming || [])]
    .reverse()
    .find((d) => d?.type === "internal");
  if (lastInternal) {
    setIfEmpty(next, "desparasitacion_interna", "SI");
    setIfEmpty(next, "desparasitacion_interna_cual", lastInternal.product || "");
    setIfEmpty(next, "desparasitacion_interna_producto", lastInternal.product || "");
    setIfEmpty(next, "desparasitacion_interna_fecha", lastInternal.date || "");
  }

  const lastExternal = [...(c.deworming || [])]
    .reverse()
    .find((d) => d?.type === "external");
  if (lastExternal) {
    setIfEmpty(next, "desparasitacion_externa", "SI");
    setIfEmpty(next, "desparasitacion_externa_producto", lastExternal.product || "");
    setIfEmpty(next, "desparasitacion_externa_fecha", lastExternal.date || "");
  }

  if (c.reproductive?.sterilized === true) {
    setIfEmpty(next, "esterilizado", "SI");
    setIfEmpty(next, "estado_reproductivo", "ESTERILIZADO");
  } else if (c.reproductive?.sterilized === false) {
    setIfEmpty(next, "esterilizado", "NO");
    setIfEmpty(next, "estado_reproductivo", "ENTERO");
  } else if (c.reproductive?.notes) {
    setIfEmpty(next, "estado_reproductivo", c.reproductive.notes);
  }

  const allergies = (c.allergies || []).map((a) => a.label).filter(Boolean);
  if (allergies.length) setIfEmpty(next, "alergias", allergies.join("; "));

  const chronic = (c.chronic_conditions || [])
    .filter((x) => x.status !== "resolved")
    .map((x) => x.label)
    .filter(Boolean);
  if (chronic.length) setIfEmpty(next, "enfermedades_cronicas", chronic.join("; "));

  for (const key of [
    "habitat",
    "dieta",
    "zona_geografica",
    "alimentacion_seco",
    "alimentacion_humedo",
    "alimentacion_casero",
    "alimentacion_frecuencia",
  ]) {
    if (lastFd[key]) setIfEmpty(next, key, lastFd[key]);
  }

  void category;
  return next;
}

export function resolveChartFormCategory(chart, patient) {
  const c = normalizeClinicalChart(chart || patient?.clinical_chart);
  return c.form_category || patient?.species || "";
}

export function openProblems(chart) {
  const c = normalizeClinicalChart(chart);
  return (c.problems || []).filter((p) => p && p.status !== "closed");
}

export function latestByDate(items, dateField = "date") {
  if (!Array.isArray(items) || !items.length) return null;
  return [...items].sort((a, b) => String(b?.[dateField] || "").localeCompare(String(a?.[dateField] || "")))[0];
}

/** Categories supported by LazySpeciesForm (primary keys). */
export const SPECIES_FORM_CATEGORIES = [
  "perros",
  "gatos",
  "conejos",
  "aves",
  "hamsters",
  "cuyos",
  "hurones",
  "erizos",
  "tortugas",
  "iguanas",
  "patos_pollos",
];
