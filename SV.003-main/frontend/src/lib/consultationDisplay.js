import i18n from "../i18n";
import {
  CONSULTATION_CATEGORY_ICONS,
} from "./consultationCategories";

/** @deprecated Prefer getConsultationStatusLabel — kept for callers that read keys */
export const CONSULTATION_STATUS_LABELS = {
  completed: "Completada",
  in_progress: "En progreso",
  draft: "Borrador",
};

export function formatConsultationFolio(consultation) {
  if (!consultation?.id) return "—";
  return `CONS-${consultation.id.slice(0, 8).toUpperCase()}`;
}

export function getConsultationSpeciesKey(consultation) {
  return (consultation?.category || consultation?.especie || "").toLowerCase();
}

export function getConsultationSpeciesIcon(consultation) {
  const key = getConsultationSpeciesKey(consultation);
  return CONSULTATION_CATEGORY_ICONS[key] || "🐾";
}

export function getConsultationSpeciesLabel(consultation) {
  const key = getConsultationSpeciesKey(consultation);
  if (key) {
    const categoryKey = `categories.${key}`;
    if (i18n.exists(categoryKey, { ns: "speciesForms" })) {
      return i18n.t(categoryKey, { ns: "speciesForms" });
    }
  }
  return key || i18n.t("consultationDisplay.multispecies", { ns: "clinic" });
}

export function getConsultationPatientTitle(consultation) {
  const name = consultation?.nombre_mascota?.trim();
  const species = getConsultationSpeciesLabel(consultation);
  const breed = consultation?.raza?.trim();

  if (name) {
    const meta = [species, breed].filter(Boolean).join(" · ");
    return meta ? `${name} · ${meta}` : name;
  }

  return breed ? `${species} · ${breed}` : species;
}

export function getConsultationReasonPreview(consultation, maxLength = 120) {
  const text =
    consultation?.motivo_consulta ||
    consultation?.detalle_paciente ||
    consultation?.sintomas ||
    "";

  const cleaned = String(text).trim();
  if (!cleaned) return i18n.t("consultationDisplay.noClinicalDescription", { ns: "clinic" });
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trim()}…`;
}

export function formatConsultationDateShort(value) {
  if (!value) return "—";
  const locale = i18n.language?.startsWith("en") ? "en-US" : "es-MX";
  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getConsultationStatusLabel(status) {
  if (!status) return "—";
  const key = `consultationStatus.${status}`;
  if (i18n.exists(key, { ns: "clinic" })) {
    return i18n.t(key, { ns: "clinic" });
  }
  return CONSULTATION_STATUS_LABELS[status] || status;
}

export function normalizeConsultationRecord(consultation) {
  if (!consultation) return null;
  const formData = consultation.form_data || {};
  return {
    ...consultation,
    nombre_mascota: formData.nombre_mascota || consultation.nombre_mascota,
    nombre_dueno:
      formData.nombre_dueño ||
      formData.nombre_dueno ||
      consultation.nombre_dueño ||
      consultation.nombre_dueno,
    raza: formData.raza || consultation.raza,
    edad: formData.edad || consultation.edad,
    sexo: formData.sexo || consultation.sexo,
    peso: formData.peso || consultation.peso,
    category: consultation.category || consultation.especie,
    motivo_consulta:
      formData.motivo_consulta ||
      consultation.motivo_consulta ||
      consultation.detalle_paciente,
    sintomas: formData.sintomas || consultation.sintomas,
    detalle_paciente: consultation.detalle_paciente || formData.motivo_consulta,
  };
}

export function getConsultationSearchHaystack(consultation) {
  const normalized = normalizeConsultationRecord(consultation);
  const formData = consultation?.form_data || {};
  return [
    formatConsultationFolio(consultation),
    consultation?.id,
    normalized?.nombre_mascota,
    normalized?.nombre_dueno,
    normalized?.raza,
    normalized?.category,
    normalized?.motivo_consulta,
    normalized?.sintomas,
    normalized?.detalle_paciente,
    formData.alimentacion,
    formData.dieta,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
