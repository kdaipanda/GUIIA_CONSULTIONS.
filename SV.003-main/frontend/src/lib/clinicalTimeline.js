import i18n from "../i18n";

export function getLabStudyLabel(study) {
  if (!study) return i18n.t("lab.studyDefault", { ns: "clinic" });
  const type = study.image_type;
  const labelKey = `labTypes.${type}.label`;
  if (type && i18n.exists(labelKey, { ns: "clinic" })) {
    return i18n.t(labelKey, { ns: "clinic" });
  }
  return type || i18n.t("lab.studyDefault", { ns: "clinic" });
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
