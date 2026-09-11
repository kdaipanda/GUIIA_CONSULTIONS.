const store = new Map();
const inFlight = new Map();

const DEFAULT_TTL_MS = 90_000;

export function readClinicDataCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > entry.ttl) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function writeClinicDataCache(key, data, ttlMs = DEFAULT_TTL_MS) {
  if (!key) return;
  store.set(key, { data, at: Date.now(), ttl: ttlMs });
}

export function invalidateClinicDataCache(key) {
  if (!key) return;
  if (key.endsWith(":")) {
    for (const k of store.keys()) {
      if (k.startsWith(key)) store.delete(k);
    }
    return;
  }
  store.delete(key);
}

async function fetchDeduped(key, fetcher, ttlMs) {
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      writeClinicDataCache(key, data, ttlMs);
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, promise);
  return promise;
}

/**
 * Devuelve caché al instante si existe; siempre revalida en segundo plano salvo force.
 */
export async function loadClinicData(key, fetcher, { force = false, ttlMs = DEFAULT_TTL_MS } = {}) {
  const cached = !force ? readClinicDataCache(key) : null;
  if (cached) {
    void fetchDeduped(key, fetcher, ttlMs).catch(() => {});
    return cached;
  }
  return fetchDeduped(key, fetcher, ttlMs);
}

export function clinicCacheKey(vetId, resource, extra = "") {
  return `${resource}:${vetId}${extra ? `:${extra}` : ""}`;
}
