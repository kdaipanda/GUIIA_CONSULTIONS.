import { Capacitor } from "@capacitor/core";

/** True cuando corre dentro del WebView nativo (Android/iOS). */
export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function unlockNativeScroll() {
  const html = document.documentElement;
  const body = document.body;
  const root = document.getElementById("root");

  html.classList.add("guiaa-native-app");
  body.classList.add("guiaa-native-app");

  // Estilos inline: ganan a CSS con !important de terceros / recorders
  html.style.setProperty("height", "100%", "important");
  html.style.setProperty("overflow", "hidden", "important");
  body.style.setProperty("height", "100%", "important");
  body.style.setProperty("overflow", "hidden", "important");
  body.style.setProperty("position", "relative", "important");
  body.style.setProperty("width", "100%", "important");
  body.style.removeProperty("touch-action");

  if (root) {
    root.style.setProperty("height", "100%", "important");
    root.style.setProperty("overflow-y", "scroll", "important");
    root.style.setProperty("overflow-x", "hidden", "important");
    root.style.setProperty("-webkit-overflow-scrolling", "touch", "important");
    root.style.setProperty("touch-action", "pan-y", "important");
    root.style.setProperty("overscroll-behavior-y", "contain", "important");
  }
}

/**
 * Ajustes de shell nativo: scroll, status bar, splash.
 * Seguro llamar en web: no-op si no es nativo.
 */
export async function initNativeApp() {
  if (!isNativeApp()) return;

  unlockNativeScroll();

  try {
    if (window.posthog?.stopSessionRecording) {
      window.posthog.stopSessionRecording();
    }
    if (window.posthog?.opt_out_capturing) {
      // Mantener analytics básicos; cortar captura agresiva de sesión si aplica
    }
  } catch {
    /* ignore */
  }

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: "#0c2d4d" });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    /* plugin no disponible */
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* plugin no disponible */
  }

  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch {
    /* plugin no disponible */
  }

  // Reaplicar por si algún modal/recorder muta overflow al montar
  requestAnimationFrame(unlockNativeScroll);
  setTimeout(unlockNativeScroll, 300);
}
