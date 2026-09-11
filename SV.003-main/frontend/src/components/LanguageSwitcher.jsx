import React from "react";
import { useTranslation } from "react-i18next";
import { syncDocumentLocale } from "../i18n";
import { preloadDeferredNamespaces } from "../lib/loadI18nNamespace";

/**
 * Compact ES | EN language toggle for landing, auth, and clinic shell.
 */
export function LanguageSwitcher({ className = "", tone = "default" }) {
  const { i18n, t } = useTranslation("common");
  const current = (i18n.language || "en").startsWith("es") ? "es" : "en";

  const setLang = async (lng) => {
    await i18n.changeLanguage(lng);
    syncDocumentLocale(lng);
    await preloadDeferredNamespaces();
  };

  const base =
    tone === "on-dark"
      ? "border-white/25 text-white"
      : "border-guiaa-brand-navy/15 text-guiaa-brand-navy";
  const active =
    tone === "on-dark"
      ? "bg-white/20 text-white"
      : "bg-guiaa-brand-navy text-white";
  const idle =
    tone === "on-dark"
      ? "hover:bg-white/10 text-white/85"
      : "hover:bg-guiaa-brand-navy/5 text-guiaa-brand-navy/80";

  return (
    <div
      className={`inline-flex items-center rounded-lg border p-0.5 text-xs font-semibold ${base} ${className}`}
      role="group"
      aria-label={t("language")}
    >
      <button
        type="button"
        className={`rounded-md px-2.5 py-1.5 transition ${current === "es" ? active : idle}`}
        onClick={() => setLang("es")}
        aria-pressed={current === "es"}
        title={t("switchToEs")}
      >
        ES
      </button>
      <button
        type="button"
        className={`rounded-md px-2.5 py-1.5 transition ${current === "en" ? active : idle}`}
        onClick={() => setLang("en")}
        aria-pressed={current === "en"}
        title={t("switchToEn")}
      >
        EN
      </button>
    </div>
  );
}
