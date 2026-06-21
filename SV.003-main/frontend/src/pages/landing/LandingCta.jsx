import React from "react";
import { ArrowRight } from "lucide-react";
import { scrollToLandingSection } from "./landingScroll";

export function LandingCta({ setView }) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="landing-cta-panel relative overflow-hidden rounded-2xl bg-guiaa-brand-navy px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Registro exclusivo para MVZ
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-sky-100/75 sm:text-base">
            Verificamos tu cédula profesional. Empieza a estructurar consultas con
            soporte CDS L4 y L5.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setView("register")}
              className="inline-flex items-center gap-2 rounded-xl bg-guiaa-brand-green px-8 py-3.5 text-sm font-bold text-white transition hover:bg-guiaa-brand-green-dark"
            >
              Crear cuenta MVZ
              <ArrowRight size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setView("login")}
              className="rounded-xl border border-white/20 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ya tengo cuenta
            </button>
          </div>
          <button
            type="button"
            onClick={() => scrollToLandingSection("#faq")}
            className="mt-5 text-sm text-sky-100/60 transition hover:text-white"
          >
            Ver preguntas frecuentes
          </button>
        </div>
      </div>
    </section>
  );
}
