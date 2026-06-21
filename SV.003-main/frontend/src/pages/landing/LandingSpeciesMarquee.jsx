import React from "react";
import { scrollToLandingProduct } from "./landingScroll";

const SPECIES = [
  { label: "Perros", icon: "🐕" },
  { label: "Gatos", icon: "🐈" },
  { label: "Aves", icon: "🦜" },
  { label: "Reptiles", icon: "🦎" },
  { label: "Exóticos", icon: "🐹" },
  { label: "Conejos", icon: "🐰" },
];

export function LandingSpeciesMarquee() {
  const items = [...SPECIES, ...SPECIES];

  return (
    <section className="overflow-hidden border-y border-guiaa-brand-navy/8 bg-guiaa-sky-soft/30 py-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-guiaa-brand-navy/40">
        Especies soportadas
      </p>
      <div className="landing-marquee-fade relative">
        <div className="flex landing-marquee-track gap-3 whitespace-nowrap">
          {items.map(({ label, icon }, index) => (
            <button
              key={`${label}-${index}`}
              type="button"
              onClick={() => scrollToLandingProduct("species")}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-guiaa-brand-navy/10 bg-white px-4 py-2 text-sm font-medium text-guiaa-brand-navy/70 transition hover:border-guiaa-brand-blue/25 hover:text-guiaa-brand-navy"
            >
              <span className="text-base leading-none" aria-hidden>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
