import React, { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAppScrollY, onAppScroll } from "@/lib/appScrollRoot";

export function StarLogo({
  className = "",
  style = {},
  fill = "currentColor",
  size = 48,
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      width={size}
      height={size}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polygon points="12,1.75 15.22,8.27 22.42,9.32 17.21,14.4 18.44,21.57 12,18.18 5.56,21.57 6.79,14.4 1.58,9.32 8.78,8.27" />
    </svg>
  );
}

export function BrandWordmark({
  brandName = "GUIAA",
  accentColor = "#265b93",
  isScrolled = false,
}) {
  return (
    <div className="flex select-none items-center group">
      <div
        className={cn(
          "flex items-baseline text-lg font-semibold tracking-tight transition-colors duration-300 sm:text-xl",
          isScrolled ? "text-[#0c2d4d]" : "text-white",
        )}
      >
        <span className="inline-flex items-center gap-2">
          <StarLogo
            fill={isScrolled ? accentColor : "#ffffff"}
            size={22}
            className="shrink-0"
          />
          <span translate="no">{brandName}</span>
        </span>
      </div>
    </div>
  );
}

function IntroOverlay({ brandName, accentColor, onComplete }) {
  const [stage, setStage] = useState(1);
  const [unmounted, setUnmounted] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(2), 100);
    const t2 = setTimeout(() => setStage(3), 1200);
    const t3 = setTimeout(() => {
      setStage(4);
      onCompleteRef.current?.();
      window.dispatchEvent(new CustomEvent("intro-animation-complete"));
    }, 2400);
    const t4 = setTimeout(() => {
      setStage(5);
      setUnmounted(true);
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (unmounted) return null;

  const isAnimating = stage >= 2;
  const isRevealed = stage >= 3;
  const isFading = stage >= 4;
  const letters = brandName.split("");

  return (
    <div
      className={cn(
        "fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-white px-4 select-none transition-all duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
        isFading
          ? "pointer-events-none invisible scale-[1.02] opacity-0"
          : "pointer-events-auto scale-100 opacity-100",
      )}
      aria-hidden={isFading}
    >
      <div
        className={cn(
          "relative flex h-12 max-w-full items-center justify-center transition-all duration-[1050ms] ease-[cubic-bezier(0.65,0,0.35,1)] will-change-transform sm:h-16 md:h-20",
          isRevealed ? "translate-x-0" : "translate-x-10 sm:translate-x-16 md:translate-x-20",
          isFading &&
            "-translate-y-[20vh] opacity-0 duration-[1100ms] sm:-translate-y-[28vh]",
        )}
      >
        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center sm:h-12 sm:w-12 md:h-14 md:w-14">
          <div
            className={cn(
              "flex h-full w-full items-center justify-center will-change-transform",
              isAnimating ? "fluid-star-intro" : "scale-[0.12] opacity-0",
            )}
          >
            <StarLogo fill={accentColor} size="100%" />
          </div>
        </div>

        <div className="ml-2.5 flex h-12 items-center overflow-hidden sm:ml-4 sm:h-16 md:h-20">
          {letters.map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="inline-block h-10 overflow-hidden align-middle leading-[2.5rem] sm:h-14 sm:leading-[3.5rem] md:h-16 md:leading-[4rem]"
            >
              <span
                className={cn(
                  "inline-block text-[clamp(1.75rem,5.5vw,3.25rem)] font-medium tracking-[-0.03em] text-[#0c2d4d] transition-transform duration-[850ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
                  isRevealed ? "translate-y-0" : "translate-y-[135%]",
                )}
                style={{ transitionDelay: `${120 + index * 60}ms` }}
                translate="no"
              >
                {char}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingNavbar({
  brandName,
  brandLogo,
  navLinks,
  ctaText,
  onCtaClick,
  secondaryCtaText,
  onSecondaryCtaClick,
  languageSwitcher,
  visible,
  accentColor,
}) {
  const [activeItem, setActiveItem] = useState(navLinks[0]?.name || "");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(getAppScrollY() > 40);
    handleScroll();
    return onAppScroll(handleScroll, { passive: true });
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleSelect = (name) => {
    setActiveItem(name);
    setMobileMenuOpen(false);
  };

  const linkTone = (isActive) => {
    if (scrolled && !mobileMenuOpen) {
      return isActive
        ? "text-[#0c2d4d] font-semibold"
        : "text-[#0c2d4d]/70 hover:text-[#0c2d4d]";
    }
    return isActive
      ? "text-white font-semibold"
      : "text-white/80 hover:text-white";
  };

  return (
    <>
      <header
        className={cn(
          "fixed left-0 top-0 z-[1002] flex w-full items-center justify-between px-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-8 xl:px-12",
          visible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-6 opacity-0",
          mobileMenuOpen
            ? "border-b border-white/10 bg-[#071622]/96 py-4 backdrop-blur-md sm:py-5"
            : scrolled
              ? "border-b border-black/[0.08] bg-white/95 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md sm:py-3.5"
              : "border-b border-transparent bg-transparent py-4 sm:py-5",
        )}
      >
        <button
          type="button"
          className="flex items-center gap-2 outline-none select-none"
          aria-label={`${brandName} Home`}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setActiveItem(navLinks[0]?.name || "");
          }}
        >
          {typeof brandLogo === "function"
            ? brandLogo({
                scrolled: mobileMenuOpen ? false : scrolled,
                mobileMenuOpen,
              })
            : brandLogo || (
                <BrandWordmark
                  brandName={brandName}
                  accentColor={accentColor}
                  isScrolled={mobileMenuOpen ? false : scrolled}
                />
              )}
        </button>

        <nav className="ml-auto mr-5 hidden list-none items-center gap-5 p-0 m-0 lg:flex xl:mr-8 xl:gap-8">
          {navLinks.map((link) => {
            const isActive = activeItem === link.name;
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={() => handleSelect(link.name)}
                className={cn(
                  "inline-block py-1 text-xs font-medium tracking-wide transition-all duration-300 xl:text-sm",
                  linkTone(isActive),
                )}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {typeof languageSwitcher === "function"
            ? languageSwitcher({
                scrolled: mobileMenuOpen ? false : scrolled,
                mobileMenuOpen,
              })
            : languageSwitcher}
          {secondaryCtaText && (
            <button
              type="button"
              onClick={onSecondaryCtaClick}
              className={cn(
                "rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 xl:px-5 xl:py-2.5 xl:text-xs",
                scrolled
                  ? "text-[#0c2d4d] hover:bg-[#0c2d4d]/5"
                  : "text-white/90 hover:bg-white/10",
              )}
            >
              {secondaryCtaText}
            </button>
          )}
          <button
            type="button"
            onClick={onCtaClick}
            className={cn(
              "rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider shadow-sm transition-all duration-300 hover:scale-105 hover:shadow active:scale-95 xl:px-5 xl:py-2.5 xl:text-xs",
              scrolled
                ? "bg-[#0c2d4d] text-white hover:bg-[#163a5c]"
                : "bg-white/90 text-[#0c2d4d] backdrop-blur-md hover:bg-white",
            )}
          >
            {ctaText}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn(
            "z-[1002] rounded-lg p-2 transition-colors lg:hidden",
            mobileMenuOpen
              ? "text-white hover:bg-white/10"
              : scrolled
                ? "text-[#0c2d4d] hover:bg-black/5"
                : "text-white hover:bg-white/10",
          )}
          aria-label={mobileMenuOpen ? "Cerrar menÃº" : "Abrir menÃº"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[1001] flex flex-col bg-[#071622]/96 backdrop-blur-2xl transition-all duration-500 lg:hidden",
          "pt-[max(4.75rem,calc(env(safe-area-inset-top)+3.75rem))] pb-[max(1.25rem,env(safe-area-inset-bottom))] px-[max(1.25rem,env(safe-area-inset-right))] pl-[max(1.25rem,env(safe-area-inset-left))]",
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <ul className="flex w-full max-w-sm list-none flex-col gap-1 self-center p-0 m-0 pt-2 text-center sm:gap-2">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={() => handleSelect(link.name)}
                  className={cn(
                    "block rounded-xl py-3 text-xl font-light tracking-tight transition-colors duration-200 sm:text-2xl",
                    activeItem === link.name
                      ? "font-medium text-white"
                      : "text-white/75 hover:text-white",
                  )}
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex w-full max-w-sm flex-col gap-3 self-center pb-2 pt-8">
            <div className="flex justify-center">
              {typeof languageSwitcher === "function"
                ? languageSwitcher({ scrolled: false, mobileMenuOpen: true })
                : languageSwitcher}
            </div>
            {secondaryCtaText && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSecondaryCtaClick?.();
                }}
                className="w-full rounded-full border border-white/25 py-3.5 text-xs font-semibold uppercase tracking-wider text-white"
              >
                {secondaryCtaText}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onCtaClick?.();
              }}
              className="w-full rounded-full bg-white py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#0c2d4d] shadow-xl transition-transform active:scale-95 sm:text-sm"
            >
              {ctaText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function HeroBannerSection({
  stage,
  videoSrc,
  heroImage,
  headlineFirst,
  headlineSecond,
  headlineKicker,
  heroCtaPrimary,
  onHeroCtaPrimary,
  heroCtaSecondaryHref,
  heroCtaSecondary,
  heroHint,
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [activeSrc, setActiveSrc] = useState(videoSrc);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  const toggleAudio = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) videoRef.current.play().catch(() => {});
  };

  useEffect(() => {
    setActiveSrc(videoSrc);
    setVideoError(false);
  }, [videoSrc]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    el.load();
    el.play().catch(() => {});
    return undefined;
  }, [stage, activeSrc]);

  const handleVideoError = () => {
    // Si falla la variante 4K, degrada a VG1 antes del poster.
    if (activeSrc && activeSrc.includes("VG1-4k")) {
      setActiveSrc("/VG1.mp4");
      return;
    }
    setVideoError(true);
  };

  const frameClass =
    stage === "animating"
      ? "fluid-hero-animating"
      : stage === "done"
        ? "translate-y-0 scale-100 opacity-100"
        : "translate-y-[105vh] scale-[0.78] opacity-0";

  const shouldRenderVideo = Boolean(activeSrc && !videoError);

  return (
    <section className="relative flex h-[100dvh] min-h-[500px] w-full items-center justify-center overflow-hidden bg-white">
      <div
        className={cn(
          "relative h-full w-full origin-center overflow-hidden will-change-transform",
          frameClass,
        )}
      >
        <div
          className={cn(
            "absolute inset-0 h-full w-full overflow-hidden will-change-transform",
            stage === "animating" ? "fluid-media-counter-scale" : "scale-100",
          )}
        >
          {shouldRenderVideo ? (
            <video
              key={activeSrc}
              ref={videoRef}
              src={activeSrc}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="auto"
              onError={handleVideoError}
              className="landing-fluid-hero-video h-full w-full object-cover object-center"
            />
          ) : (
            <img
              src={heroImage}
              alt=""
              className="h-full w-full select-none object-cover object-center"
              loading="eager"
            />
          )}
          <div className="landing-fluid-hero-scrim pointer-events-none absolute inset-0 z-[2]" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-[3] mx-auto flex max-w-5xl flex-col items-center justify-center px-4 text-center sm:px-6 md:px-8 lg:max-w-7xl lg:px-12">
          {headlineKicker && (
            <div className="mb-2 overflow-hidden sm:mb-3">
              <span
                className={cn(
                  "inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85 transition-transform duration-700 ease-out will-change-transform sm:text-xs sm:tracking-[0.25em]",
                  stage !== "idle" ? "translate-y-0" : "translate-y-full",
                )}
                style={{ transitionDelay: "0.4s" }}
              >
                {headlineKicker}
              </span>
            </div>
          )}

          <div className="block max-w-full overflow-hidden">
            <h1
              className={cn(
                "m-0 max-w-[92vw] break-words text-[clamp(1.65rem,4.2vw,4.5rem)] font-normal leading-[1.15] tracking-[-0.03em] text-white transition-transform duration-[1050ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform sm:max-w-4xl sm:leading-[1.08] lg:max-w-none lg:break-normal lg:whitespace-nowrap lg:text-[clamp(2.25rem,3.6vw,4.25rem)]",
                stage !== "idle" ? "translate-y-0" : "translate-y-[120%]",
              )}
              style={{ transitionDelay: "0.55s" }}
            >
              {headlineFirst}
            </h1>
          </div>

          <div className="mt-1 block max-w-full overflow-hidden sm:mt-1.5">
            <p
              className={cn(
                "m-0 max-w-[92vw] break-words text-[clamp(1.65rem,4.2vw,4.5rem)] font-normal leading-[1.15] tracking-[-0.03em] text-white/95 transition-transform duration-[1050ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform sm:max-w-4xl sm:leading-[1.08] lg:max-w-none lg:break-normal lg:whitespace-nowrap lg:text-[clamp(2.25rem,3.6vw,4.25rem)]",
                stage !== "idle" ? "translate-y-0" : "translate-y-[120%]",
              )}
              style={{ transitionDelay: "0.72s" }}
            >
              {headlineSecond}
            </p>
          </div>

          {(heroCtaPrimary || heroCtaSecondary) && (
            <div
              className={cn(
                "pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3 transition-all duration-700",
                stage !== "idle"
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0",
              )}
              style={{ transitionDelay: "0.95s" }}
            >
              {heroCtaPrimary && (
                <button
                  type="button"
                  onClick={onHeroCtaPrimary}
                  className="rounded-full bg-[#3d9b8f] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#348a7f] active:scale-95"
                >
                  {heroCtaPrimary}
                </button>
              )}
              {heroCtaSecondary && (
                <a
                  href={heroCtaSecondaryHref || "#product"}
                  className="rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  {heroCtaSecondary}
                </a>
              )}
            </div>
          )}
          {heroHint && (
            <p
              className={cn(
                "mt-4 max-w-md text-xs text-white/70 transition-opacity duration-700 sm:text-sm",
                stage !== "idle" ? "opacity-100" : "opacity-0",
              )}
              style={{ transitionDelay: "1.05s" }}
            >
              {heroHint}
            </p>
          )}
        </div>

        {shouldRenderVideo && (
          <button
            type="button"
            onClick={toggleAudio}
            className={cn(
              "absolute bottom-4 right-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-lg outline-none backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/70 active:scale-95 sm:bottom-8 sm:right-8 sm:h-11 sm:w-11",
              stage !== "idle"
                ? "pointer-events-auto scale-100 opacity-100"
                : "pointer-events-none scale-75 opacity-0",
            )}
            aria-label={isMuted ? "Activar audio" : "Silenciar audio"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
      </div>
    </section>
  );
}

export function FluidHeroNavbar({
  brandName = "GUIAA",
  brandLogo,
  videoSrc,
  heroImage = "/brand/doctor-plumitas-hub.png",
  headlineFirst = "Documenta la consulta",
  headlineSecond = "sin perder el hilo clÃ­nico.",
  headlineKicker = "",
  ctaText = "Registrarse",
  onCtaClick,
  secondaryCtaText,
  onSecondaryCtaClick,
  languageSwitcher,
  navLinks = [
    { name: "Producto", href: "#product" },
    { name: "Servicios", href: "#features" },
    { name: "Precios", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ],
  heroCtaPrimary,
  onHeroCtaPrimary,
  heroCtaSecondary,
  heroCtaSecondaryHref = "#product",
  heroHint,
  showIntroAnimation = true,
  showNavbar = true,
  accentColor = "#265b93",
  className = "",
  onIntroComplete,
  onHeroComplete,
}) {
  const [stage, setStage] = useState(showIntroAnimation ? "idle" : "done");
  const [navbarVisible, setNavbarVisible] = useState(!showIntroAnimation);

  const startHeroAnimation = useCallback(() => {
    setStage("animating");
    setTimeout(() => {
      setStage("done");
      setNavbarVisible(true);
      onHeroComplete?.();
      window.dispatchEvent(new CustomEvent("hero-animation-complete"));
      try {
        sessionStorage.setItem("guiaa-fluid-intro-seen", "1");
      } catch {
        /* ignore */
      }
    }, 1350);
  }, [onHeroComplete]);

  const handleIntroComplete = useCallback(() => {
    onIntroComplete?.();
    startHeroAnimation();
  }, [onIntroComplete, startHeroAnimation]);

  useEffect(() => {
    if (!showIntroAnimation) return undefined;
    const fallbackTimer = setTimeout(() => startHeroAnimation(), 2800);
    return () => clearTimeout(fallbackTimer);
  }, [showIntroAnimation, startHeroAnimation]);

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <style>{`
        @keyframes fluidHeroEntrance {
          0% { transform: translateY(105vh) scale(0.78); opacity: 0.4; border-radius: 14px; }
          38% { transform: translateY(0) scale(0.8); opacity: 1; border-radius: 8px; }
          50% { transform: translateY(0) scale(0.82); border-radius: 6px; }
          100% { transform: translateY(0) scale(1); opacity: 1; border-radius: 0px; }
        }
        @keyframes fluidMediaCounterScale {
          0% { transform: scale(1.18); }
          38% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes starIntro {
          0% { transform: scale(0.12) rotate(-160deg); opacity: 0; }
          30% { opacity: 1; }
          75% { transform: scale(1.04) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .fluid-hero-animating {
          animation: fluidHeroEntrance 1.35s cubic-bezier(0.65, 0, 0.35, 1) forwards !important;
        }
        .fluid-media-counter-scale {
          animation: fluidMediaCounterScale 1.35s cubic-bezier(0.65, 0, 0.35, 1) forwards !important;
        }
        .fluid-star-intro {
          animation: starIntro 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
          transform-origin: center center;
        }
      `}</style>

      {showIntroAnimation && (
        <IntroOverlay
          brandName={brandName}
          accentColor={accentColor}
          onComplete={handleIntroComplete}
        />
      )}

      {showNavbar && (
        <FloatingNavbar
          brandName={brandName}
          brandLogo={brandLogo}
          navLinks={navLinks}
          ctaText={ctaText}
          onCtaClick={onCtaClick}
          secondaryCtaText={secondaryCtaText}
          onSecondaryCtaClick={onSecondaryCtaClick}
          languageSwitcher={languageSwitcher}
          visible={navbarVisible}
          accentColor={accentColor}
        />
      )}

      <HeroBannerSection
        stage={stage}
        videoSrc={videoSrc}
        heroImage={heroImage}
        headlineFirst={headlineFirst}
        headlineSecond={headlineSecond}
        headlineKicker={headlineKicker}
        heroCtaPrimary={heroCtaPrimary}
        onHeroCtaPrimary={onHeroCtaPrimary}
        heroCtaSecondary={heroCtaSecondary}
        heroCtaSecondaryHref={heroCtaSecondaryHref}
        heroHint={heroHint}
      />
    </div>
  );
}

export default FluidHeroNavbar;
