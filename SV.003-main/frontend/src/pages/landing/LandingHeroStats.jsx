import React from "react";
import { useTranslation } from "react-i18next";

const HERO_STATS = ["species", "record", "access"];

export function LandingHeroStats() {
  const { t } = useTranslation("landing");

  return (
    <div className="landing-petpal-stats" role="region" aria-label={t("heroStats.aria")}>
      {HERO_STATS.map((id) => (
        <div key={id} className="landing-petpal-stat">
          <div className="landing-petpal-stat-copy">
            <p className="landing-petpal-stat-value">{t(`heroStats.items.${id}.value`)}</p>
            <p className="landing-petpal-stat-desc">{t(`heroStats.items.${id}.desc`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
