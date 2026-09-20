import React from "react";
import { useTranslation } from "react-i18next";
import { onLandingAnchorClick, productTabHref } from "./landingScroll";

const STEPS = ["01", "02", "03"];

export function LandingHowItWorks({ setView }) {
  const { t } = useTranslation("landing");

  return (
    <section
      id="como-funciona"
      className="landing-section landing-section-band border-y border-guiaa-brand-navy/8"
      aria-labelledby="landing-how-heading"
    >
      <div className="landing-container">
        <div className="landing-how-layout">
          <div className="landing-how-intro">
            <p className="landing-eyebrow">{t("how.eyebrow")}</p>
            <h2
              id="landing-how-heading"
              className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl"
            >
              {t("how.title")}
            </h2>
            <p className="landing-lead mt-4">{t("how.lead")}</p>

            <div className="landing-how-actions mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setView("register")}
                className="landing-btn-primary"
              >
                {t("how.ctaRegister")}
              </button>
              <a
                href={productTabHref("species")}
                onClick={(event) => onLandingAnchorClick(event, { productTab: "species" })}
                className="landing-btn-secondary inline-flex items-center justify-center"
              >
                {t("how.ctaExplore")}
              </a>
            </div>
          </div>

          <ol className="landing-how-rail">
            {STEPS.map((step, index) => (
              <li key={step} className="landing-how-rail-item">
                <span className="landing-how-rail-num">{step}</span>
                {index < STEPS.length - 1 ? (
                  <span className="landing-how-rail-line" aria-hidden />
                ) : null}
                <div className="landing-how-rail-copy">
                  <h3 className="landing-how-rail-title">{t(`how.steps.${step}.title`)}</h3>
                  <p className="landing-how-rail-detail">{t(`how.steps.${step}.detail`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
