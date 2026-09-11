import { BACKEND_URL } from "./backendUrl";
import { loadClinicData, readClinicDataCache } from "./clinicDataCache";
import {
  DEFAULT_PACKAGES,
  parseMembershipCatalogResponse,
} from "./membershipPlans";

const CATALOG_KEY = "membership-catalog";

export function readMembershipCatalogCache() {
  const data = readClinicDataCache(CATALOG_KEY);
  return data?.packages || null;
}

export async function loadMembershipCatalog({ force = false } = {}) {
  const data = await loadClinicData(
    CATALOG_KEY,
    async () => {
      const response = await fetch(`${BACKEND_URL}/api/membership/packages`);
      if (!response.ok) throw new Error("membership catalog");
      const json = await response.json();
      return parseMembershipCatalogResponse(json);
    },
    { force, ttlMs: 300_000 },
  );
  return data?.packages || DEFAULT_PACKAGES;
}
