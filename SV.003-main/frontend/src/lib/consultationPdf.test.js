import { appendConsultationDetail } from "./consultationPdf";

function createWriter() {
  return {
    y: 700,
    lines: [],
    sections: [],
    drawLine(text) {
      this.lines.push(String(text));
    },
    drawSectionTitle(title) {
      this.sections.push(title);
    },
    drawKeyValue(label, value) {
      this.lines.push(`${label}: ${value}`);
    },
  };
}

describe("consultationPdf", () => {
  it("incluye interpretaciones de laboratorio vinculadas en la ficha de consulta", () => {
    const writer = createWriter();
    const consultation = {
      id: "12345678-90ab-cdef-1234-567890abcdef",
      status: "completed",
      created_at: "2026-07-01T12:30:00Z",
      form_data: {
        nombre_mascota: "Luna",
        motivo_consulta: "Decaimiento",
      },
      analysis: "Paciente estable",
      linked_studies: [
        {
          id: "lab-1",
          image_type: "blood_test",
          created_at: "2026-07-01T13:00:00Z",
          analysis: "Hemograma con leucocitosis marcada.",
        },
      ],
    };

    appendConsultationDetail(writer, consultation);

    expect(writer.sections).toContain("Interpretaciones de laboratorio vinculadas");
    expect(writer.lines.some((line) => line.includes("Análisis de sangre"))).toBe(true);
    expect(writer.lines).toContain("Hemograma con leucocitosis marcada.");
  });
});
