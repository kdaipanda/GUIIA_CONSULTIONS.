import React from "react";

const LOGO_SRC = "/GuiaaLogo-full.png";

export const GUIAA_TAGLINE_PRIMARY = "Gran universo de inteligencia animal.";
export const GUIAA_TAGLINE_SECONDARY =
  "Soporte a la decisión clínica CDS avanzado grado L4 y L5.";

export function GuiaaBrandLockup({
  onClick,
  variant = "navbar",
  showTaglines = true,
  className = "",
}) {
  const isNavbar = variant === "navbar";
  const isAuth = variant === "auth";
  const isHeader = variant === "header";
  const isLoading = variant === "loading";

  if (isHeader) {
    const inner = (
      <div className={`flex min-w-0 items-end gap-3 sm:gap-3.5 ${className}`}>
        <img
          src={LOGO_SRC}
          alt="GUIAA"
          className="logo-image logo-image-full"
        />
        {showTaglines && (
          <div className="nav-brand-text">
            <span className="nav-brand-subtitle">{GUIAA_TAGLINE_PRIMARY}</span>
            <span className="nav-brand-subsubtitle">{GUIAA_TAGLINE_SECONDARY}</span>
          </div>
        )}
      </div>
    );

    if (onClick) {
      return (
        <button type="button" onClick={onClick} className="nav-brand-button min-w-0 text-left">
          {inner}
        </button>
      );
    }

    return inner;
  }

  const logoClasses = isNavbar
    ? "h-12 w-auto max-w-[11rem] shrink-0 object-contain object-left sm:h-[4.25rem] sm:max-w-[18rem]"
    : isLoading
      ? "loading-logo-full"
      : isAuth
        ? "h-16 w-auto max-w-[15rem] shrink-0 object-contain sm:h-[4.5rem] sm:max-w-[18rem]"
        : "h-14 w-auto max-w-[16rem] shrink-0 object-contain sm:h-16 sm:max-w-[18rem]";

  const taglineClasses = isNavbar
    ? "min-w-0 max-w-[11rem] translate-y-1 sm:max-w-none sm:translate-y-2 sm:border-l sm:border-guiaa-brand-navy/12 sm:pl-3 lg:pl-4"
    : isLoading
      ? "min-w-0 max-w-sm text-center"
      : isAuth
        ? "min-w-0 max-w-sm text-center"
        : "min-w-0 text-center sm:text-left";

  const primaryClasses = isNavbar
    ? "text-[10px] font-semibold leading-snug text-guiaa-brand-navy sm:text-[11px] lg:text-xs"
    : isLoading
      ? "text-sm font-semibold leading-snug text-white/95 sm:text-base"
      : isAuth
        ? "text-xs font-semibold leading-snug text-guiaa-brand-navy sm:text-sm"
        : "text-xs font-semibold leading-snug text-guiaa-brand-navy sm:text-sm";

  const secondaryClasses = isNavbar
    ? "mt-0.5 text-[9px] leading-snug text-guiaa-brand-navy/60 sm:text-[10px] lg:text-[11px]"
    : isLoading
      ? "mt-1 text-xs leading-snug text-white/75 sm:text-sm"
      : "mt-1 text-[11px] leading-snug text-guiaa-brand-navy/60 sm:text-xs";

  const wrapperClasses = isNavbar
    ? "flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-end sm:gap-3 md:gap-4"
    : isAuth || isLoading
      ? "flex min-w-0 flex-col items-center gap-3"
      : "flex min-w-0 flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4";

  const inner = (
    <div className={`${wrapperClasses} ${className}`}>
      <img src={LOGO_SRC} alt="GUIAA" className={logoClasses} />
      {showTaglines && (
        <div className={taglineClasses}>
          <p className={primaryClasses}>{GUIAA_TAGLINE_PRIMARY}</p>
          <p className={secondaryClasses}>{GUIAA_TAGLINE_SECONDARY}</p>
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="min-w-0 text-left">
        {inner}
      </button>
    );
  }

  return inner;
}
