/**
 * Google Ads (gtag) — conversiones para campañas de búsqueda/display de adquisición MVZ.
 * Solo se activa si REACT_APP_GOOGLE_ADS_ID está configurado.
 *
 * Etiquetas de conversión opcionales (Google Ads → Objetivos → Conversiones):
 * - REACT_APP_GOOGLE_ADS_REGISTRATION_LABEL
 * - REACT_APP_GOOGLE_ADS_CHECKOUT_LABEL
 * - REACT_APP_GOOGLE_ADS_PURCHASE_LABEL
 */

const ADS_ID = process.env.REACT_APP_GOOGLE_ADS_ID?.trim();
const REGISTRATION_LABEL = process.env.REACT_APP_GOOGLE_ADS_REGISTRATION_LABEL?.trim();
const CHECKOUT_LABEL = process.env.REACT_APP_GOOGLE_ADS_CHECKOUT_LABEL?.trim();
const PURCHASE_LABEL = process.env.REACT_APP_GOOGLE_ADS_PURCHASE_LABEL?.trim();
const PURCHASE_TRACKED_PREFIX = "guiaa_google_ads_purchase_";

let initialized = false;

function isEnabled() {
  return Boolean(ADS_ID);
}

function loadGtagScript() {
  if (typeof window === "undefined" || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  const gtag = function gtag(...args) {
    window.dataLayer.push(args);
  };
  window.gtag = gtag;
  gtag("js", new Date());

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`;
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);
}

export function initGoogleAds() {
  if (!isEnabled() || initialized || typeof window === "undefined") return;
  initialized = true;
  loadGtagScript();
  window.gtag("config", ADS_ID, { allow_enhanced_conversions: true });
}

function sendConversion(label, params = {}) {
  if (!label) return;
  initGoogleAds();
  if (!window.gtag) return;
  window.gtag("event", "conversion", {
    send_to: `${ADS_ID}/${label}`,
    ...params,
  });
}

export function trackGoogleAdsPageView() {
  initGoogleAds();
}

export function trackGoogleAdsLead() {
  sendConversion(REGISTRATION_LABEL);
}

export function trackGoogleAdsViewContent() {
  initGoogleAds();
  if (!window.gtag) return;
  window.gtag("event", "view_item", {
    items: [{ item_name: "Pricing", item_category: "membership" }],
  });
}

export function trackGoogleAdsCompleteRegistration(transactionId) {
  sendConversion(REGISTRATION_LABEL, {
    transaction_id: transactionId || undefined,
  });
}

export function trackGoogleAdsInitiateCheckout({ value, currency = "MXN" } = {}) {
  const params = { currency: currency.toUpperCase() };
  if (value != null && !Number.isNaN(Number(value))) {
    params.value = Number(value);
  }
  sendConversion(CHECKOUT_LABEL, params);
}

export function trackGoogleAdsPurchase({
  value,
  currency = "MXN",
  transactionId,
}) {
  const params = { currency: currency.toUpperCase() };
  if (value != null && !Number.isNaN(Number(value))) {
    params.value = Number(value);
  }
  if (transactionId) {
    params.transaction_id = transactionId;
  }
  sendConversion(PURCHASE_LABEL, params);
}

export function trackGoogleAdsPurchaseOnce(sessionId, purchaseData) {
  if (!sessionId || !isEnabled()) return;
  const storageKey = `${PURCHASE_TRACKED_PREFIX}${sessionId}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
  } catch {
    /* sessionStorage no disponible */
  }
  trackGoogleAdsPurchase({ ...purchaseData, transactionId: sessionId });
}

export function isGoogleAdsEnabled() {
  return isEnabled();
}
