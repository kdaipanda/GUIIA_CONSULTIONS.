import React from "react";
import { FileText, PawPrint, ShieldCheck } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    text: "Cédula profesional MVZ verificada",
    sub: "Acceso exclusivo para médicos veterinarios",
  },
  {
    icon: PawPrint,
    text: "Formularios por especie veterinaria",
    sub: "Perros, felinos, aves, reptiles y exóticos",
  },
  {
    icon: FileText,
    text: "Historia clínica longitudinal",
    sub: "Expediente unificado por paciente y dueño",
  },
];

export function LandingTrustStrip() {
  return (
    <section className="border-y landing-trust-divider bg-white/70 py-5 sm:py-6">
      <div className="mx-auto flex max-w-6xl flex-col divide-y landing-trust-divider px-5 sm:flex-row sm:divide-x sm:divide-y-0 sm:px-8 lg:px-10">
        {ITEMS.map(({ icon: Icon, text, sub }) => (
          <div
            key={text}
            className="flex flex-1 items-center gap-3 px-2 py-3.5 sm:justify-center sm:px-6 sm:py-0"
          >
            <span className="landing-trust-icon shrink-0">
              <Icon size={17} className="text-guiaa-brand-blue" aria-hidden />
            </span>
            <div className="min-w-0 text-left sm:text-center">
              <p className="text-sm font-bold text-guiaa-brand-navy">{text}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-guiaa-brand-ink-muted">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
