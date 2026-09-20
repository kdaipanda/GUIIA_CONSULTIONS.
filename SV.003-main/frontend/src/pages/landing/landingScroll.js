import { LANDING_SCREENSHOTS } from "./landingPreviewData";

const PRODUCT_TAB_EVENT = "landing-product-tab";

export function isLandingProductTab(id) {
  return LANDING_SCREENSHOTS.some((shot) => shot.id === id);
}

export function productTabHref(tabId = LANDING_SCREENSHOTS[0].id) {
  const nextTab = isLandingProductTab(tabId) ? tabId : LANDING_SCREENSHOTS[0].id;
  return `#product-${nextTab}`;
}

export function parseProductTabFromHash(hash = window.location.hash) {
  const match = hash.match(/^#product(?:-(\w+))?$/);
  const tabId = match?.[1] || LANDING_SCREENSHOTS[0].id;
  return isLandingProductTab(tabId) ? tabId : LANDING_SCREENSHOTS[0].id;
}

export function scrollToLandingSection(selector) {
  document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function scrollToLandingProduct(tabId = LANDING_SCREENSHOTS[0].id) {
  const nextTab = isLandingProductTab(tabId) ? tabId : LANDING_SCREENSHOTS[0].id;
  window.dispatchEvent(new CustomEvent(PRODUCT_TAB_EVENT, { detail: nextTab }));
  window.history.replaceState(null, "", `#product-${nextTab}`);
  scrollToLandingSection("#product");
}

/** Same-page nav: keep Cmd/Ctrl/middle-click; smooth-scroll on plain left click. */
export function onLandingAnchorClick(event, { productTab, after } = {}) {
  if (event.defaultPrevented) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  if (productTab) {
    scrollToLandingProduct(productTab);
  } else {
    const href = event.currentTarget.getAttribute("href");
    if (href?.startsWith("#")) scrollToLandingSection(href);
  }
  after?.();
}

export function subscribeLandingProductTab(callback) {
  const handler = (event) => callback(event.detail);
  window.addEventListener(PRODUCT_TAB_EVENT, handler);
  return () => window.removeEventListener(PRODUCT_TAB_EVENT, handler);
}

export function setLandingProductTabHash(tabId) {
  if (!isLandingProductTab(tabId)) return;
  window.history.replaceState(null, "", `#product-${tabId}`);
}
