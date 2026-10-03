import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import "./consultationFormDataView.css";

const SECTION_FIELD_MAP = {
  identification: [
    "fecha",
    "nombre_mascota",
    "nombre_dueño",
    "nombre_dueno",
    "especie",
    "raza",
    "mix",
    "sexo",
    "edad",
    "peso",
    "condicion_corporal",
    "estado_reproductivo",
    "esterilizado",
  ],
  antecedents: [
    "vacunas_vigentes",
    "vacunas_cual",
    "vacuna_mixomatosis",
    "vacuna_vhd",
    "vacuna_rabia",
    "desparasitacion_interna",
    "desparasitacion_interna_cual",
    "desparasitacion_interna_producto",
    "desparasitacion_interna_fecha",
    "desparasitacion_externa",
    "desparasitacion_externa_producto",
    "desparasitacion_externa_cual",
    "desparasitacion_externa_fecha",
    "cirugias_previas",
    "cirugias_cual",
    "alergias",
    "alergia",
    "enfermedades_cronicas",
    "enfermedades_previas",
    "medicamentos",
    "medicamentos_cual",
  ],
  environment: [
    "habitat",
    "zona_geografica",
    "dieta",
    "alimentacion_seco",
    "alimentacion_humedo",
    "alimentacion_casero",
    "alimentacion_frecuencia",
    "paseos",
    "paseos_frecuencia",
    "baños_estetica",
    "baños_fecha",
  ],
  chiefComplaint: ["motivo_consulta", "sintomas", "detalle_paciente"],
  exam: [
    "aspecto_pelaje",
    "aspecto_piel",
    "aspecto_oidos",
    "aspecto_ojos",
    "aspecto_otros",
    "vomito",
    "vomito_color",
    "vomito_aspecto",
    "diarrea",
    "diarrea_color",
    "diarrea_aspecto",
    "orina",
    "orina_color",
    "orina_olor",
    "secrecion_nasal",
    "secrecion_nasal_color",
    "secrecion_nasal_aspecto",
    "secrecion_ocular",
    "secrecion_ocular_color",
    "dientes",
    "dientes_otros",
    "piel_condicion",
    "actividad_general",
    "ultima_comida",
    "ultima_comida_fecha",
    "liquidos",
    "liquidos_cantidad",
  ],
};

const SECTION_I18N = {
  identification: "patientChart.formSections.identification",
  antecedents: "patientChart.formSections.antecedents",
  environment: "patientChart.formSections.environment",
  chiefComplaint: "patientChart.formSections.chiefComplaint",
  exam: "patientChart.formSections.exam",
  other: "patientChart.formSections.other",
};

const LONG_TEXT_FIELDS = new Set(["detalle_paciente", "motivo_consulta", "sintomas", "alergias", "alergia"]);

function isEmptyValue(value) {
  if (value == null) return true;
  if (typeof value === "string") return !value.trim();
  if (typeof value === "boolean" || typeof value === "number") return false;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function normalizeYesNo(value) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return null;
  if (typeof value !== "string") return null;
  const lower = value.trim().toLowerCase();
  if (lower === "true" || lower === "si" || lower === "sí" || lower === "yes") return "yes";
  if (lower === "false" || lower === "no") return "no";
  return null;
}

function formatValue(value) {
  const yn = normalizeYesNo(value);
  if (yn === "yes") return "Sí";
  if (yn === "no") return "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).filter(Boolean).join(", ");
  }
  if (typeof value === "object" && value != null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function FieldRow({ field, value, label }) {
  const yn = normalizeYesNo(value);
  const display = formatValue(value);
  const isLong = LONG_TEXT_FIELDS.has(field) || (typeof value === "string" && value.length > 120);

  if (isLong) {
    return (
      <div className="cfd-field cfd-field--prose">
        <div className="cfd-field-label">{label}</div>
        <div className="cfd-field-prose">{display}</div>
      </div>
    );
  }

  return (
    <div className="cfd-field">
      <div className="cfd-field-label">{label}</div>
      <div className="cfd-field-value">
        {yn ? (
          <span className={`cfd-pill cfd-pill--${yn}`}>{display}</span>
        ) : (
          display
        )}
      </div>
    </div>
  );
}

/**
 * Read-only view of species form_data grouped by clinical sections.
 */
export function ConsultationFormDataView({
  category,
  formData,
  defaultOpen = false,
  compact = false,
}) {
  const { t } = useTranslation("clinic");
  const { t: tSpecies, i18n } = useTranslation("speciesForms");
  const [open, setOpen] = useState(defaultOpen);

  const sections = useMemo(() => {
    const fd = formData && typeof formData === "object" ? formData : {};
    const assigned = new Set();
    const result = [];

    for (const [sectionKey, fields] of Object.entries(SECTION_FIELD_MAP)) {
      const rows = [];
      for (const field of fields) {
        if (!(field in fd) || isEmptyValue(fd[field])) continue;
        assigned.add(field);
        rows.push({ field, value: fd[field] });
      }
      if (rows.length) result.push({ key: sectionKey, rows });
    }

    const otherRows = [];
    for (const [field, value] of Object.entries(fd)) {
      if (assigned.has(field) || isEmptyValue(value)) continue;
      if (field.startsWith("_")) continue;
      otherRows.push({ field, value });
    }
    if (otherRows.length) result.push({ key: "other", rows: otherRows });
    return result;
  }, [formData]);

  const labelFor = (field) => {
    const key = `fields.${field}`;
    if (i18n.exists(key, { ns: "speciesForms" })) {
      return tSpecies(key).replace(/\s*\*$/, "");
    }
    return field.replace(/_/g, " ");
  };

  if (!sections.length) {
    return <p className="clinic-muted">{t("patientChart.formEmpty")}</p>;
  }

  const speciesLabel = category
    ? tSpecies(`categories.${category}`, { defaultValue: category })
    : null;

  return (
    <div className={`cfd-root${compact ? " cfd-root--compact" : ""}${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="cfd-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="cfd-toggle-left">
          <span className="cfd-toggle-icon" aria-hidden>
            <ClipboardList size={18} />
          </span>
          <span className="cfd-toggle-copy">
            <span className="cfd-toggle-title">{t("patientChart.formDataTitle")}</span>
            {speciesLabel ? <span className="cfd-toggle-species">{speciesLabel}</span> : null}
          </span>
        </span>
        <span className="cfd-toggle-chevron" aria-hidden>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open ? (
        <div className="cfd-body">
          {sections.map((section) => (
            <section key={section.key} className="cfd-section">
              <h4 className="cfd-section-title">
                {t(SECTION_I18N[section.key] || SECTION_I18N.other)}
              </h4>
              <div className={`cfd-grid${section.key === "exam" ? " cfd-grid--chips" : ""}`}>
                {section.rows.map(({ field, value }) => (
                  <FieldRow
                    key={field}
                    field={field}
                    value={value}
                    label={labelFor(field)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
