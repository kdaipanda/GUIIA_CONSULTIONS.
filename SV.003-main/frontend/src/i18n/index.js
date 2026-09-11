import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enLanding from "./locales/en/landing.json";
import enAuth from "./locales/en/auth.json";
import enLegal from "./locales/en/legal.json";
import enClinic from "./locales/en/clinic.json";
import enHelp from "./locales/en/help.json";

import esCommon from "./locales/es/common.json";
import esLanding from "./locales/es/landing.json";
import esAuth from "./locales/es/auth.json";
import esLegal from "./locales/es/legal.json";
import esClinic from "./locales/es/clinic.json";
import esHelp from "./locales/es/help.json";

export const SUPPORTED_LOCALES = ["en", "es"];
export const LOCALE_STORAGE_KEY = "guiaa_locale";

/** Namespaces incluidos en el bundle inicial (el resto se cargan bajo demanda). */
export const CORE_I18N_NAMESPACES = ["common", "landing", "auth", "legal", "clinic", "help"];
export const DEFERRED_I18N_NAMESPACES = ["speciesForms", "pdf"];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        landing: enLanding,
        auth: enAuth,
        legal: enLegal,
        clinic: enClinic,
        help: enHelp,
      },
      es: {
        common: esCommon,
        landing: esLanding,
        auth: esAuth,
        legal: esLegal,
        clinic: esClinic,
        help: esHelp,
      },
    },
    fallbackLng: "en",
    defaultNS: "common",
    ns: [...CORE_I18N_NAMESPACES, ...DEFERRED_I18N_NAMESPACES],
    partialBundledLanguages: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

export function syncDocumentLocale(lng) {
  const lang = (lng || i18n.language || "en").startsWith("es") ? "es" : "en";
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang === "es" ? "es" : "en";
  }
  return lang;
}

i18n.on("languageChanged", syncDocumentLocale);
syncDocumentLocale(i18n.language);

export default i18n;
