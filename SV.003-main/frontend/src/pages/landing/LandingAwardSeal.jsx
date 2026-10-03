import React from "react";
import { useTranslation } from "react-i18next";
import "./landingAwardSeal.css";

/**
 * Banda destacada: nominación Startup World Cup 2026.
 */
export function LandingAwardSeal() {
  const { t } = useTranslation("landing");

  return (
    <aside className="landing-award-seal-section" aria-label={t("award.aria")}>
      <div className="landing-container">
        <div className="landing-award-seal-panel">
          <div className="landing-award-seal-glow" aria-hidden />
          <figure className="landing-award-seal">
            <div className="landing-award-seal-ring" aria-hidden />
            <img
              src="/landing/awards/nominado-startup-world-cup-2026.jpg"
              alt={t("award.caption")}
              width={320}
              height={320}
              loading="lazy"
              decoding="async"
              className="landing-award-seal-img"
            />
          </figure>

          <div className="landing-award-seal-copy">
            <p className="landing-award-seal-kicker">{t("award.tier")}</p>
            <p className="landing-award-seal-title">{t("award.title")}</p>
            <p className="landing-award-seal-event">{t("award.event")}</p>
            <p className="landing-award-seal-lead">{t("award.lead")}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default LandingAwardSeal;
