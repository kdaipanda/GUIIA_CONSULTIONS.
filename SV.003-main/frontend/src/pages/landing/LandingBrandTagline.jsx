import React from "react";
import { LANDING_IMAGES } from "./landingBrandAssets";
import { useTranslation } from "react-i18next";
import "./landingBrandTagline.css";

export function LandingBrandTagline({ variant = "band", className = "" }) {
  const { t } = useTranslation("landing");
  const primary = t("brand.taglinePrimary");
  const secondary = t("brand.taglineSecondary");

  if (variant === "footer") {
    return (
      <p className={`landing-brand-tagline landing-brand-tagline--footer ${className}`.trim()}>
        <span className="landing-brand-tagline-primary">{primary}</span>
        <span className="landing-brand-tagline-secondary">{secondary}</span>
      </p>
    );
  }

  if (variant === "strip") {
    return (
      <div className={`landing-brand-tagline-strip ${className}`.trim()}>
        <div className="landing-container">
          <p className="landing-brand-tagline landing-brand-tagline--strip">
            <span className="landing-brand-tagline-primary">{primary}</span>
            <span className="landing-brand-tagline-secondary">{secondary}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className={`landing-brand-band ${className}`.trim()} aria-labelledby="landing-brand-band-title">
      <div className="landing-container landing-brand-band-inner">
        <div className="landing-brand-band-mascot-wrap" aria-hidden>
          <img
            src={LANDING_IMAGES.mascotFlyingCutout}
            alt=""
            className="landing-brand-band-mascot"
            width={140}
            height={110}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="landing-brand-band-copy">
          <h2 id="landing-brand-band-title" className="landing-brand-band-title landing-brand-tagline-primary">
            {primary}
          </h2>
          <p className="landing-brand-band-lead landing-brand-tagline-secondary">{secondary}</p>
        </div>
      </div>
    </section>
  );
}
