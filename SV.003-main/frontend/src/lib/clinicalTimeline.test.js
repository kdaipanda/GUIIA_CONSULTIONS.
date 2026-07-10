import { buildClinicalTimeline, countStandaloneLabStudies, getLabStudyLabel } from "./clinicalTimeline";

describe("clinicalTimeline", () => {
  const consultations = [
    { id: "c1", created_at: "2026-07-01T10:00:00Z", status: "completed" },
    { id: "c2", created_at: "2026-06-20T10:00:00Z", status: "draft" },
  ];

  const medicalImages = [
    { id: "s1", consultation_id: "c1", image_type: "blood_test", created_at: "2026-07-01T11:00:00Z" },
    { id: "s2", consultation_id: null, image_type: "urinalysis", created_at: "2026-07-05T09:00:00Z" },
  ];

  it("anida estudios bajo su consulta y deja sueltos los independientes", () => {
    const timeline = buildClinicalTimeline(consultations, medicalImages);
    expect(timeline).toHaveLength(3);
    expect(timeline[0].kind).toBe("lab_study");
    expect(timeline[0].study.id).toBe("s2");
    expect(timeline[1].kind).toBe("consultation");
    expect(timeline[1].linkedStudies).toHaveLength(1);
    expect(timeline[1].linkedStudies[0].id).toBe("s1");
  });

  it("cuenta estudios sin consulta visible", () => {
    expect(countStandaloneLabStudies(medicalImages, consultations)).toBe(1);
  });

  it("resuelve etiquetas de estudio", () => {
    expect(getLabStudyLabel({ image_type: "blood_test" })).toBe("Análisis de sangre");
  });
});
