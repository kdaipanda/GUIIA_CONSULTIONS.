import React, { useEffect, useState } from "react";
import { readStoredTheme } from "../lib/themeSync";

const LOGO_SRC = "/GuiaaLogo-full.png";
const LOGO_SRC_ON_DARK = "/brand/GuiaaLogo-on-dark.png";

export const GUIAA_TAGLINE_PRIMARY = "Gran universo de inteligencia animal.";
export const GUIAA_TAGLINE_SECONDARY =
  "Soporte a la decisión clínica CDS avanzado grado L4 y L5.";

function resolveLogoSrc(tone = "auto") {
  if (tone === "on-dark") return LOGO_SRC_ON_DARK;
  if (tone === "on-light") return LOGO_SRC;

  if (typeof document === "undefined") {
    return readStoredTheme() === "dark" ? LOGO_SRC_ON_DARK : LOGO_SRC;
  }

  const root = document.documentElement;
  const isDark =
    root.classList.contains("dark") || root.getAttribute("data-theme") === "dark";
  return isDark ? LOGO_SRC_ON_DARK : LOGO_SRC;
}

export function GuiaaLogoImg({ className, tone = "auto", alt = "GUIAA" }) {
  const [src, setSrc] = useState(() => resolveLogoSrc(tone));

  useEffect(() => {
    const update = () => setSrc(resolveLogoSrc(tone));
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, [tone]);

  return <img src={src} alt={alt} className={className} decoding="async" />;
}

export function GuiaaBrandLockup({
  onClick,
  variant = "navbar",
  showTaglines = true,
  className = "",
  logoTone = "auto",
}) {
  const isNavbar = variant === "navbar";
  const isAuth = variant === "auth";
  const isHeader = variant === "header";
  const isLoading = variant === "loading";
  const isFooter = variant === "footer";

  const resolvedTone =
    logoTone !== "auto"
      ? logoTone
      : isLoading || isFooter
        ? "on-dark"
        : "auto";

  const logoClasses = [
    "logo-image",
    "logo-image-full",
    isHeader && "logo-image-header",
    isNavbar && "logo-image-navbar",
    isLoading && "logo-image-loading",
    isAuth && "logo-image-auth",
  ]
    .filter(Boolean)
    .join(" ");

  const homeLabel = showTaglines
    ? `GUIAA. ${GUIAA_TAGLINE_PRIMARY} ${GUIAA_TAGLINE_SECONDARY}`
    : "GUIAA, ir al inicio";

  if (isHeader) {
    const inner = (
      <div
        className={`guiaa-brand-lockup guiaa-brand-lockup--header flex min-w-0 items-center gap-3 sm:gap-4 ${className}`}
      >
        <GuiaaLogoImg className={logoClasses} tone={resolvedTone} alt={onClick ? "" : "GUIAA"} />
        {showTaglines && (
          <div className="nav-brand-text" aria-hidden={Boolean(onClick)}>
            <span className="nav-brand-subtitle">{GUIAA_TAGLINE_PRIMARY}</span>
            <span className="nav-brand-subsubtitle">{GUIAA_TAGLINE_SECONDARY}</span>
          </div>
        )}
      </div>
    );

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className="nav-brand-button min-w-0 text-left"
          aria-label={homeLabel}
        >
          {inner}
        </button>
      );
    }

    return inner;
  }

  const taglineClasses = isNavbar
    ? "min-w-0 max-w-[11rem] sm:max-w-none sm:border-l sm:border-guiaa-brand-navy/12 sm:pl-3 lg:pl-4"
    : isLoading || isFooter
      ? "min-w-0 max-w-sm text-center sm:text-left"
      : isAuth
        ? "min-w-0 max-w-sm text-center"
        : "min-w-0 text-center sm:text-left";

  const primaryClasses = isNavbar
    ? "text-[10px] font-semibold leading-snug text-guiaa-brand-navy sm:text-[11px] lg:text-xs"
    : isLoading || isFooter
      ? "text-sm font-semibold leading-snug text-white/95 sm:text-base"
      : isAuth
        ? "text-xs font-semibold leading-snug text-guiaa-brand-navy sm:text-sm"
        : "text-xs font-semibold leading-snug text-guiaa-brand-navy sm:text-sm";

  const secondaryClasses = isNavbar
    ? "mt-0.5 text-[9px] leading-snug text-guiaa-brand-navy/60 sm:text-[10px] lg:text-[11px]"
    : isLoading || isFooter
      ? "mt-1 text-xs leading-snug text-white/75 sm:text-sm"
      : "mt-1 text-[11px] leading-snug text-guiaa-brand-navy/60 sm:text-xs";

  const wrapperClasses = isNavbar
    ? "guiaa-brand-lockup guiaa-brand-lockup--navbar flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4"
    : isAuth || isLoading || isFooter
      ? "guiaa-brand-lockup guiaa-brand-lockup--stack flex min-w-0 flex-col items-center gap-3"
      : "guiaa-brand-lockup flex min-w-0 flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4";

  const inner = (
    <div className={`${wrapperClasses} ${className}`}>
      <GuiaaLogoImg className={logoClasses} tone={resolvedTone} alt={onClick ? "" : "GUIAA"} />
      {showTaglines && (
        <div className={taglineClasses} aria-hidden={Boolean(onClick)}>
          <p className={primaryClasses}>{GUIAA_TAGLINE_PRIMARY}</p>
          <p className={secondaryClasses}>{GUIAA_TAGLINE_SECONDARY}</p>
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="min-w-0 text-left" aria-label={homeLabel}>
        {inner}
      </button>
    );
  }

  return inner;
}
