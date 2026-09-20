import React from "react";
import { LANDING_IMAGES } from "./landingBrandAssets";
import { useTranslation } from "react-i18next";

export function LandingBrandBand() {
  const { t } = useTranslation("landing");

  return (
    <section className="landing-brand-band" aria-labelledby="landing-brand-band-title">
      <div className="landing-container landing-brand-band-inner">
        <div className="landing-brand-band-mascot-wrap" aria-hidden>
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
        <div className="landing-brand-band-copy">
          <h2 id="landing-brand-band-title" className="landing-brand-band-title">
            {t("brandBand.title")}
          </h2>
          <p className="landing-brand-band-lead">{t("brandBand.lead")}</p>
        </div>
      </div>
    </section>
  );
}
