export const IMAGE_TYPE_LABELS = {
  blood_test: "Análisis de sangre",
  urinalysis: "Urianálisis",
  xray: "Radiografía",
  general: "Estudio general",
};

export function getLabStudyLabel(study) {
  if (!study) return "Estudio";
  return IMAGE_TYPE_LABELS[study.image_type] || study.image_type || "Estudio";
}

export function getLabStudySearchHaystack(study) {
  if (!study) return "";
  return [
    study.id,
    study.patient_name,
    study.image_type,
    getLabStudyLabel(study),
    study.analysis,
    study.additional_context,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Une consultas CDS e interpretaciones de laboratorio en una línea de tiempo.
 * Los estudios con consultation_id se anidan bajo su consulta; el resto aparece suelto.
 */
export function buildClinicalTimeline(consultations = [], medicalImages = []) {
  const consultationIds = new Set((consultations || []).map((c) => c.id).filter(Boolean));
  const studiesByConsultation = new Map();
  const standaloneStudies = [];

  for (const study of medicalImages || []) {
    const consultationId = study.consultation_id;
    if (consultationId && consultationIds.has(consultationId)) {
      if (!studiesByConsultation.has(consultationId)) {
        studiesByConsultation.set(consultationId, []);
      }
      studiesByConsultation.get(consultationId).push(study);
    } else {
      standaloneStudies.push(study);
    }
  }

  const sortByDateDesc = (a, b) =>
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();

  const items = [];

  for (const consultation of consultations || []) {
    const linkedStudies = (studiesByConsultation.get(consultation.id) || []).sort(sortByDateDesc);
    items.push({
      kind: "consultation",
      id: consultation.id,
      created_at: consultation.created_at,
      consultation,
      linkedStudies,
    });
  }

  for (const study of standaloneStudies) {
    items.push({
      kind: "lab_study",
      id: study.id,
      created_at: study.created_at,
      study,
    });
  }

  items.sort(sortByDateDesc);
  return items;
}

export function countStandaloneLabStudies(medicalImages = [], consultations = []) {
  const consultationIds = new Set((consultations || []).map((c) => c.id).filter(Boolean));
  return (medicalImages || []).filter(
    (study) => !study.consultation_id || !consultationIds.has(study.consultation_id),
  ).length;
}
