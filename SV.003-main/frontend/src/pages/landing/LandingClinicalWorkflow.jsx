import React from "react";
import {
  ClipboardPlus,
  FileSearch,
  HeartPulse,
  Microscope,
  PawPrint,
  Pill,
} from "lucide-react";
import { scrollToLandingProduct } from "./landingScroll";

const CLINICAL_STEPS = [
  {
    icon: PawPrint,
    step: "01",
    title: "Paciente y especie",
    detail: "Dueño, raza, peso y antecedentes por categoría veterinaria.",
  },
  {
    icon: ClipboardPlus,
    step: "02",
    title: "Anamnesis",
    detail: "Motivo de consulta y signos referidos con campos adaptados.",
  },
  {
    icon: HeartPulse,
    step: "03",
    title: "Examen físico",
    detail: "Hallazgos clínicos registrados en secuencia estructurada.",
  },
  {
    icon: Microscope,
    step: "04",
    title: "Razonamiento CDS",
    detail: "Hipótesis diagnósticas con soporte L4 y L5 bajo tu criterio.",
  },
  {
    icon: Pill,
    step: "05",
    title: "Plan terapéutico",
    detail: "Tratamiento, seguimiento y recomendaciones al propietario.",
  },
  {
    icon: FileSearch,
    step: "06",
    title: "Expediente",
    detail: "Historia longitudinal disponible en la siguiente visita.",
  },
];

export function LandingClinicalWorkflow() {
  return (
    <section className="landing-section landing-section-first landing-clinical-workflow-section border-b border-guiaa-brand-navy/8">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="landing-section-head-wide items-start sm:items-end">
          <div className="landing-section-head">
            <p className="landing-eyebrow">Flujo clínico veterinario</p>
            <h2 className="landing-section-title mt-3 text-2xl text-guiaa-brand-navy sm:text-3xl">
              De la recepción del paciente al expediente completo
            </h2>
            <p className="landing-lead mt-4">
              GUIAA refleja cómo trabajas en consulta: datos del paciente, razonamiento
              clínico y trazabilidad — sin saltar entre herramientas desconectadas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToLandingProduct("consultation")}
            className="landing-btn-secondary shrink-0"
          >
            Ver consulta en vivo
          </button>
        </div>

        <div className="landing-clinical-flow mt-10 sm:mt-12">
          {CLINICAL_STEPS.map(({ icon: Icon, step, title, detail }) => (
            <article key={step} className="landing-clinical-step">
              <span className="landing-clinical-step-num">{step}</span>
              <span className="landing-clinical-step-icon" aria-hidden>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <h3 className="landing-clinical-step-title mt-3 text-sm font-bold">{title}</h3>
              <p className="landing-clinical-step-detail landing-body mt-1.5 text-xs leading-relaxed">{detail}</p>
            </article>
          ))}
        </div>

        <p className="landing-clinical-workflow-foot landing-body mt-8 text-center text-xs sm:text-sm">
          Cada especie activa formularios veterinarios distintos — perros, felinos, aves,
          reptiles, exóticos y más.
        </p>
      </div>
    </section>
  );
}
