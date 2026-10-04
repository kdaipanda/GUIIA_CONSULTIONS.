import React from "react";
import { useTranslation } from "react-i18next";
import { LandingCountUp } from "./LandingCountUp";
import { useLandingInView } from "./useLandingInView";

const HERO_STATS = ["species", "record", "access"];

export function LandingHeroStats() {
  const { t } = useTranslation("landing");
  const { ref, inView } = useLandingInView({ threshold: 0.35, rootMargin: "0px 0px -8% 0px" });

  return (
    <div
      ref={ref}
      className={`landing-petpal-stats${inView ? " is-inview" : ""}`}
      role="region"
      aria-label={t("heroStats.aria")}
    >
      {HERO_STATS.map((id, index) => (
        <div
          key={id}
          className="landing-petpal-stat"
          style={{ "--stat-i": index }}
        >
          <div className="landing-petpal-stat-copy">
            <p className="landing-petpal-stat-value">
              <LandingCountUp value={t(`heroStats.items.${id}.value`)} active={inView} />
            </p>
            <p className="landing-petpal-stat-desc">{t(`heroStats.items.${id}.desc`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
