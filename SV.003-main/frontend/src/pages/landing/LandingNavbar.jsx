import React, { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { LandingBrandLockup } from "./LandingBrandLockup";
import { onLandingAnchorClick, productTabHref } from "./landingScroll";
import { useLandingScrollSpy } from "./useLandingScrollSpy";

const SPY_SECTIONS = ["product", "features", "pricing", "faq"];

export function LandingNavbar({ setView, hero = false }) {
  const { t } = useTranslation("landing");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const progressRef = useRef(null);
  const scrolledRef = useRef(false);
  const frameRef = useRef(0);
  const activeSection = useLandingScrollSpy(SPY_SECTIONS);

  const navLinks = [
    {
      href: productTabHref("species"),
      label: t("nav.product"),
      sectionId: "product",
      productTab: "species",
    },
    { href: "#features", label: t("nav.services"), sectionId: "features" },
    { href: "#pricing", label: t("nav.pricing"), sectionId: "pricing" },
    { href: "#faq", label: t("nav.faq"), sectionId: "faq" },
  ];

  useEffect(() => {
    const updateScrollUi = () => {
      frameRef.current = 0;
      const y = window.scrollY;
      const nextScrolled = y > 16;
      if (nextScrolled !== scrolledRef.current) {
        scrolledRef.current = nextScrolled;
        setScrolled(nextScrolled);
      }

      const progressNode = progressRef.current;
      if (progressNode) {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight;
        const progress = scrollable > 0 ? y / scrollable : 0;
        progressNode.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      }
    };

    const onScroll = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(updateScrollUi);
    };

    updateScrollUi();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const navLinkClass = (sectionId) => {
    const isActive = activeSection === sectionId;
    if (hero) {
      return `relative text-sm font-semibold transition-colors duration-150 hover:text-white ${
        isActive ? "text-white" : "text-white/90"
      }`;
    }
    return `relative landing-eyebrow transition-colors duration-150 hover:text-guiaa-brand-navy ${
      isActive ? "text-guiaa-brand-navy" : "text-guiaa-brand-navy/75"
    }`;
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color] duration-200 ${
        hero
          ? `landing-nav-hero ${scrolled ? "landing-nav-scrolled" : "border-transparent"}`
          : scrolled
            ? "landing-nav-scrolled border-transparent"
            : "border-guiaa-brand-navy/6 bg-white/40"
      }`}
    >
      <div className="landing-container flex min-h-[3.75rem] items-center justify-between gap-2 py-2 sm:min-h-[4.75rem] sm:gap-4 sm:py-2.5">
        <LandingBrandLockup
          variant="navbar"
          logoTone={hero ? "on-dark" : "auto"}
          onClick={() => setView("landing")}
          className="min-w-0 shrink"
        />

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex"
          aria-label={t("nav.main")}
        >
          {navLinks.map(({ href, label, sectionId, productTab }) => (
            <a
              key={href}
              href={href}
              onClick={(event) =>
                onLandingAnchorClick(event, {
                  productTab,
                  after: () => setMobileOpen(false),
                })
              }
              className={navLinkClass(sectionId)}
              aria-current={activeSection === sectionId ? "true" : undefined}
            >
              {label}
              {activeSection === sectionId && (
                <span
                  className="absolute -bottom-1 left-0 right-0 mx-auto h-0.5 w-4 rounded-full bg-guiaa-brand-green"
                  aria-hidden
                />
              )}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher tone={hero ? "on-dark" : "default"} />
          <button
            type="button"
            onClick={() => setView("login")}
            className="landing-btn-ghost"
          >
            {t("nav.login")}
          </button>
          <button
            type="button"
            onClick={() => setView("register")}
            className="landing-btn-primary px-5 py-2.5"
          >
            {t("nav.register")}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          <button
            type="button"
            onClick={() => setView("register")}
            className="landing-btn-primary landing-nav-mobile-cta px-3.5 py-2 text-xs"
          >
            {t("nav.registerShort")}
          </button>
          <button
            type="button"
            className={`landing-nav-mobile-toggle inline-flex items-center justify-center rounded-lg ${
              hero ? "text-white hover:bg-white/10" : "text-guiaa-brand-navy hover:bg-guiaa-brand-navy/5"
            }`}
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="landing-nav-mobile-panel"
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {mobileOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>
      <div
        ref={progressRef}
        className="landing-nav-progress absolute bottom-0 left-0 h-0.5 w-full origin-left bg-guiaa-brand-green/80"
        aria-hidden
      />

      {mobileOpen && (
        <div
          id="landing-nav-mobile-panel"
          className={`landing-nav-mobile-panel border-t lg:hidden ${
            hero
              ? "border-white/15 bg-[#071622]/94"
              : "border-guiaa-brand-navy/10 bg-white/97"
          }`}
        >
          <div className="landing-container py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <LanguageSwitcher tone={hero ? "on-dark" : "default"} />
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setView("login");
                }}
                className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold ${
                  hero
                    ? "text-white hover:bg-white/10"
                    : "text-guiaa-brand-navy hover:bg-guiaa-brand-navy/5"
                }`}
              >
                {t("nav.login")}
              </button>
            </div>
            <nav className="flex flex-col gap-1" aria-label={t("nav.main")}>
              {navLinks.map(({ href, label, sectionId, productTab }) => (
                <a
                  key={href}
                  href={href}
                  onClick={(event) =>
                    onLandingAnchorClick(event, {
                      productTab,
                      after: () => setMobileOpen(false),
                    })
                  }
                  className={`landing-nav-mobile-link min-h-11 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                    activeSection === sectionId
                      ? hero
                        ? "bg-white/12 text-white"
                        : "bg-guiaa-sky-soft/60 text-guiaa-brand-navy"
                      : hero
                        ? "text-white"
                        : "text-guiaa-brand-navy/80"
                  }`}
                  aria-current={activeSection === sectionId ? "true" : undefined}
                >
                  {label}
                </a>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setView("register");
              }}
              className="landing-btn-primary mt-3 w-full justify-center"
            >
              {t("nav.register")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
