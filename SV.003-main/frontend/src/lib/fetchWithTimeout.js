/**
 * fetch con timeout y reintento opcional en 502/503/504 (arranque en frío del backend).
 */
export async function fetchWithTimeout(url, options = {}, config = {}) {
  const {
    timeoutMs = 30000,
    retries = 0,
    retryStatuses = [502, 503, 504],
    retryDelayMs = 1200,
  } = config;

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (
        attempt < retries &&
        retryStatuses.includes(response.status)
      ) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err;
      const aborted = err?.name === "AbortError";
      if (aborted) {
        throw new Error(
          "La solicitud tardó demasiado. El servidor puede estar iniciando; espera unos segundos e intenta de nuevo.",
        );
      }
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error("No se pudo completar la solicitud");
}

/**
 * POST/GET JSON con reintentos si el cuerpo viene vacío o la API responde 502/503/504.
 */
export async function fetchJsonWithRetry(url, options = {}, config = {}) {
  const { formatApiErrorDetail, friendlyFetchError } = await import("./friendlyFetchError");
  const {
    timeoutMs = 45000,
    retries = 2,
    retryDelayMs = 1500,
  } = config;

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    try {
      const response = await fetchWithTimeout(url, options, {
        timeoutMs,
        retries: 2,
        retryDelayMs,
      });
      const text = await response.text();

      if (!response.ok) {
        let detail = null;
        if (text.trim()) {
          try {
            detail = JSON.parse(text)?.detail;
          } catch {
            /* ignore */
          }
        }
        lastError = new Error(
          formatApiErrorDetail(detail, friendlyFetchError(response.status, url)) ||
            `Error del servidor: ${response.status}`,
        );
        if (attempt < retries && [502, 503, 504].includes(response.status)) {
          continue;
        }
        throw lastError;
      }

      if (!text.trim()) {
        lastError = new Error(
          "El servidor no devolvió datos. Espera unos segundos e intenta de nuevo.",
        );
        if (attempt < retries) continue;
        throw lastError;
      }

      try {
        return JSON.parse(text);
      } catch {
        lastError = new Error(
          "El servidor devolvió una respuesta inválida. Intenta de nuevo en unos segundos.",
        );
        if (attempt < retries) continue;
        throw lastError;
      }
    } catch (err) {
      lastError = err;
      if (attempt < retries) continue;
      throw err;
    }
  }

  throw lastError || new Error("No se pudo completar la solicitud");
}
