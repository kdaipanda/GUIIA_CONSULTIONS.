import { fetchClinicRegistry } from "./clinicApi";

const memory = new Map();

export function readClinicRegistryCache(veterinarianId) {
  if (!veterinarianId) return null;
  return memory.get(veterinarianId)?.data ?? null;
}

export function writeClinicRegistryCache(veterinarianId, data) {
  if (!veterinarianId || !data) return;
  memory.set(veterinarianId, { data, at: Date.now() });
}

export function invalidateClinicRegistryCache(veterinarianId) {
  if (!veterinarianId) return;
  memory.delete(veterinarianId);
}

/**
 * Carga dueños + mascotas. Si hay caché, la devuelve al instante y refresca en segundo plano.
 */
export async function loadClinicRegistry(veterinarianId, { force = false } = {}) {
  if (!veterinarianId) {
    return { clients: [], patients: [] };
  }

  const cached = readClinicRegistryCache(veterinarianId);
  if (cached && !force) {
    void fetchClinicRegistry(veterinarianId)
      .then((fresh) => writeClinicRegistryCache(veterinarianId, fresh))
      .catch(() => {});
    return cached;
  }

  const data = await fetchClinicRegistry(veterinarianId);
  writeClinicRegistryCache(veterinarianId, data);
  return data;
}

export function prefetchClinicRegistry(veterinarianId) {
  if (!veterinarianId) return;
  if (readClinicRegistryCache(veterinarianId)) return;
  void loadClinicRegistry(veterinarianId).catch(() => {});
}

export function prefetchClientsPatientsPage() {
  void import("../pages/clinic/ClientsPatientsPage");
}

// Re-export para compatibilidad
export { prefetchClinicRouteChunks, warmClinicAppData } from "./prefetchClinicApp";
