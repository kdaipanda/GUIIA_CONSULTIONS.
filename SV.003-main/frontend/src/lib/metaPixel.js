/**
 * Meta Pixel (Facebook Ads) — eventos de conversión para campañas de adquisición MVZ.
 * Solo se activa si REACT_APP_META_PIXEL_ID está configurado.
 */

const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID?.trim();
const PURCHASE_TRACKED_PREFIX = "guiaa_meta_purchase_";

let initialized = false;

function isEnabled() {
  return Boolean(PIXEL_ID);
}

function loadPixelScript() {
  if (typeof window === "undefined" || window.fbq) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);

  const n = function fbq(...args) {
    if (n.callMethod) {
      n.callMethod(...args);
    } else {
      n.queue.push(args);
    }
  };
  n.queue = [];
  n.loaded = true;
  n.version = "2.0";
  window.fbq = n;
  if (!window._fbq) window._fbq = n;
}

export function initMetaPixel() {
  if (!isEnabled() || initialized || typeof window === "undefined") return;
  initialized = true;
  loadPixelScript();
  window.fbq("init", PIXEL_ID);
}

export function trackMetaEvent(eventName, params = {}, options = {}) {
  if (!isEnabled()) return;
  initMetaPixel();
  if (!window.fbq) return;
  window.fbq("track", eventName, params, options);
}

export function trackMetaPageView() {
  trackMetaEvent("PageView");
}

export function trackMetaLead(source = "register_intent") {
  trackMetaEvent("Lead", {
    content_name: "MVZ Registration",
    content_category: source,
  });
}

export function trackMetaViewContent(contentName = "Pricing") {
  trackMetaEvent("ViewContent", {
    content_name: contentName,
    content_category: "membership",
  });
}

export function trackMetaCompleteRegistration(eventId) {
  const options = eventId ? { eventID: eventId } : {};
  trackMetaEvent(
    "CompleteRegistration",
    {
      content_name: "MVZ Registration",
      status: true,
    },
    options,
  );
}

export function trackMetaInitiateCheckout({
  packageId,
  value,
  currency = "MXN",
  contentCategory = "membership",
}) {
  const params = {
    content_name: packageId,
    content_category: contentCategory,
    currency,
    num_items: 1,
  };
  if (value != null && !Number.isNaN(Number(value))) {
    params.value = Number(value);
  }
  trackMetaEvent("InitiateCheckout", params);
}

export function trackMetaPurchase({
  purchaseType,
  packageId,
  value,
  currency = "MXN",
  eventId,
}) {
  const params = {
    content_type: purchaseType || "product",
    currency,
    num_items: 1,
  };
  if (packageId) params.content_ids = [packageId];
  if (value != null && !Number.isNaN(Number(value))) {
    params.value = Number(value);
  }
  const options = eventId ? { eventID: eventId } : {};
  trackMetaEvent("Purchase", params, options);
}

export function trackMetaPurchaseOnce(sessionId, purchaseData) {
  if (!sessionId || !isEnabled()) return;
  const storageKey = `${PURCHASE_TRACKED_PREFIX}${sessionId}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
  } catch {
    /* sessionStorage no disponible */
  }
  trackMetaPurchase({ ...purchaseData, eventId: sessionId });
}

export function isMetaPixelEnabled() {
  return isEnabled();
}
