import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useVet } from "./VetContext";
import { fetchOrganization } from "../lib/clinicApi";
import {
  clinicCacheKey,
  invalidateClinicDataCache,
  loadClinicData,
  readClinicDataCache,
} from "../lib/clinicDataCache";
import { notifyError } from "../lib/appToast";

const ClinicContext = createContext(null);

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) {
    throw new Error("useClinic must be used within ClinicProvider");
  }
  return ctx;
}

function readOrgBundle(vetId) {
  if (!vetId) return null;
  return readClinicDataCache(clinicCacheKey(vetId, "organization"));
}

export function ClinicProvider({ children }) {
  const { veterinarian } = useVet();
  const vetId = veterinarian?.id;

  const [organization, setOrganization] = useState(() => readOrgBundle(vetId)?.organization ?? null);
  const [members, setMembers] = useState(() => readOrgBundle(vetId)?.members ?? []);
  const [membership, setMembership] = useState(() => readOrgBundle(vetId)?.membership ?? null);
  const [loading, setLoading] = useState(() => Boolean(vetId && !readOrgBundle(vetId)));

  const applyOrgData = useCallback((data) => {
    setOrganization(data?.organization || null);
    setMembers(data?.members || []);
    setMembership(data?.membership || null);
  }, []);

  const loadOrganization = useCallback(
    async ({ force = false } = {}) => {
      if (!vetId) {
        setOrganization(null);
        setMembers([]);
        setMembership(null);
        setLoading(false);
        return;
      }

      const key = clinicCacheKey(vetId, "organization");
      const cached = !force ? readClinicDataCache(key) : null;
      if (cached) {
        applyOrgData(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const data = await loadClinicData(key, () => fetchOrganization(vetId), {
          force,
          ttlMs: 120_000,
        });
        applyOrgData(data);
      } catch (err) {
        if (!cached) {
          notifyError(err.message || "No se pudo cargar la organización");
          setOrganization(null);
          setMembers([]);
          setMembership(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [applyOrgData, vetId],
  );

  useEffect(() => {
    void loadOrganization();
  }, [loadOrganization]);

  const reloadOrganization = useCallback(async () => {
    if (vetId) invalidateClinicDataCache(clinicCacheKey(vetId, "organization"));
    await loadOrganization({ force: true });
  }, [loadOrganization, vetId]);

  return (
    <ClinicContext.Provider
      value={{
        organization,
        members,
        membership,
        role: membership?.role || null,
        loading,
        reloadOrganization,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}
