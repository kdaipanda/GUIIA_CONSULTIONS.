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
      className="landing-species-chip category-card--liquid inline-flex shrink-0 items-center gap-2.5 px-3.5 py-2 text-sm font-semibold text-guiaa-brand-navy sm:px-4 sm:py-2.5"
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
      className="landing-section-band landing-species-glass-section border-y border-guiaa-brand-navy/8 py-10"
      aria-labelledby="landing-species-heading"
    >
      <div className="landing-container mb-6 text-center">
        <p
          id="landing-species-heading"
          className="category-selector-glass-badge landing-species-glass-badge inline-block w-fit"
        >
          Multiespecie veterinaria · {speciesCount} formularios clínicos
        </p>
      </div>

      <div className="category-selector-glass-panel landing-species-glass-panel landing-container">
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
      </div>
    </section>
  );
}
