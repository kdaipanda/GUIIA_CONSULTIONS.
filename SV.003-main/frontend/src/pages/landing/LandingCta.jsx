import React from "react";
import { ArrowRight } from "lucide-react";
import { scrollToLandingSection } from "./landingScroll";

export function LandingCta({ setView }) {
  return (
    <section className="landing-section">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="landing-cta-panel relative overflow-hidden rounded-2xl bg-guiaa-brand-navy px-6 py-14 sm:px-12">
          <div>
            <p className="landing-eyebrow text-sky-100/80">Acceso profesional</p>
            <h2 className="landing-section-title mt-3 text-3xl text-white sm:text-4xl">
              Registro exclusivo para MVZ
            </h2>
            <p className="landing-lead mt-4 max-w-lg">
              Verificamos tu cédula profesional. Empieza a estructurar consultas con
              soporte CDS L4 y L5.
            </p>
            <button
              type="button"
              onClick={() => scrollToLandingSection("#faq")}
              className="mt-5 text-sm font-medium text-sky-100/70 transition hover:text-white"
            >
              Ver preguntas frecuentes
            </button>
          </div>

          <div className="landing-cta-actions">
            <button
              type="button"
              onClick={() => setView("register")}
              className="inline-flex items-center gap-2 landing-btn-primary"
            >
              Crear cuenta MVZ
              <ArrowRight size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setView("login")}
              className="rounded-xl border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
