/**
 * Convierte `detail` de FastAPI (string, array de validación u objeto) en texto legible.
 */
export function formatApiErrorDetail(detail, fallback = "Error del servidor") {
  if (detail == null || detail === "") return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const loc = Array.isArray(item.loc) ? item.loc.filter(Boolean).join(".") : "";
          const msg = item.msg || item.message || "";
          if (loc && msg) return `${loc}: ${msg}`;
          return msg || JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean);
    return parts.length ? parts.join(" · ") : fallback;
  }
  if (typeof detail === "object") {
    if (typeof detail.message === "string") return detail.message;
    if (typeof detail.msg === "string") return detail.msg;
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  return String(detail);
}

/**
 * Mensaje útil cuando fetch falla por red (backend apagado, CORS, sin conexión).
 */
export function friendlyFetchError(err, apiBase = "") {
  const msg = (err && err.message) || "";
  const isNetwork =
    msg === "Failed to fetch" ||
    msg.includes("NetworkError") ||
    msg.includes("Load failed") ||
    err?.name === "TypeError";
  if (isNetwork) {
    const base = apiBase || "http://localhost:8000";
    const isProdApi = /api\.guiaa\.vet/i.test(base);
    const onLocal =
      typeof window !== "undefined" &&
      /^(localhost|127\.0\.0\.1|192\.168\.)/i.test(window.location.hostname);

    if (onLocal && isProdApi) {
      return (
        `No se pudo conectar con ${base}. En desarrollo local usa el backend en ` +
        `http://localhost:8000. Recarga la página (Ctrl+Shift+R) o ejecuta en la consola: ` +
        `localStorage.removeItem('backend_url'); location.reload();`
      );
    }

    if (isProdApi) {
      return (
        `No se pudo conectar con el servidor (${base}). ` +
        `Comprueba tu conexión o abre https://api.guiaa.vet/docs en otra pestaña. ` +
        `Si la API responde, prueba en ventana de incógnito o limpia la caché del navegador.`
      );
    }

    return `No se pudo conectar con el servidor (${base}). Si trabajas en local, inicia el backend: en la carpeta backend ejecuta «python server_simple.py» y deja ese proceso en marcha.`;
  }
  return msg || "Error de red o del servidor";
}
