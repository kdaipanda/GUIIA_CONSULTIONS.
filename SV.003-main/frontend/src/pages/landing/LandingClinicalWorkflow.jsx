import React from "react";
import {
  ClipboardPlus,
  FileSearch,
  HeartPulse,
  Microscope,
  PawPrint,
  Pill,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { scrollToLandingProduct } from "./landingScroll";

const CLINICAL_STEPS = [
  { icon: PawPrint, step: "01" },
  { icon: ClipboardPlus, step: "02" },
  { icon: HeartPulse, step: "03" },
  { icon: Microscope, step: "04" },
  { icon: Pill, step: "05" },
  { icon: FileSearch, step: "06" },
];

export function LandingClinicalWorkflow() {
  const { t } = useTranslation("landing");

  return (
    <section className="landing-section landing-section-first landing-clinical-workflow-section border-b border-guiaa-brand-navy/8">
      <div className="landing-container">
        <div className="landing-section-head-wide items-start sm:items-end">
          <div className="landing-section-head">
            <p className="landing-eyebrow">{t("workflow.eyebrow")}</p>
            <h2 className="landing-section-title mt-3 text-2xl text-guiaa-brand-navy sm:text-3xl">
              {t("workflow.title")}
            </h2>
            <p className="landing-lead mt-4">{t("workflow.lead")}</p>
          </div>
          <button
            type="button"
            onClick={() => scrollToLandingProduct("consultation")}
            className="landing-btn-secondary shrink-0"
          >
            {t("workflow.ctaLive")}
          </button>
        </div>

        <div className="landing-clinical-flow mt-10 sm:mt-12">
          {CLINICAL_STEPS.map(({ icon: Icon, step }) => (
            <article key={step} className="landing-clinical-step">
              <span className="landing-clinical-step-num">{step}</span>
              <span className="landing-clinical-step-icon" aria-hidden>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <h3 className="landing-clinical-step-title mt-3 text-sm font-bold">
                {t(`workflow.steps.${step}.title`)}
              </h3>
              <p className="landing-clinical-step-detail landing-body mt-1.5 text-xs leading-relaxed">
                {t(`workflow.steps.${step}.detail`)}
              </p>
            </article>
          ))}
        </div>

        <p className="landing-clinical-workflow-foot landing-body mt-8 text-center text-xs sm:text-sm">
          {t("workflow.foot")}
        </p>
      </div>
    </section>
  );
}
