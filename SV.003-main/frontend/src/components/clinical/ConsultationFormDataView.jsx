import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";

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

function isEmptyValue(value) {
  if (value == null) return true;
  if (typeof value === "string") return !value.trim();
  if (typeof value === "boolean" || typeof value === "number") return false;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function formatValue(value) {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
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

  return (
    <div className={`consultation-form-data-view${compact ? " is-compact" : ""}`}>
      <button
        type="button"
        className="consultation-form-data-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          {t("patientChart.formDataTitle")}
          {category ? (
            <span className="consultation-form-data-species">
              {" "}
              · {tSpecies(`categories.${category}`, { defaultValue: category })}
            </span>
          ) : null}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="consultation-form-data-body">
          {sections.map((section) => (
            <div key={section.key} className="consultation-form-data-section">
              <h4>{t(SECTION_I18N[section.key] || SECTION_I18N.other)}</h4>
              <dl>
                {section.rows.map(({ field, value }) => (
                  <div key={field} className="consultation-form-data-row">
                    <dt>{labelFor(field)}</dt>
                    <dd>{formatValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
