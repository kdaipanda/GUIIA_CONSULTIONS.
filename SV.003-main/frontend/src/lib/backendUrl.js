const PRODUCTION_API = "https://api.guiaa.vet";
const LOCAL_API = "http://localhost:8000";

function isPrivateLanHost(hostname) {
  return (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

function isProductionHost(hostname) {
  return (
    hostname === "guiaa.vet" ||
    hostname === "www.guiaa.vet" ||
    hostname.endsWith(".guiaa.vet")
  );
}

function isLocalDevHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || isPrivateLanHost(hostname);
}

function isLocalBackendUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || isPrivateLanHost(host);
  } catch {
    return false;
  }
}

function localApiUrl(hostname) {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_API;
  }
  return `http://${hostname}:8000`;
}

function readStoredBackendUrl(requireHttps) {
  try {
    const stored = localStorage.getItem("backend_url");
    if (!stored) return null;
    const parsed = new URL(stored);
    if (requireHttps && parsed.protocol !== "https:") return null;
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return stored.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function readParamBackendUrl(requireHttps) {
  try {
    const paramUrl = new URLSearchParams(window.location.search).get("backend_url");
    if (!paramUrl) return null;
    const parsed = new URL(paramUrl);
    if (requireHttps && parsed.protocol !== "https:") return null;
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return paramUrl.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getBackendUrl() {
  const envUrl = process.env.REACT_APP_BACKEND_URL?.trim()?.replace(/\/$/, "");

  try {
    const hostname = window.location.hostname;

    if (isProductionHost(hostname)) {
      // Mismo origen: Vercel reescribe /api/* → api.guiaa.vet (sin CORS).
      if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin.replace(/\/$/, "");
      }
      return PRODUCTION_API;
    }

    if (hostname.endsWith("trycloudflare.com")) {
      return "";
    }

    if (isLocalDevHost(hostname)) {
      // En desarrollo local, no usar la API de producción guardada por error.
      try {
        const stored = localStorage.getItem("backend_url");
        if (stored && !isLocalBackendUrl(stored)) {
          localStorage.removeItem("backend_url");
        }
      } catch {
        /* ignore */
      }

      const paramUrl = readParamBackendUrl(false);
      if (paramUrl) {
        localStorage.setItem("backend_url", paramUrl);
        return paramUrl;
      }
      const stored = readStoredBackendUrl(false);
      if (stored && isLocalBackendUrl(stored)) {
        return stored;
      }
      return localApiUrl(hostname);
    }

    if (envUrl) {
      return envUrl;
    }

    if (hostname.endsWith("vercel.app")) {
      const paramUrl = readParamBackendUrl(true);
      if (paramUrl) {
        localStorage.setItem("backend_url", paramUrl);
        return paramUrl;
      }
      const stored = readStoredBackendUrl(true);
      if (stored) return stored;
      if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin.replace(/\/$/, "");
      }
      return PRODUCTION_API;
    }

    const stored = readStoredBackendUrl(true);
    if (stored) return stored;
  } catch {
    /* ignore */
  }

  return envUrl || LOCAL_API;
}

export const BACKEND_URL = getBackendUrl();

// Re-evaluar en cada uso crítico (login) con getBackendUrl().
