import React from "react";
import { LANDING_IMAGES } from "./landingBrandAssets";
import { useTranslation } from "react-i18next";

export function LandingBrandBand() {
  const { t } = useTranslation("landing");

  return (
    <section className="landing-brand-band" aria-label={t("brandBand.aria")}>
      <div className="landing-container landing-brand-band-inner">
        <div className="landing-brand-band-mascot-wrap" aria-hidden>
          <span className="landing-brand-band-spark landing-brand-band-spark--1" />
          <span className="landing-brand-band-spark landing-brand-band-spark--2" />
          <span className="landing-brand-band-spark landing-brand-band-spark--3" />
          <img
            src={LANDING_IMAGES.mascotFlyingCutout}
            alt=""
            className="landing-brand-band-mascot"
            width={160}
            height={120}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div>
          <strong>{t("brandBand.title")}</strong>
          <span>{t("brandBand.lead")}</span>
        </div>
      </div>
    </section>
  );
}
