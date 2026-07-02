/**
 * Convierte `detail` de FastAPI (string, array de validación u objeto) en texto legible.
 */
function parseLooseErrorObject(detail) {
  if (detail == null || typeof detail !== "string") return detail;
  const trimmed = detail.trim();
  if (!trimmed.startsWith("{") && !trimmed.includes("message")) return detail;
  try {
    const jsonish = trimmed
      .replace(/'/g, '"')
      .replace(/\bNone\b/g, "null")
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false");
    return JSON.parse(jsonish);
  } catch {
    return detail;
  }
}

/**
 * Mensaje en español para errores típicos de Supabase/PostgreSQL.
 */
export function friendlyDatabaseError(detail, fallback = "Error al guardar en la base de datos") {
  const normalized = parseLooseErrorObject(detail);
  const text = formatApiErrorDetail(normalized, fallback).toLowerCase();

  if (
    text.includes("pgrst204") ||
    (text.includes("column") && text.includes("does not exist")) ||
    text.includes("schema cache")
  ) {
    return "Falta una actualización en la base de datos (columna no encontrada). Avísanos para aplicar la migración en Supabase.";
  }
  if (text.includes("permission denied") || text.includes("row-level security") || text.includes("rls")) {
    return "No se pudo guardar: permiso denegado. Cierra sesión, vuelve a entrar e intenta de nuevo.";
  }
  if (text.includes("invalid input syntax for type uuid")) {
    return "Identificador de consulta inválido. Abre la consulta desde el historial o crea una nueva.";
  }
  if (text.includes("duplicate key") || text.includes("already exists")) {
    return "Este registro ya existe. Recarga la página e intenta de nuevo.";
  }
  if (text.includes("connection") || text.includes("timeout") || text.includes("could not connect")) {
    return "No se pudo conectar con la base de datos. Intenta de nuevo en unos segundos.";
  }

  return formatApiErrorDetail(normalized, fallback);
}

export function formatApiErrorDetail(detail, fallback = "Error del servidor") {
  const parsed = parseLooseErrorObject(detail);
  if (parsed == null || parsed === "") return fallback;
  if (typeof parsed === "string") return parsed;
  if (Array.isArray(parsed)) {
    const parts = parsed
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
  if (typeof parsed === "object") {
    if (typeof parsed.message === "string") return parsed.message;
    if (typeof parsed.msg === "string") return parsed.msg;
    if (typeof parsed.details === "string" && parsed.details) return parsed.details;
    if (typeof parsed.hint === "string" && parsed.hint) return parsed.hint;
    try {
      return JSON.stringify(parsed);
    } catch {
      return fallback;
    }
  }
  return String(parsed);
}

/**
 * Mensaje útil cuando fetch falla por red (backend apagado, CORS, sin conexión).
 * Acepta Error, Response de fetch o un código HTTP numérico.
 */
export function friendlyFetchError(err, apiBase = "") {
  const status =
    typeof err === "number"
      ? err
      : err?.status ?? err?.statusCode ?? (typeof err?.ok === "boolean" && !err.ok ? err.status : null);

  if (status === 502 || status === 503 || status === 504) {
    return (
      "El servidor no respondió a tiempo (error 502/503). Suele ocurrir cuando la API se está reiniciando. " +
      "Espera 10–20 segundos y vuelve a intentar."
    );
  }

  const msg = (err && err.message) || "";
  if (
    msg.includes("Unexpected end of JSON input") ||
    msg.includes("Unexpected token") ||
    msg.includes("is not valid JSON")
  ) {
    return "El servidor no devolvió datos válidos. Espera unos segundos e intenta de nuevo.";
  }

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

/**
 * Lee el cuerpo de una Response como JSON sin lanzar errores crípticos del navegador.
 */
export async function parseJsonResponse(response, emptyFallback = {}) {
  const text = await response.text();
  if (!text.trim()) {
    return emptyFallback;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "El servidor devolvió una respuesta inválida. Suele ocurrir cuando la API se reinicia; espera unos segundos e intenta de nuevo.",
    );
  }
}
