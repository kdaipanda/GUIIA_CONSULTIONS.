import React, { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CONSULTATION_CATEGORY_LIST } from "../../lib/consultationCategories";
import { HoverRevealCard } from "./HoverRevealCards";
import { LANDING_IMAGES } from "./landingBrandAssets";
import { onLandingAnchorClick, productTabHref } from "./landingScroll";

const SPECIES_IMAGES = {
  perros: LANDING_IMAGES.pets.speciesPerros,
  gatos: LANDING_IMAGES.pets.speciesGatos,
  conejos: LANDING_IMAGES.pets.speciesConejos,
  aves: LANDING_IMAGES.pets.speciesAves,
  hamsters: LANDING_IMAGES.pets.speciesHamsters,
  cuyos: LANDING_IMAGES.pets.speciesCuyos,
  hurones: LANDING_IMAGES.pets.speciesHurones,
  erizos: LANDING_IMAGES.pets.speciesErizos,
  tortugas: LANDING_IMAGES.pets.speciesTortugas,
  iguanas: LANDING_IMAGES.pets.speciesIguanas,
  patos_pollos: LANDING_IMAGES.pets.speciesPatosPollos,
};

export function LandingSpeciesMarquee() {
  const { t } = useTranslation("landing");
  const speciesCount = CONSULTATION_CATEGORY_LIST.length;
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

  const items = useMemo(
    () =>
      CONSULTATION_CATEGORY_LIST.map(({ key }) => ({
        key,
        title: t(`speciesMarquee.categories.${key}`, { defaultValue: key }),
        subtitle: t("speciesMarquee.cardSubtitle"),
        imageUrl: SPECIES_IMAGES[key],
      })),
    [t],
  );

  const loopItems = reduceMotion ? items : [...items, ...items];

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
        <div className="landing-marquee-viewport landing-marquee-fade landing-species-cards-viewport relative">
          <div
            id="landing-species-marquee-track"
            role="list"
            className={`landing-marquee-track landing-species-cards-track${
              paused || reduceMotion ? " is-paused" : ""
            }${reduceMotion ? " is-static-grid" : ""}`}
            aria-label={t("speciesMarquee.aria")}
          >
            {loopItems.map((item, index) => (
              <HoverRevealCard
                key={`${item.key}-${index}`}
                title={item.title}
                subtitle={item.subtitle}
                imageUrl={item.imageUrl}
                decorative={!reduceMotion && index >= speciesCount}
                href={speciesHref}
                onClick={(event) =>
                  onLandingAnchorClick(event, { productTab: "species" })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
