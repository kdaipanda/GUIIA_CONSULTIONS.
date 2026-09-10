/**
 * Bootstrap i18n para producción.
 * AdminPage (y clinic) importan `../../i18n`; los JSON clinic.* ya están en el repo.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enClinic from "./locales/en/clinic.json";
import esClinic from "./locales/es/clinic.json";

export const SUPPORTED_LOCALES = ["en", "es"];
export const LOCALE_STORAGE_KEY = "guiaa_locale";
export const CORE_I18N_NAMESPACES = ["clinic"];
export const DEFERRED_I18N_NAMESPACES = [];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { clinic: enClinic },
      es: { clinic: esClinic },
    },
    fallbackLng: "es",
    defaultNS: "clinic",
    ns: ["clinic"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

export function syncDocumentLocale(lng) {
  const lang = (lng || i18n.language || "es").startsWith("es") ? "es" : "en";
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang === "es" ? "es" : "en";
  }
  return lang;
}

i18n.on("languageChanged", syncDocumentLocale);
syncDocumentLocale(i18n.language);

export default i18n;
