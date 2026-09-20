import React from "react";
import { useTranslation } from "react-i18next";
import { onLandingAnchorClick, productTabHref } from "./landingScroll";

const CLINICAL_STEPS = ["01", "02", "03", "04", "05", "06"];

export function LandingClinicalWorkflow() {
  const { t } = useTranslation("landing");

  return (
    <section
      className="landing-section landing-section-first landing-clinical-workflow-section border-b border-guiaa-brand-navy/8"
      aria-labelledby="landing-workflow-heading"
    >
      <div className="landing-container">
        <div className="landing-clinical-layout">
          <div className="landing-clinical-intro">
            <p className="landing-eyebrow">{t("workflow.eyebrow")}</p>
            <h2
              id="landing-workflow-heading"
              className="landing-section-title mt-3 text-2xl text-guiaa-brand-navy sm:text-3xl"
            >
              {t("workflow.title")}
            </h2>
            <p className="landing-lead mt-4">{t("workflow.lead")}</p>
            <a
              href={productTabHref("consultation")}
              onClick={(event) => onLandingAnchorClick(event, { productTab: "consultation" })}
              className="landing-btn-secondary mt-8 inline-flex shrink-0 items-center justify-center"
            >
              {t("workflow.ctaLive")}
            </a>
          </div>

          <ol className="landing-clinical-rail">
            {CLINICAL_STEPS.map((step, index) => (
              <li key={step} className="landing-clinical-rail-item">
                <span className="landing-clinical-rail-num" aria-hidden>
                  {step}
                </span>
                {index < CLINICAL_STEPS.length - 1 ? (
                  <span className="landing-clinical-rail-line" aria-hidden />
                ) : null}
                <div className="landing-clinical-rail-copy">
                  <h3 className="landing-clinical-rail-title">
                    {t(`workflow.steps.${step}.title`)}
                  </h3>
                  <p className="landing-clinical-rail-detail">
                    {t(`workflow.steps.${step}.detail`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="landing-clinical-workflow-foot landing-body mt-8 text-xs sm:text-sm">
          {t("workflow.foot")}
        </p>
      </div>
    </section>
  );
}
