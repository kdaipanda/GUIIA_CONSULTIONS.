import i18n from "../i18n";

function te(key, options) {
  return i18n.t(`errors.${key}`, { ns: "common", ...options });
}

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
 * Mensaje localizado para errores típicos de Supabase/PostgreSQL.
 */
export function friendlyDatabaseError(detail, fallback) {
  const resolvedFallback = fallback || te("dbFallback");
  const normalized = parseLooseErrorObject(detail);
  const text = formatApiErrorDetail(normalized, resolvedFallback).toLowerCase();

  if (
    text.includes("pgrst204") ||
    (text.includes("column") && text.includes("does not exist")) ||
    text.includes("schema cache")
  ) {
    return te("dbMigration");
  }
  if (text.includes("permission denied") || text.includes("row-level security") || text.includes("rls")) {
    return te("dbPermission");
  }
  if (text.includes("invalid input syntax for type uuid")) {
    return te("dbInvalidUuid");
  }
  if (text.includes("duplicate key") || text.includes("already exists")) {
    return te("dbDuplicate");
  }
  if (text.includes("connection") || text.includes("timeout") || text.includes("could not connect")) {
    return te("dbConnection");
  }

  return formatApiErrorDetail(normalized, resolvedFallback);
}

export function formatApiErrorDetail(detail, fallback) {
  const resolvedFallback = fallback || te("server");
  const parsed = parseLooseErrorObject(detail);
  if (parsed == null || parsed === "") return resolvedFallback;
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
    return parts.length ? parts.join(" · ") : resolvedFallback;
  }
  if (typeof parsed === "object") {
    if (typeof parsed.message === "string") return parsed.message;
    if (typeof parsed.msg === "string") return parsed.msg;
    if (typeof parsed.details === "string" && parsed.details) return parsed.details;
    if (typeof parsed.hint === "string" && parsed.hint) return parsed.hint;
    try {
      return JSON.stringify(parsed);
    } catch {
      return resolvedFallback;
    }
  }
  return String(parsed);
}

/**
 * Mensaje útil cuando fetch falla por red (backend apagado, CORS, sin conexión).
 */
export function friendlyFetchError(err, apiBase = "") {
  const status =
    typeof err === "number"
      ? err
      : err?.status ?? err?.statusCode ?? (typeof err?.ok === "boolean" && !err.ok ? err.status : null);

  if (status === 502 || status === 503 || status === 504) {
    return te("gatewayTimeout");
  }

  const msg = (err && err.message) || "";
  if (
    msg.includes("Unexpected end of JSON input") ||
    msg.includes("Unexpected token") ||
    msg.includes("is not valid JSON")
  ) {
    return te("invalidJsonShort");
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
      return te("networkLocalProd", { base });
    }

    if (isProdApi) {
      return te("networkProd", { base });
    }

    return te("networkLocal", { base });
  }
  return msg || te("networkGeneric");
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
    throw new Error(te("invalidJson"));
  }
}
