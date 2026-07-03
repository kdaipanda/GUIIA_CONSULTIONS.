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
    <section className="landing-trust-strip" aria-label="Garantías GUIAA">
      <div className="landing-container landing-trust-strip-inner">
        {ITEMS.map(({ icon: Icon, text, sub }) => (
          <div key={text} className="landing-trust-strip-item">
            <span className="landing-trust-icon shrink-0">
              <Icon size={17} className="text-guiaa-brand-blue" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-guiaa-brand-navy">{text}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-guiaa-brand-ink-muted">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
