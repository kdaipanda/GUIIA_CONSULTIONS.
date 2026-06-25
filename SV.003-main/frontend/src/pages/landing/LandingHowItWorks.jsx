import React from "react";
import { ClipboardPlus, PawPrint, Stethoscope } from "lucide-react";

const STEPS = [
  {
    icon: PawPrint,
    step: "01",
    title: "Registro MVZ",
    detail: "Crea tu cuenta con cédula profesional. Verificación incluida para LATAM.",
  },
  {
    icon: Stethoscope,
    step: "02",
    title: "Primera consulta",
    detail: "Elige especie, registra al paciente y documenta con formularios CDS L4·L5.",
  },
  {
    icon: ClipboardPlus,
    step: "03",
    title: "Expediente completo",
    detail: "Dueño, mascota, ventas e historial clínico conectados en un solo lugar.",
  },
];

export function LandingHowItWorks({ setView }) {
  return (
    <section
      id="como-funciona"
      className="landing-section landing-section-band border-y border-guiaa-brand-navy/8"
      aria-labelledby="landing-how-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow">Cómo funciona</p>
          <h2
            id="landing-how-heading"
            className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl"
          >
            De registro a expediente en tres pasos
          </h2>
          <p className="landing-lead mx-auto mt-4">
            Sin curva de aprendizaje larga: empiezas a documentar consultas desde el primer día.
          </p>
        </div>

        <ol className="landing-how-steps mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, step, title, detail }) => (
            <li key={step} className="landing-how-step">
              <span className="landing-how-step-num">{step}</span>
              <span className="landing-how-step-icon" aria-hidden>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-base font-bold text-guiaa-brand-navy">{title}</h3>
              <p className="landing-body mt-2 text-sm leading-relaxed">{detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setView("register")}
            className="landing-btn-primary"
          >
            Comenzar registro MVZ
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("product");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="landing-btn-secondary"
          >
            Explorar interfaz sin registro
          </button>
        </div>
      </div>
    </section>
  );
}
