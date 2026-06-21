import React, { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "¿Quién puede registrarse en GUIAA?",
    a: "Solo médicos veterinarios certificados. Durante el registro verificamos tu cédula profesional para garantizar un entorno clínico exclusivo.",
  },
  {
    q: "¿Qué es CDS L4 y L5?",
    a: "Son niveles de soporte a la decisión clínica: L4 ayuda a estructurar hipótesis diagnósticas; L5 extiende el razonamiento hacia planes terapéuticos basados en evidencia. Siempre bajo tu criterio profesional.",
  },
  {
    q: "¿Qué especies cubre la plataforma?",
    a: "Perros, gatos, conejos, aves, reptiles, hurones, erizos, hámsters, cuyos, iguanas y aves de corral. Cada especie activa un formulario veterinario adaptado en la consulta.",
  },
  {
    q: "¿Mis datos clínicos están seguros?",
    a: "Aplicamos buenas prácticas de seguridad y privacidad. Los expedientes y consultas se gestionan con controles de acceso por cuenta profesional.",
  },
  {
    q: "¿Puedo usar GUIAA en consultorio y a domicilio?",
    a: "Sí. Es una plataforma web: funciona en consultorio fijo o en visitas externas desde tablet o laptop con navegador moderno.",
  },
  {
    q: "¿Necesito instalar algo?",
    a: "No. Accedes desde el navegador. Solo necesitas conexión a internet y tu cuenta MVZ verificada.",
  },
];

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="landing-card overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-guiaa-sky-soft/25"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-guiaa-brand-navy sm:text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-guiaa-brand-navy/40 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-guiaa-brand-navy/8 px-5 py-4 text-sm leading-relaxed text-guiaa-brand-ink-muted">
            {a}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingFaq({ setView }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id="faq"
      className="landing-section border-t border-guiaa-brand-navy/8 bg-white/40"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="landing-eyebrow">Antes de registrarte</p>
            <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="landing-lead mt-4 text-sm sm:text-base">
              Dudas habituales sobre acceso, especies, seguridad y uso en consulta.
            </p>

            <div className="landing-card mt-8 rounded-xl p-5">
              <p className="text-sm font-semibold text-guiaa-brand-navy">
                ¿No encuentras tu respuesta?
              </p>
              <p className="mt-2 text-sm text-guiaa-brand-ink-muted">
                Escríbenos y te orientamos antes del registro.
              </p>
              <a
                href="mailto:soporte@guiaa.vet"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-guiaa-brand-blue transition hover:text-guiaa-brand-navy"
              >
                <Mail size={15} aria-hidden />
                soporte@guiaa.vet
              </a>
              {setView && (
                <button
                  type="button"
                  onClick={() => setView("register")}
                  className="mt-4 block text-sm font-semibold text-guiaa-brand-green-dark transition hover:text-guiaa-brand-green"
                >
                  Crear cuenta MVZ →
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {FAQ_ITEMS.map(({ q, a }, index) => (
              <FaqItem
                key={q}
                q={q}
                a={a}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
