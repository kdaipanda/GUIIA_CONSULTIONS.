import React from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { scrollToLandingSection } from "./landingScroll";

export function LandingCta({ setView }) {
  const { t } = useTranslation("landing");
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="landing-cta-panel landing-cta-panel-v2 relative overflow-hidden">
          <div>
            <p className="landing-eyebrow">{t("cta.eyebrow")}</p>
            <h2 className="landing-section-title mt-3 text-3xl sm:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="landing-lead mt-4 max-w-lg">
              {t("cta.lead")}
            </p>
            <button
              type="button"
              onClick={() => scrollToLandingSection("#faq")}
              className="landing-cta-faq-link mt-5 inline-flex min-h-11 items-center text-sm font-medium text-white transition hover:text-white"
            >
              {t("cta.faqLink")}
            </button>
          </div>

          <div className="landing-cta-actions">
            <button
              type="button"
              onClick={() => setView("register")}
              className="landing-cta-primary-btn inline-flex min-h-11 items-center justify-center gap-2 landing-btn-primary"
            >
              {t("cta.createAccount")}
              <ArrowRight size={16} aria-hidden />
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
