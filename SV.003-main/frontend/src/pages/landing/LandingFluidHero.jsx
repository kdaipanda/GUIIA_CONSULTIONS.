import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingNavbar } from "./LandingNavbar";
import {
  LANDING_HERO_VIDEO,
  LANDING_HERO_VIDEO_POSTER,
  resolveLandingHeroVideoSrc,
} from "./landingBrandAssets";
import "./landingFluidHero.css";

const HERO_CAPABILITIES = [
  { id: "diagnostico", group: "primary" },
  { id: "expediente", group: "primary" },
  { id: "inventario", group: "primary" },
  { id: "ventas", group: "primary" },
];

export function LandingHeroCapabilities() {
  const { t } = useTranslation("landing");
  const [lead, ...rest] = HERO_CAPABILITIES;

  return (
    <section
      className="landing-section landing-section-band landing-fluid-capabilities border-b border-guiaa-brand-navy/8"
      aria-labelledby="landing-hero-capabilities-title"
    >
      <div className="landing-container">
        <div className="landing-section-head">
          <h2
            id="landing-hero-capabilities-title"
            className="landing-section-title text-guiaa-brand-navy"
          >
            {t("hero.capabilitiesTitle")}
          </h2>
          <p className="landing-lead mt-4">{t("hero.capabilitiesLead")}</p>
        </div>

        <div className="landing-fluid-cap-panel mt-10">
          <div className="landing-fluid-cap-lead">
            <p className="landing-eyebrow">{t("features.uniqueBadge")}</p>
            <h3 className="landing-fluid-cap-title mt-3">
              {t(`features.${lead.group}.${lead.id}.title`)}
            </h3>
            <p className="landing-lead mt-3">
              {t(`features.${lead.group}.${lead.id}.description`)}
            </p>
          </div>

          <ul className="landing-fluid-cap-rail" aria-label={t("hero.capabilitiesTitle")}>
            {rest.map(({ id, group }) => (
              <li key={id} className="landing-fluid-cap-rail-item">
                <span className="landing-fluid-cap-rail-title">
                  {t(`features.${group}.${id}.title`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function LandingFluidHero({ setView }) {
  const { t } = useTranslation("landing");
  const [heroVideoSrc, setHeroVideoSrc] = useState(LANDING_HERO_VIDEO);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const update = () => {
      setHeroVideoSrc(resolveLandingHeroVideoSrc());
      setVideoFailed(false);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  const titleBefore = t("hero.titleBefore") || t("hero.title");
  const titleAfter = (t("hero.titleAfter") || "").trim();
  const announcementHref = useMemo(() => "#pricing", []);

  return (
    <div className="landing-fluid-hero-wrap">
      <section className="landing-guiaa-hero" aria-labelledby="landing-hero-title">
        <div className="landing-guiaa-hero-media" aria-hidden>
          {!videoFailed ? (
            <video
              key={heroVideoSrc}
              className="landing-fluid-hero-video landing-guiaa-hero-video"
              src={heroVideoSrc}
              poster={LANDING_HERO_VIDEO_POSTER}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setVideoFailed(true)}
            />
          ) : (
            <img
              src={LANDING_HERO_VIDEO_POSTER}
              alt=""
              className="landing-guiaa-hero-poster"
              loading="eager"
              decoding="async"
            />
          )}
          <div className="landing-fluid-hero-scrim landing-guiaa-hero-scrim" />
        </div>

        <div className="landing-guiaa-hero-glow" aria-hidden />
        <div className="landing-guiaa-hero-grid" aria-hidden />

        <LandingNavbar setView={setView} hero />

        <div className="landing-guiaa-hero-inner">
          <a href={announcementHref} className="landing-guiaa-hero-pill">
            <span className="landing-guiaa-hero-pill-text">{t("hero.announcement")}</span>
            <span className="landing-guiaa-hero-pill-cta">
              {t("hero.announcementCta")}
              <ArrowRight size={14} aria-hidden />
            </span>
          </a>

          <p className="landing-guiaa-hero-brand" translate="no">
            {t("hero.brand")}
          </p>

          <h1 id="landing-hero-title" className="landing-guiaa-hero-title">
            <span className="landing-guiaa-hero-title-line">{titleBefore}</span>
            {titleAfter ? (
              <span className="landing-guiaa-hero-title-line landing-guiaa-hero-title-accent">
                {titleAfter}
              </span>
            ) : null}
          </h1>

          <p className="landing-guiaa-hero-lead">{t("hero.lead")}</p>

          <div className="landing-guiaa-hero-cta-row">
            <button
              type="button"
              className="landing-guiaa-hero-cta-primary"
              onClick={() => setView("register")}
            >
              {t("hero.ctaRegister")}
            </button>
            <a href="#product" className="landing-guiaa-hero-cta-secondary">
              {t("how.ctaExplore")}
            </a>
          </div>

          <p className="landing-guiaa-hero-hint">{t("hero.ctaHint")}</p>
        </div>
      </section>
    </div>
  );
}
