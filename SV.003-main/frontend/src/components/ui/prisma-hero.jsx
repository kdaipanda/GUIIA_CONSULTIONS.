import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingNavbar } from "../../pages/landing/LandingNavbar";
import { LANDING_HERO_VIDEO_POSTER } from "../../pages/landing/landingBrandAssets";
import { cn } from "@/lib/utils";
import "./prisma-hero.css";

const EASE = [0.16, 1, 0.3, 1] as const;
const HERO_VIDEO = "/VG1-4k.mp4";

type WordsPullUpProps = {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
  asteriskClassName?: string;
};

/** Word-by-word pull-up reveal (21st.dev PrismaHero). */
export function WordsPullUp({
  text,
  className = "",
  showAsterisk = false,
  style,
  asteriskClassName = "text-[#39ff88]",
}: WordsPullUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const words = text.trim().split(/\s+/).filter(Boolean);

  return (
    <div ref={ref} className={cn("inline-flex flex-wrap", className)} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={`${word}-${i}`}
            initial={reduceMotion ? false : { y: 28, opacity: 0 }}
            animate={isInView || reduceMotion ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: reduceMotion ? 0 : i * 0.08, ease: EASE }}
            className="relative inline-block"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast ? (
              <span
                className={cn(
                  "absolute -right-[0.28em] top-[0.55em] text-[0.28em] leading-none",
                  asteriskClassName,
                )}
                aria-hidden
              >
                *
              </span>
            ) : null}
          </motion.span>
        );
      })}
    </div>
  );
}

type Segment = { text: string; className?: string };

type WordsPullUpMultiStyleProps = {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
};

export function WordsPullUpMultiStyle({
  segments,
  className = "",
  style,
}: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text
      .trim()
      .split(/\s+/)
      .forEach((w) => {
        if (w) words.push({ word: w, className: seg.className });
      });
  });

  return (
    <div
      ref={ref}
      className={cn("inline-flex flex-wrap", className)}
      style={style}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w.word}-${i}`}
          initial={reduceMotion ? false : { y: 22, opacity: 0 }}
          animate={isInView || reduceMotion ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.55, delay: reduceMotion ? 0 : i * 0.07, ease: EASE }}
          className={cn("inline-block", w.className)}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
}

type PrismaHeroProps = {
  setView?: (view: string) => void;
  className?: string;
  videoSrc?: string;
};

/**
 * Cinematic full-bleed hero (21st.dev PrismaHero), adapted for GUIAA.
 * Screen container loops /VG1-4k.mp4 muted; neon green + violet accents.
 */
export function PrismaHero({
  setView,
  className = "",
  videoSrc = HERO_VIDEO,
}: PrismaHeroProps) {
  const { t } = useTranslation("landing");
  const reduceMotion = useReducedMotion();
  const brand = t("hero.brand");
  const titleBefore = t("hero.titleBefore") || t("hero.title");
  const titleAfter = (t("hero.titleAfter") || "").trim();

  return (
    <section
      className={cn("prisma-hero h-[100svh] min-h-[36rem] w-full", className)}
      aria-labelledby="landing-hero-title"
    >
      <div className="prisma-hero__frame relative h-full w-full overflow-hidden rounded-2xl md:rounded-[2rem]">
        {/* Background video — loop + muted */}
        <div className="prisma-hero__screen absolute inset-0" aria-hidden>
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={videoSrc}
            poster={LANDING_HERO_VIDEO_POSTER}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        </div>

        {/* Neon / violet atmosphere */}
        <div className="prisma-hero__glow prisma-hero__glow--violet pointer-events-none absolute -left-1/4 top-0 h-[70%] w-[70%] opacity-50" />
        <div className="prisma-hero__glow prisma-hero__glow--neon pointer-events-none absolute -right-1/4 bottom-0 h-[65%] w-[65%] opacity-40" />

        {/* Noise + gradient overlays */}
        <div className="prisma-hero__noise pointer-events-none absolute inset-0 opacity-[0.55] mix-blend-overlay" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-[#0c2d4d]/25 to-black/75" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#070f18] via-[#070f18]/70 to-transparent" />

        <LandingNavbar setView={setView} hero />

        {/* Hero content */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 sm:px-6 sm:pb-7 md:px-10 md:pb-9">
          <div className="grid grid-cols-12 items-end gap-4 lg:gap-8">
            <div className="col-span-12 lg:col-span-7 xl:col-span-8">
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#39ff88]/90 sm:text-xs">
                {t("hero.kicker")}
              </p>
              <h1
                id="landing-hero-title"
                className="font-semibold leading-[0.86] tracking-[-0.06em] text-[22vw] text-[#f4f7fb] sm:text-[18vw] md:text-[14vw] lg:text-[11vw] xl:text-[9.5vw]"
              >
                <WordsPullUp
                  text={brand}
                  showAsterisk
                  asteriskClassName="text-[#39ff88] drop-shadow-[0_0_12px_rgba(57,255,136,0.65)]"
                />
              </h1>
              <div className="mt-3 max-w-xl text-balance text-lg font-medium leading-tight tracking-tight text-[#e8eef4] sm:mt-4 sm:text-2xl md:text-3xl">
                <WordsPullUpMultiStyle
                  segments={[
                    { text: titleBefore, className: "text-[#e8eef4]" },
                    {
                      text: titleAfter,
                      className:
                        "bg-gradient-to-r from-[#39ff88] to-[#c4b5fd] bg-clip-text text-transparent",
                    },
                  ]}
                />
              </div>
            </div>

            <div className="col-span-12 flex flex-col gap-4 pb-2 lg:col-span-5 xl:col-span-4 lg:pb-4">
              <motion.p
                initial={reduceMotion ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
                className="max-w-md text-sm leading-relaxed text-white/78 sm:text-base"
              >
                {t("hero.lead")}
              </motion.p>

              <motion.div
                initial={reduceMotion ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
                className="flex flex-wrap items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => setView?.("register")}
                  className="group inline-flex items-center gap-2 self-start rounded-full bg-[#39ff88] py-1 pl-5 pr-1 text-sm font-semibold text-[#062218] shadow-[0_0_28px_rgba(57,255,136,0.35)] transition-all hover:gap-3 hover:bg-[#5dff9c] sm:text-base"
                >
                  {t("hero.ctaRegister")}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0c2d4d] transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowRight className="h-4 w-4 text-[#39ff88]" aria-hidden />
                  </span>
                </button>
              </motion.div>

              <motion.p
                initial={reduceMotion ? false : { y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.8, ease: EASE }}
                className="text-xs text-white/55 sm:text-sm"
              >
                {t("hero.ctaHint")}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PrismaHero;
