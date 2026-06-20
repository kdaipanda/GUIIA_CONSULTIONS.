import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useVet } from "./VetContext";
import { fetchOrganization } from "../lib/clinicApi";

const ClinicContext = createContext(null);

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) {
    throw new Error("useClinic must be used within ClinicProvider");
  }
  return ctx;
}

export function ClinicProvider({ children }) {
  const { veterinarian } = useVet();
  const [organization, setOrganization] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrganization = useCallback(async () => {
    if (!veterinarian?.id) {
      setOrganization(null);
      setMembership(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchOrganization(veterinarian.id);
      setOrganization(data.organization || null);
      setMembership(data.membership || null);
    } catch (err) {
      setError(err.message || "No se pudo cargar la organización");
      setOrganization(null);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  return (
    <ClinicContext.Provider
      value={{
        organization,
        membership,
        role: membership?.role || null,
        loading,
        error,
        reloadOrganization: loadOrganization,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}
