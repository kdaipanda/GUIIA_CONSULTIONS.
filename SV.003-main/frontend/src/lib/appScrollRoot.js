/** Contenedor de scroll real (Capacitor: #root; web: ventana). */
export function getAppScrollRoot() {
  if (typeof document === "undefined") return null;
  if (document.documentElement.classList.contains("guiaa-native-app")) {
    return document.getElementById("root") || document.scrollingElement || document.documentElement;
  }
  return document.scrollingElement || document.documentElement;
}

export function getAppScrollY() {
  const root = getAppScrollRoot();
  if (!root) return window.scrollY || 0;
  if (root === document.documentElement || root === document.body || root === document.scrollingElement) {
    return window.scrollY || root.scrollTop || 0;
  }
  return root.scrollTop || 0;
}

export function onAppScroll(handler, options = { passive: true }) {
  const root = getAppScrollRoot();
  if (!root || root === document.documentElement || root === document.body || root === document.scrollingElement) {
    window.addEventListener("scroll", handler, options);
    return () => window.removeEventListener("scroll", handler);
  }
  root.addEventListener("scroll", handler, options);
  return () => root.removeEventListener("scroll", handler);
}
