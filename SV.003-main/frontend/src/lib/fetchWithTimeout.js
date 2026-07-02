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
