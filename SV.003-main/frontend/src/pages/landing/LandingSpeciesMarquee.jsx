import React from "react";
import { CONSULTATION_CATEGORY_LIST } from "../../lib/consultationCategories";
import { scrollToLandingProduct } from "./landingScroll";

function SpeciesChip({ icon, name, onClick, decorative = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative ? true : undefined}
      className="landing-species-chip inline-flex shrink-0 items-center gap-2.5 border border-guiaa-brand-navy/10 bg-white px-3.5 py-2 text-sm font-semibold text-guiaa-brand-navy transition hover:border-guiaa-brand-blue/25 sm:px-4 sm:py-2.5"
    >
      <span className="category-icon landing-species-icon" aria-hidden>
        {icon}
      </span>
      {name}
    </button>
  );
}

export function LandingSpeciesMarquee() {
  const speciesCount = CONSULTATION_CATEGORY_LIST.length;
  const loopItems = [...CONSULTATION_CATEGORY_LIST, ...CONSULTATION_CATEGORY_LIST];

  return (
    <section
      className="landing-section-band border-y border-guiaa-brand-navy/8 py-10"
      aria-labelledby="landing-species-heading"
    >
      <p id="landing-species-heading" className="landing-eyebrow mb-6 text-center">
        Multiespecie veterinaria · {speciesCount} formularios clínicos
      </p>

      <div className="landing-marquee-viewport landing-marquee-fade relative">
        <div className="landing-marquee-track" aria-label="Especies disponibles en consulta">
          {loopItems.map(({ key, icon, name }, index) => (
            <SpeciesChip
              key={`${key}-${index}`}
              icon={icon}
              name={name}
              decorative={index >= speciesCount}
              onClick={() => scrollToLandingProduct("species")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
