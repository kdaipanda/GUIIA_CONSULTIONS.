import React from "react";
import { ClipboardList, PawPrint, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

const HERO_STATS = [
  { id: "species", icon: PawPrint },
  { id: "record", icon: ClipboardList },
  { id: "access", icon: ShieldCheck },
];

export function LandingHeroStats() {
  const { t } = useTranslation("landing");

  return (
    <div className="landing-petpal-stats" role="region" aria-label={t("heroStats.aria")}>
      {HERO_STATS.map(({ id, icon: Icon }) => (
        <div key={id} className="landing-petpal-stat">
          <span className="landing-petpal-stat-icon">
            <Icon size={18} aria-hidden />
          </span>
          <div className="landing-petpal-stat-copy">
            <p className="landing-petpal-stat-value">{t(`heroStats.items.${id}.value`)}</p>
            <p className="landing-petpal-stat-desc">{t(`heroStats.items.${id}.desc`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
