import React from "react";
import { ArrowUpRight, HeartPulse, MapPin, PawPrint, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";
import { scrollToLandingProduct } from "./landingScroll";

const USE_CASES = [
  { id: "first", icon: Stethoscope, productTab: "consultation" },
  { id: "chronic", icon: HeartPulse, productTab: "consultation" },
  { id: "exotic", icon: PawPrint, productTab: "species" },
  { id: "house", icon: MapPin, productTab: "consultation" },
];

export function LandingUseCases() {
  const { t } = useTranslation("landing");

  return (
    <section className="landing-section border-t border-guiaa-brand-navy/8">
      <div className="landing-container">
        <div className="landing-section-head max-w-xl">
          <p className="landing-eyebrow">{t("useCases.eyebrow")}</p>
          <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
            {t("useCases.title")}
          </h2>
          <p className="landing-lead mt-4">{t("useCases.lead")}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {USE_CASES.map(({ id, icon: Icon, productTab }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToLandingProduct(productTab)}
              className="landing-card landing-card-interactive group flex flex-col rounded-2xl p-6 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="landing-clinical-step-icon shrink-0">
                  <Icon size={18} strokeWidth={1.75} aria-hidden />
                </span>
                <span className="landing-vet-tag shrink-0">
                  {t(`useCases.items.${id}.tag`)}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-guiaa-brand-navy">
                {t(`useCases.items.${id}.title`)}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-guiaa-brand-ink-muted">
                {t(`useCases.items.${id}.description`)}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-guiaa-brand-blue transition group-hover:gap-1.5">
                {t("useCases.seeFlow")}
                <ArrowUpRight size={13} aria-hidden />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
