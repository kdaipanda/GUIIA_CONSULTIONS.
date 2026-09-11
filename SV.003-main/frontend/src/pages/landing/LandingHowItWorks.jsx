import React from "react";
import { ClipboardPlus, PawPrint, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";
import { scrollToLandingProduct } from "./landingScroll";

const STEPS = [
  { icon: PawPrint, step: "01" },
  { icon: Stethoscope, step: "02" },
  { icon: ClipboardPlus, step: "03" },
];

export function LandingHowItWorks({ setView }) {
  const { t } = useTranslation("landing");

  return (
    <section
      id="como-funciona"
      className="landing-section landing-section-band border-y border-guiaa-brand-navy/8"
      aria-labelledby="landing-how-heading"
    >
      <div className="landing-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow">{t("how.eyebrow")}</p>
          <h2
            id="landing-how-heading"
            className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl"
          >
            {t("how.title")}
          </h2>
          <p className="landing-lead mx-auto mt-4">{t("how.lead")}</p>
        </div>

        <ol className="landing-how-steps mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, step }) => (
            <li key={step} className="landing-how-step">
              <span className="landing-how-step-num">{step}</span>
              <span className="landing-how-step-icon" aria-hidden>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-base font-bold text-guiaa-brand-navy">
                {t(`how.steps.${step}.title`)}
              </h3>
              <p className="landing-body mt-2 text-sm leading-relaxed">
                {t(`how.steps.${step}.detail`)}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setView("register")}
            className="landing-btn-primary"
          >
            {t("how.ctaRegister")}
          </button>
          <button
            type="button"
            onClick={() => scrollToLandingProduct("species")}
            className="landing-btn-secondary"
          >
            {t("how.ctaExplore")}
          </button>
        </div>
      </div>
    </section>
  );
}
