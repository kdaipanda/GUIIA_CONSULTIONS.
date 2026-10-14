/**
 * Campos mínimos para crear una consulta CDS. El resto del formulario de especie
 * es opcional: más datos mejoran el análisis, pero no bloquean el avance.
 */
export const ESSENTIAL_CONSULTATION_FIELDS = ["nombre_mascota", "edad", "peso"];

const ESSENTIAL_SET = new Set(ESSENTIAL_CONSULTATION_FIELDS);

export function isEssentialConsultationField(fieldId) {
  return ESSENTIAL_SET.has(fieldId);
}

export function missingEssentialConsultationFields(formData) {
  return ESSENTIAL_CONSULTATION_FIELDS.filter(
    (fieldId) => !String(formData?.[fieldId] ?? "").trim(),
  );
}
