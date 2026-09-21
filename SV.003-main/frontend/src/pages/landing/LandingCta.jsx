import React from "react";
import { useTranslation } from "react-i18next";
import { onLandingAnchorClick } from "./landingScroll";

export function LandingCta({ setView }) {
  const { t } = useTranslation("landing");
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="landing-cta-panel landing-cta-panel-v2 relative overflow-hidden">
          <div>
            <h2 className="landing-section-title">{t("cta.title")}</h2>
            <p className="landing-lead mt-4 max-w-lg">{t("cta.lead")}</p>
            <a
              href="#faq"
              onClick={(event) => onLandingAnchorClick(event)}
              className="landing-cta-faq-link mt-5 inline-flex min-h-11 items-center text-sm font-medium text-white transition hover:text-white"
            >
              {t("cta.faqLink")}
            </a>
          </div>

          <div className="landing-cta-actions">
            <button
              type="button"
              onClick={() => setView("register")}
              className="landing-cta-primary-btn inline-flex min-h-11 items-center justify-center landing-btn-primary"
            >
              {t("cta.createAccount")}
            </button>
            <button
              type="button"
              onClick={() => setView("login")}
              className="landing-cta-secondary-btn landing-btn-on-dark min-h-11"
            >
              {t("cta.haveAccount")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
