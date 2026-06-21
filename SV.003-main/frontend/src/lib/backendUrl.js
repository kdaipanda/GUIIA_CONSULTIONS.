const PRODUCTION_API = "https://api.guiaa.vet";
const LOCAL_API = "http://localhost:8000";

function isProductionHost(hostname) {
  return (
    hostname === "guiaa.vet" ||
    hostname === "www.guiaa.vet" ||
    hostname.endsWith(".guiaa.vet")
  );
}

function isLocalDevHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
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
      if (envUrl?.startsWith("https://")) return envUrl;
      return PRODUCTION_API;
    }

    if (hostname.endsWith("trycloudflare.com")) {
      return "";
    }

    if (isLocalDevHost(hostname)) {
      const paramUrl = readParamBackendUrl(false);
      if (paramUrl) {
        localStorage.setItem("backend_url", paramUrl);
        return paramUrl;
      }
      const stored = readStoredBackendUrl(false);
      if (stored) return stored;
      return LOCAL_API;
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
