import React from "react";
import { Award, ShieldCheck, Users } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, text: "Verificación de cédula MVZ" },
  { icon: Award, text: "Metodología CDS L4 · L5" },
  { icon: Users, text: "Enfoque clínico LATAM" },
];

export function LandingTrustStrip() {
  return (
    <section className="border-y border-guiaa-brand-navy/8 bg-white/70 py-6">
      <div className="mx-auto grid max-w-6xl gap-4 px-5 sm:grid-cols-3 sm:gap-6 sm:px-8 lg:px-10">
        {ITEMS.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center justify-center gap-2.5 rounded-xl border border-guiaa-brand-navy/8 bg-white/80 px-4 py-3 text-sm font-medium text-guiaa-brand-navy/65 sm:justify-start sm:border-transparent sm:bg-transparent sm:px-0 sm:py-0"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-guiaa-brand-blue/10">
              <Icon size={16} className="text-guiaa-brand-blue" aria-hidden />
            </span>
            {text}
          </div>
        ))}
      </div>
    </section>
  );
}
