import React from "react";
import { useTranslation } from "react-i18next";

const ITEMS = ["diagnosis", "trial", "license"];

export function LandingTrustStrip() {
  const { t } = useTranslation("landing");

  return (
    <section className="landing-trust-strip" aria-label={t("trust.aria")}>
      <div className="landing-container">
        <ul className="landing-trust-strip-inner">
          {ITEMS.map((key) => (
            <li key={key} className="landing-trust-strip-item">
              <div>
                <p className="text-sm font-semibold text-guiaa-brand-navy">
                  {t(`trust.items.${key}.text`)}
                </p>
                <p className="text-[11px] text-guiaa-brand-ink-muted mt-0.5">
                  {t(`trust.items.${key}.sub`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
