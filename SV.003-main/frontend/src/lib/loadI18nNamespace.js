import i18n, { CORE_I18N_NAMESPACES, DEFERRED_I18N_NAMESPACES } from "../i18n";

const loadedNamespaces = new Set();

function resolveLocale(lng) {
  return (lng || i18n.language || "en").startsWith("es") ? "es" : "en";
}

function markBundledNamespaces(lng) {
  const language = resolveLocale(lng);
  CORE_I18N_NAMESPACES.forEach((namespace) => {
    if (i18n.hasResourceBundle(language, namespace)) {
      loadedNamespaces.add(`${language}:${namespace}`);
    }
  });
}

markBundledNamespaces();

/**
 * Carga un namespace i18n bajo demanda (reduce el bundle inicial).
 */
export async function loadI18nNamespace(namespace) {
  const lng = resolveLocale();
  const key = `${lng}:${namespace}`;
  if (loadedNamespaces.has(key)) return;
  if (i18n.hasResourceBundle(lng, namespace)) {
    loadedNamespaces.add(key);
    return;
  }
  const mod = await import(`../i18n/locales/${lng}/${namespace}.json`);
  i18n.addResourceBundle(lng, namespace, mod.default, true, true);
  loadedNamespaces.add(key);
}

export function preloadDeferredNamespaces() {
  return Promise.all(DEFERRED_I18N_NAMESPACES.map((ns) => loadI18nNamespace(ns)));
}

export function preloadAppNamespaces() {
  return preloadDeferredNamespaces();
}

export function preloadSpeciesFormNamespace() {
  return loadI18nNamespace("speciesForms");
}

i18n.on("languageChanged", (lng) => {
  markBundledNamespaces(lng);
  void preloadDeferredNamespaces();
});

void preloadDeferredNamespaces();
