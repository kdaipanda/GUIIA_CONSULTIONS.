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
    return `No se pudo conectar con el servidor (${base}). Si trabajas en local, inicia el backend: en la carpeta backend ejecuta «python server_simple.py» y deja ese proceso en marcha.`;
  }
  return msg || "Error de red o del servidor";
}
