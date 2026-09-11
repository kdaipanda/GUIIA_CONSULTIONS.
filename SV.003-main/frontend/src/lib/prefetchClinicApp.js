import { prefetchClinicRegistry } from "./clinicRegistryCache";
import { loadClinicData, clinicCacheKey } from "./clinicDataCache";
import {
  fetchDashboardOverview,
  fetchInventorySummary,
  fetchAppointmentRequests,
  fetchOrganization,
} from "./clinicApi";
import { loadMembershipCatalog } from "./membershipCatalogCache";

const CLINIC_ROUTE_CHUNKS = [
  () => import("../pages/clinic/ClinicDashboardPage"),
  () => import("../pages/clinic/ClientsPatientsPage"),
  () => import("../pages/clinic/AgendaPage"),
  () => import("../pages/clinic/InventoryPage"),
  () => import("../pages/clinic/BillingPage"),
  () => import("../pages/clinic/ReportsPage"),
  () => import("../pages/clinic/SettingsPage"),
  () => import("../pages/clinic/AdminPage"),
  () => import("../pages/ConsultationHistoryPage"),
  () => import("../pages/MedicalImagesPage"),
  () => import("../pages/MembershipPage"),
  () => import("../pages/ProfilePage"),
];

let chunksPrefetched = false;

export function prefetchClinicRouteChunks() {
  if (chunksPrefetched) return;
  chunksPrefetched = true;
  CLINIC_ROUTE_CHUNKS.forEach((load) => {
    void load();
  });
}

/** Precarga datos y chunks usados en la mayoría de secciones clínicas. */
export function warmClinicAppData(veterinarianId, { platformAdmin = false } = {}) {
  if (!veterinarianId) return;

  prefetchClinicRouteChunks();
  prefetchClinicRegistry(veterinarianId);

  void loadClinicData(
    clinicCacheKey(veterinarianId, "organization"),
    () => fetchOrganization(veterinarianId),
    { ttlMs: 120_000 },
  ).catch(() => {});

  void loadClinicData(
    clinicCacheKey(veterinarianId, "dashboard"),
    () => fetchDashboardOverview(veterinarianId),
    { ttlMs: 90_000 },
  ).catch(() => {});

  void loadClinicData(
    clinicCacheKey(veterinarianId, "inventory-summary"),
    () => fetchInventorySummary(veterinarianId),
    { ttlMs: 60_000 },
  ).catch(() => {});

  void loadClinicData(
    clinicCacheKey(veterinarianId, "appointment-requests", "pending"),
    () => fetchAppointmentRequests(veterinarianId, "pending"),
    { ttlMs: 45_000 },
  ).catch(() => {});

  void loadMembershipCatalog().catch(() => {});

  if (platformAdmin) {
    void import("../pages/clinic/AdminPage");
  }
}

/** @deprecated Usar warmClinicAppData */
export function prefetchClientsPatientsPage() {
  void import("../pages/clinic/ClientsPatientsPage");
}
