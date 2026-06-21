import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LandingBrandLockup } from "./LandingBrandLockup";
import { scrollToLandingProduct } from "./landingScroll";
import { useLandingScrollSpy } from "./useLandingScrollSpy";

const NAV_LINKS = [
  { href: "#product", label: "Producto", sectionId: "product", isProduct: true },
  { href: "#features", label: "Características", sectionId: "features" },
  { href: "#pricing", label: "Precios", sectionId: "pricing" },
  { href: "#faq", label: "FAQ", sectionId: "faq" },
];

export function LandingNavbar({ setView }) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeSection = useLandingScrollSpy(["product", "features", "pricing", "faq"]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setScrollProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  const scrollTo = (href, isProduct) => {
    setMobileOpen(false);
    if (isProduct) {
      scrollToLandingProduct("species");
      return;
    }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navLinkClass = (sectionId) => {
    const isActive = activeSection === sectionId;
    return `relative text-xs font-semibold uppercase tracking-[0.12em] transition hover:text-guiaa-brand-navy ${
      isActive ? "text-guiaa-brand-navy" : "text-guiaa-brand-navy/75"
    }`;
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-white/80 shadow-sm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex min-h-[4.75rem] max-w-6xl items-center justify-between gap-3 px-5 py-2 sm:min-h-[5rem] sm:gap-4 sm:px-8 lg:px-10">
        <LandingBrandLockup
          variant="navbar"
          onClick={() => setView("landing")}
          className="max-w-[min(100%,42rem)]"
        />

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex"
          aria-label="Principal"
        >
          {NAV_LINKS.map(({ href, label, sectionId, isProduct }) => (
            <button
              key={href}
              type="button"
              onClick={() => scrollTo(href, isProduct)}
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
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <button
            type="button"
            onClick={() => setView("login")}
            className="text-sm font-semibold text-guiaa-brand-navy/70 transition hover:text-guiaa-brand-navy"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setView("register")}
            className="rounded-xl bg-guiaa-brand-green px-5 py-2.5 text-sm font-bold text-white transition hover:bg-guiaa-brand-green-dark"
          >
            Registrarse
          </button>
        </div>

        <button
          type="button"
          className="inline-flex rounded-lg p-2 text-guiaa-brand-navy hover:bg-guiaa-brand-navy/5 sm:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className="absolute bottom-0 left-0 h-0.5 bg-guiaa-brand-green/80 transition-[width] duration-150 ease-out"
        style={{ width: `${scrollProgress * 100}%` }}
        aria-hidden
      />

      {mobileOpen && (
        <div className="border-t border-guiaa-brand-navy/10 bg-white/95 px-5 py-4 backdrop-blur-md sm:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, sectionId, isProduct }) => (
              <button
                key={href}
                type="button"
                onClick={() => scrollTo(href, isProduct)}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                  activeSection === sectionId
                    ? "bg-guiaa-sky-soft/60 text-guiaa-brand-navy"
                    : "text-guiaa-brand-navy/80"
                }`}
                aria-current={activeSection === sectionId ? "true" : undefined}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-guiaa-brand-navy/10 pt-3">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setView("login");
              }}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-guiaa-brand-navy/80"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setView("register");
              }}
              className="rounded-xl bg-guiaa-brand-green py-2.5 text-sm font-bold text-white"
            >
              Registrarse
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
