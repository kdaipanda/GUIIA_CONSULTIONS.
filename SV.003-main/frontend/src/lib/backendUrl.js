export function getBackendUrl() {
  const localUrl = "http://localhost:8000";
  const envUrl = process.env.REACT_APP_BACKEND_URL;

  try {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get("backend_url");
    if (paramUrl) {
      try {
        new URL(paramUrl);
        localStorage.setItem("backend_url", paramUrl);
        return paramUrl;
      } catch {
        /* ignore invalid */
      }
    }

    if (window.location.hostname.endsWith("trycloudflare.com")) {
      return "";
    }

    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return localUrl;
    }

    if (envUrl) {
      return envUrl;
    }

    if (window.location.hostname.includes("guiaa.vet")) {
      return "https://api.guiaa.vet";
    }

    const stored = localStorage.getItem("backend_url");
    if (stored) return stored;
  } catch {
    /* ignore */
  }

  return envUrl || localUrl;
}

export const BACKEND_URL = getBackendUrl();
