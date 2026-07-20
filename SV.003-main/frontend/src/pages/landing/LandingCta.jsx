import React from "react";
import { ArrowRight } from "lucide-react";
import { scrollToLandingSection } from "./landingScroll";

export function LandingCta({ setView }) {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="landing-cta-panel landing-cta-panel-v2 relative overflow-hidden">
          <div>
            <p className="landing-eyebrow">Registro profesional MVZ</p>
            <h2 className="landing-section-title mt-3 text-3xl sm:text-4xl">
              Tu consulta veterinaria, documentada con rigor clínico
            </h2>
            <p className="landing-lead mt-4 max-w-lg">
              Verificamos tu cédula profesional. Empieza a registrar pacientes multiespecie
              con soporte CDS L4 y L5 desde el primer día.
            </p>
            <button
              type="button"
              onClick={() => scrollToLandingSection("#faq")}
              className="landing-cta-faq-link mt-5 inline-flex min-h-11 items-center text-sm font-medium text-white transition hover:text-white"
            >
              Ver preguntas frecuentes
            </button>
          </div>

          <div className="landing-cta-actions">
            <button
              type="button"
              onClick={() => setView("register")}
              className="landing-cta-primary-btn inline-flex min-h-11 items-center justify-center gap-2 landing-btn-primary"
            >
              Crear cuenta MVZ
              <ArrowRight size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setView("login")}
              className="landing-cta-secondary-btn landing-btn-on-dark min-h-11"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
