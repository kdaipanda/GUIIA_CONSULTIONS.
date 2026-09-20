import React, { memo, useState } from "react";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingVideoModal } from "./LandingVideoModal";
import { LandingHeroVideo } from "./LandingHeroVideo";

const MemoHeroVideo = memo(LandingHeroVideo);

const HERO_CAPABILITIES = [
  { id: "diagnostico", group: "primary" },
  { id: "expediente", group: "primary" },
  { id: "inventario", group: "primary" },
  { id: "ventas", group: "primary" },
  { id: "multiespecie", group: "secondary" },
  { id: "panel", group: "secondary" },
  { id: "integracion", group: "secondary" },
  { id: "onboarding", group: "secondary" },
];

function HeroVideoControls() {
  const { t } = useTranslation("landing");
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="landing-petpal-cta-play"
        onClick={() => requestAnimationFrame(() => setVideoOpen(true))}
      >
        <span className="landing-petpal-cta-play-icon" aria-hidden>
          <Play size={14} fill="currentColor" />
        </span>
        <span>{t("hero.playVideo")}</span>
      </button>
      <LandingVideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </>
  );
}

export function LandingHero({ setView }) {
  const { t } = useTranslation("landing");
  const featured = HERO_CAPABILITIES.slice(0, 4);
  const more = HERO_CAPABILITIES.slice(4);

  return (
    <section className="landing-petpal-hero" aria-labelledby="landing-hero-title">
      <div className="landing-container">
        <div className="landing-petpal-grid">
          <div className="landing-petpal-copy">
            <p className="landing-petpal-brand" translate="no">{t("hero.brand")}</p>
            <h1 id="landing-hero-title" className="landing-petpal-title">
              {t("hero.title")}
            </h1>
            <p className="landing-petpal-lead">{t("hero.lead")}</p>

            <div className="landing-petpal-cta-row">
              <button
                type="button"
                onClick={() => setView("register")}
                className="landing-petpal-cta-primary"
              >
                {t("hero.ctaRegister")}
              </button>
              <HeroVideoControls />
            </div>

            <p className="landing-petpal-cta-hint">{t("hero.ctaHint")}</p>
          </div>

          <div className="landing-petpal-visual">
            <div className="landing-hero-video-frame">
              <MemoHeroVideo />
            </div>
          </div>
        </div>

        <div className="landing-hero-capabilities" aria-labelledby="landing-hero-capabilities-title">
          <div className="landing-hero-capabilities-head">
            <h2 id="landing-hero-capabilities-title" className="landing-hero-capabilities-title">
              {t("hero.capabilitiesTitle")}
            </h2>
            <p className="landing-hero-capabilities-lead">{t("hero.capabilitiesLead")}</p>
          </div>

          <div className="landing-hero-cap-stack">
            {featured[0] ? (
              <div className="landing-hero-cap-block landing-hero-cap-block--lead">
                <p className="landing-hero-cap-mark">{t("features.uniqueBadge")}</p>
                <p className="landing-hero-capability-title">
                  {t(`features.${featured[0].group}.${featured[0].id}.title`)}
                </p>
                <p className="landing-hero-capability-desc">
                  {t(`features.${featured[0].group}.${featured[0].id}.description`)}
                </p>
              </div>
            ) : null}

            <div className="landing-hero-cap-secondary">
              {featured.slice(1).map(({ id, group }) => (
                <p key={id} className="landing-hero-capability-title">
                  {t(`features.${group}.${id}.title`)}
                </p>
              ))}
            </div>
          </div>

          <p className="landing-hero-cap-more">
            <span className="landing-hero-cap-more-label">{t("hero.capabilitiesMore")}: </span>
            {more.map(({ id, group }, index) => (
              <React.Fragment key={id}>
                {index > 0 ? <span className="landing-hero-cap-more-sep">, </span> : null}
                <span>{t(`features.${group}.${id}.title`)}</span>
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
