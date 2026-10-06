import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LandingNavbar } from "./LandingNavbar";
import { LandingClinicalCursor } from "./LandingClinicalCursor";
import { LandingVetAnimations } from "./LandingVetAnimations";
import { LandingVideoModal } from "./LandingVideoModal";
import { WordsPullUp } from "./WordsPullUp";
import {
  LANDING_HERO_VIDEO_CINEMATIC,
  LANDING_HERO_VIDEO_POSTER,
  nextLandingHeroVideoSrc,
  resolveLandingHeroVideoSrc,
} from "./landingBrandAssets";
import "./landingFluidHero.css";
import "./landingVetAnimations.css";
import "./landingClinicalMotion.css";

const HERO_CAPABILITIES = [
  { id: "diagnostico", group: "primary" },
  { id: "expediente", group: "primary" },
  { id: "inventario", group: "primary" },
  { id: "ventas", group: "primary" },
];

export function LandingHeroCapabilities() {
  const { t } = useTranslation("landing");
  const [lead, ...rest] = HERO_CAPABILITIES;
  const panelRef = useRef(null);
  const leadRef = useRef(null);
  const [linkPath, setLinkPath] = useState("");
  const [hotId, setHotId] = useState(null);

  const drawLink = useCallback((itemEl) => {
    const panel = panelRef.current;
    const leadEl = leadRef.current;
    if (!panel || !leadEl || !itemEl) return;

    const p = panel.getBoundingClientRect();
    const a = leadEl.getBoundingClientRect();
    const b = itemEl.getBoundingClientRect();

    const x1 = a.right - p.left - 8;
    const y1 = a.top - p.top + a.height * 0.45;
    const x2 = b.left - p.left + 4;
    const y2 = b.top - p.top + b.height * 0.5;
    const cx = (x1 + x2) / 2;

    setLinkPath(`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`);
  }, []);

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

        <div
          ref={panelRef}
          className={`landing-fluid-cap-panel mt-10${hotId ? " is-linked" : ""}`}
        >
          <svg className="landing-fluid-cap-link" aria-hidden>
            <path d={linkPath} />
          </svg>

          <div className="landing-fluid-cap-lead" ref={leadRef}>
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
              <li
                key={id}
                className={`landing-fluid-cap-rail-item${hotId === id ? " is-hot" : ""}`}
                onPointerEnter={(e) => {
                  setHotId(id);
                  drawLink(e.currentTarget);
                }}
                onPointerLeave={() => setHotId(null)}
                onFocus={(e) => {
                  setHotId(id);
                  drawLink(e.currentTarget);
                }}
                onBlur={() => setHotId(null)}
              >
                <span className="landing-fluid-cap-rail-title" tabIndex={0}>
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
  const reduceMotion = useReducedMotion();
  const [heroVideoSrc, setHeroVideoSrc] = useState(LANDING_HERO_VIDEO_CINEMATIC);
  const [videoFailed, setVideoFailed] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const videoRef = useRef(null);
  const mediaRef = useRef(null);

  useEffect(() => {
    const update = () => {
      setHeroVideoSrc(resolveLandingHeroVideoSrc());
      setVideoFailed(false);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  /* Pausa el video fuera de viewport — evita decode GPU al scrollear */
  useEffect(() => {
    const media = mediaRef.current;
    const video = videoRef.current;
    if (!media || !video || videoFailed) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.12) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.12, 0.35] },
    );
    observer.observe(media);
    return () => observer.disconnect();
  }, [heroVideoSrc, videoFailed]);

  const brand = t("hero.brand");
  const titleLine = [t("hero.titleBefore"), (t("hero.titleAfter") || "").trim()]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="landing-fluid-hero-wrap">
      <section className="landing-guiaa-hero landing-guiaa-hero--prisma" aria-labelledby="landing-hero-title">
        <div className="landing-guiaa-hero-frame">
          <div className="landing-guiaa-hero-media" aria-hidden ref={mediaRef}>
            {!videoFailed ? (
              <video
                ref={videoRef}
                key={heroVideoSrc}
                className="landing-fluid-hero-video landing-guiaa-hero-video"
                src={heroVideoSrc}
                poster={LANDING_HERO_VIDEO_POSTER}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onError={() => {
                  const fallback = nextLandingHeroVideoSrc(heroVideoSrc);
                  if (fallback) {
                    setHeroVideoSrc(fallback);
                    return;
                  }
                  setVideoFailed(true);
                }}
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
            <LandingVetAnimations variant="hero" />
          </div>

          <LandingClinicalCursor enabled={!reduceMotion} />

          <LandingNavbar setView={setView} hero />

          <div className="landing-guiaa-hero-stage">
            <div className="landing-guiaa-hero-grid12">
              <div className="landing-guiaa-hero-brand-col">
                <h1 id="landing-hero-title" className="landing-guiaa-hero-mark">
                  <WordsPullUp text={brand} showPaw className="landing-guiaa-hero-mark-pull" />
                </h1>
                <div className="landing-guiaa-hero-brandline">
                  <p className="landing-guiaa-hero-brandline-primary">
                    {t("brand.taglinePrimary")}
                  </p>
                  <p className="landing-guiaa-hero-brandline-secondary">
                    {t("brand.taglineSecondary")}
                  </p>
                </div>
                <p className="landing-guiaa-hero-submark sr-only">{titleLine}</p>
              </div>

              <div className="landing-guiaa-hero-copy-col">
                <motion.p
                  className="landing-guiaa-hero-kicker"
                  initial={reduceMotion ? false : { y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  {t("hero.kicker")}
                </motion.p>

                <motion.p
                  className="landing-guiaa-hero-lead"
                  initial={reduceMotion ? false : { y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.75, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {t("hero.lead")}
                </motion.p>

                <motion.div
                  className="landing-guiaa-hero-cta-row"
                  initial={reduceMotion ? false : { y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.75, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    className="landing-guiaa-hero-cta-lab"
                    onClick={() => setView("register")}
                  >
                    <span>{t("hero.ctaRegister")}</span>
                    <span className="landing-guiaa-hero-cta-lab-icon" aria-hidden>
                      <ArrowRight size={16} />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="landing-guiaa-hero-cta-play"
                    onClick={() =>
                      requestAnimationFrame(() => setPresentationOpen(true))
                    }
                  >
                    <span className="landing-guiaa-hero-cta-play-icon" aria-hidden>
                      <Play size={14} fill="currentColor" />
                    </span>
                    <span>{t("hero.playVideo")}</span>
                  </button>
                </motion.div>

                <motion.p
                  className="landing-guiaa-hero-hint"
                  initial={reduceMotion ? false : { y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  {t("hero.ctaHint")}
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <LandingVideoModal
        open={presentationOpen}
        onClose={() => setPresentationOpen(false)}
      />
    </div>
  );
}
