import React from "react";
import { ArrowUpRight, HeartPulse, MapPin, PawPrint, Stethoscope } from "lucide-react";
import { scrollToLandingProduct } from "./landingScroll";

const USE_CASES = [
  {
    icon: Stethoscope,
    title: "Primera consulta y anamnesis",
    description:
      "Captura motivo de consulta, antecedentes y signos referidos con campos adaptados a la especie — caninos, felinos o exóticos.",
    tag: "Medicina general",
    productTab: "consultation",
  },
  {
    icon: HeartPulse,
    title: "Seguimiento de casos crónicos",
    description:
      "Retoma el expediente del paciente, compara visitas previas y documenta evolución sin reconstruir la historia clínica.",
    tag: "Medicina interna",
    productTab: "consultation",
  },
  {
    icon: PawPrint,
    title: "Exóticos y NAC",
    description:
      "Flujos específicos para aves, reptiles, hurones, roedores y más — con la misma trazabilidad que en pequeñas especies.",
    tag: "Medicina de exóticos",
    productTab: "species",
  },
  {
    icon: MapPin,
    title: "Consulta domiciliaria",
    description:
      "Misma plataforma web en tablet o laptop durante visitas externas, con historial clínico sincronizado al consultorio.",
    tag: "Visita a domicilio",
    productTab: "consultation",
  },
];

export function LandingUseCases() {
  return (
    <section className="landing-section border-t border-guiaa-brand-navy/8">
      <div className="landing-container">
        <div className="landing-section-head max-w-xl">
          <p className="landing-eyebrow">Práctica veterinaria</p>
          <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
            Escenarios reales del consultorio
          </h2>
          <p className="landing-lead mt-4">
            Desde la primera consulta del cachorro hasta el seguimiento del paciente
            exótico — GUIAA acompaña cada etapa del acto clínico.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {USE_CASES.map(({ icon: Icon, title, description, tag, productTab }) => (
            <button
              key={title}
              type="button"
              onClick={() => scrollToLandingProduct(productTab)}
              className="landing-card landing-card-interactive group flex flex-col rounded-2xl p-6 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="landing-clinical-step-icon shrink-0">
                  <Icon size={18} strokeWidth={1.75} aria-hidden />
                </span>
                <span className="landing-vet-tag shrink-0">{tag}</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-guiaa-brand-navy">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-guiaa-brand-ink-muted">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-guiaa-brand-blue transition group-hover:gap-1.5">
                Ver flujo clínico
                <ArrowUpRight size={13} aria-hidden />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
