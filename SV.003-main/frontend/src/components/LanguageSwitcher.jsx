import React from "react";
import { useTranslation } from "react-i18next";
import { syncDocumentLocale } from "../i18n";
import { preloadDeferredNamespaces } from "../lib/loadI18nNamespace";
import "./languageSwitcher.css";

/**
 * Compact ES | EN segmented language toggle for landing, auth, and clinic shell.
 * variant="menu" — labeled row for account dropdown.
 */
export function LanguageSwitcher({
  className = "",
  tone = "default",
  variant = "default",
}) {
  const { i18n, t } = useTranslation("common");
  const current = (i18n.language || "en").startsWith("es") ? "es" : "en";

  const setLang = async (lng) => {
    if (lng === current) return;
    await i18n.changeLanguage(lng);
    syncDocumentLocale(lng);
    await preloadDeferredNamespaces();
  };

  const switcher = (
    <div
      className={`lang-switch${tone === "on-dark" ? " lang-switch--on-dark" : ""}${
        className && variant !== "menu" ? ` ${className}` : ""
      }`.trim()}
      role="group"
      aria-label={variant === "menu" ? undefined : t("language")}
      aria-labelledby={variant === "menu" ? "header-lang-label" : undefined}
      data-lang={current}
    >
      <span className="lang-switch__thumb" aria-hidden />
      <button
        type="button"
        className={`lang-switch__btn${current === "es" ? " is-active" : ""}`}
        onClick={() => setLang("es")}
        aria-pressed={current === "es"}
        title={t("switchToEs")}
      >
        ES
      </button>
      <button
        type="button"
        className={`lang-switch__btn${current === "en" ? " is-active" : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={current === "en"}
        title={t("switchToEn")}
      >
        EN
      </button>
    </div>
  );

  if (variant === "menu") {
    return (
      <div className={`header-lang-menu ${className}`.trim()} role="none">
        <span className="header-lang-menu-label" id="header-lang-label">
          {t("language")}
        </span>
        {switcher}
      </div>
    );
  }

  return switcher;
}
