import React from "react";
import { useTranslation } from "react-i18next";
import { onLandingAnchorClick, productTabHref } from "./landingScroll";

const CLINICAL_STEPS = ["01", "02", "03", "04", "05", "06"];

/** Banda densa: sin cabezal gemelo de How (rompe ritmo plantilla). */
export function LandingClinicalWorkflow() {
  const { t } = useTranslation("landing");

  return (
    <section
      className="landing-clinical-band border-b border-guiaa-brand-navy/8"
      aria-labelledby="landing-workflow-heading"
    >
      <div className="landing-container">
        <div className="landing-clinical-band-head">
          <h2 id="landing-workflow-heading" className="landing-clinical-band-title">
            {t("workflow.title")}
          </h2>
          <a
            href={productTabHref("consultation")}
            onClick={(event) => onLandingAnchorClick(event, { productTab: "consultation" })}
            className="landing-clinical-band-link"
          >
            {t("workflow.ctaLive")}
          </a>
        </div>

        <ol className="landing-clinical-band-grid">
          {CLINICAL_STEPS.map((step) => (
            <li key={step} className="landing-clinical-band-item">
              <span className="landing-clinical-band-num" aria-hidden>
                {step}
              </span>
              <p className="landing-clinical-band-label">
                {t(`workflow.steps.${step}.title`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
