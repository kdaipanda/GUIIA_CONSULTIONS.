import React from "react";
import { Award, ShieldCheck, Users } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, text: "Verificación de cédula MVZ" },
  { icon: Award, text: "Metodología CDS L4 · L5" },
  { icon: Users, text: "Enfoque clínico LATAM" },
];

export function LandingTrustStrip() {
  return (
    <section className="border-y landing-trust-divider bg-white/70 py-5 sm:py-6">
      <div className="mx-auto flex max-w-6xl flex-col divide-y landing-trust-divider px-5 sm:flex-row sm:divide-x sm:divide-y-0 sm:px-8 lg:px-10">
        {ITEMS.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex flex-1 items-center justify-center gap-3 px-2 py-3.5 text-sm font-semibold text-guiaa-brand-navy sm:justify-center sm:px-6 sm:py-0"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-guiaa-brand-blue/10">
              <Icon size={17} className="text-guiaa-brand-blue" aria-hidden />
            </span>
            {text}
          </div>
        ))}
      </div>
    </section>
  );
}
