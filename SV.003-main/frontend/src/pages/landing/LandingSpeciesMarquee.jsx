import React, { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CONSULTATION_CATEGORY_LIST } from "../../lib/consultationCategories";
import { onLandingAnchorClick, productTabHref } from "./landingScroll";

function SpeciesChip({ icon, name, href, onClick, decorative = false }) {
  const className = "landing-species-chip";

  const content = (
    <>
      <span className="landing-species-icon" aria-hidden>
        {icon}
      </span>
      <span className="landing-species-label">{name}</span>
    </>
  );

  if (decorative) {
    return (
      <span className={className} aria-hidden>
        {content}
      </span>
    );
  }

  return (
    <a href={href} onClick={onClick} className={className} aria-label={name}>
      {content}
    </a>
  );
}

export function LandingSpeciesMarquee() {
  const { t } = useTranslation("landing");
  const speciesCount = CONSULTATION_CATEGORY_LIST.length;
  const loopItems = [...CONSULTATION_CATEGORY_LIST, ...CONSULTATION_CATEGORY_LIST];
  const speciesHref = productTabHref("species");
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduceMotion(mq.matches);
      if (mq.matches) setPaused(true);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <section
      className="landing-section-band landing-species-section border-y border-guiaa-brand-navy/8 py-10"
      aria-labelledby="landing-species-heading"
    >
      <div className="landing-container mb-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
        <div className="max-w-xl">
          <p className="landing-eyebrow">{t("speciesMarquee.eyebrow")}</p>
          <h2
            id="landing-species-heading"
            className="landing-section-title mt-2 text-guiaa-brand-navy"
          >
            {t("speciesMarquee.heading", { count: speciesCount })}
          </h2>
        </div>
        {!reduceMotion && (
          <button
            type="button"
            className="landing-marquee-toggle inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-guiaa-brand-navy/80 transition hover:bg-guiaa-brand-navy/5 hover:text-guiaa-brand-navy"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
            aria-controls="landing-species-marquee-track"
          >
            {paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
            {paused ? t("speciesMarquee.play") : t("speciesMarquee.pause")}
          </button>
        )}
      </div>

      <div className="landing-species-panel landing-container">
        <div className="landing-marquee-viewport landing-marquee-fade relative">
          <div
            id="landing-species-marquee-track"
            className={`landing-marquee-track${paused || reduceMotion ? " is-paused" : ""}`}
            aria-label={t("speciesMarquee.aria")}
          >
            {(reduceMotion ? CONSULTATION_CATEGORY_LIST : loopItems).map(
              ({ key, icon }, index) => (
                <SpeciesChip
                  key={`${key}-${index}`}
                  icon={icon}
                  name={t(`speciesMarquee.categories.${key}`, { defaultValue: key })}
                  decorative={!reduceMotion && index >= speciesCount}
                  href={speciesHref}
                  onClick={(event) =>
                    onLandingAnchorClick(event, { productTab: "species" })
                  }
                />
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
