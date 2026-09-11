import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { getBackendUrl } from "../lib/backendUrl";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { parseJsonResponse } from "../lib/friendlyFetchError";
import {
  getAuthHeaders,
  clearAccessToken,
  clearCedulaFlowNonce,
  persistAuthFromResponse,
  getAccessToken,
} from "../lib/authHeaders";

const DEV_AUTO_LOGIN = false;

const VetContext = createContext();

export const useVet = () => {
  const context = useContext(VetContext);
  if (!context) {
    throw new Error("useVet must be used within a VetProvider");
  }
  return context;
};

function buildSupabaseVetStub(user) {
  return {
    id: user.id,
    nombre: user.email?.split("@")[0] || "usuario",
    email: user.email,
    membership_type: "basic",
  };
}

/** No pisar sesión GUIAA (JWT + perfil real) con un stub de Supabase Auth. */
function shouldKeepExistingProfile(prev, user) {
  if (!prev?.id) return false;
  if (getAccessToken()) return true;
  if (prev.membership_type && prev.membership_type !== "basic") return true;
  if (prev.membership_source === "organization") return true;
  if (prev.cedula_profesional || prev.consultations_remaining != null) return true;
  if (user && prev.id === user.id && (prev.nombre || prev.especialidad)) return true;
  return false;
}

export const VetProvider = ({ children }) => {
  const [veterinarian, setVeterinarian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const profileSyncedRef = useRef(false);

  useEffect(() => {
    const storedVet = localStorage.getItem("veterinarian");
    if (storedVet) {
      try {
        const parsedVet = JSON.parse(storedVet);
        const isLegacyDevStub = parsedVet?.id === "dev-carlos-hernandez";
        if (isLegacyDevStub) {
          localStorage.removeItem("veterinarian");
        } else {
          setVeterinarian(parsedVet);
        }
      } catch {
        localStorage.removeItem("veterinarian");
      }
    } else if (DEV_AUTO_LOGIN) {
      const devVet = {
        id: "dev-carlos-hernandez",
        nombre: "Carlos Hernandez",
        email: "carlos.hernandez@vetmed.com",
        telefono: "5555555555",
        cedula_profesional: "87654321",
        especialidad: "Medicina General",
        años_experiencia: 5,
        institucion: "UNAM",
        membership_type: "premium",
        consultations_remaining: 150,
        membership_expires: new Date("2099-12-31").toISOString(),
      };
      setVeterinarian(devVet);
      localStorage.setItem("veterinarian", JSON.stringify(devVet));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user;
      if (sessionUser) {
        setAuthUser(sessionUser);
        setVeterinarian((prev) => {
          if (shouldKeepExistingProfile(prev, sessionUser)) return prev;
          const stub = buildSupabaseVetStub(sessionUser);
          localStorage.setItem("veterinarian", JSON.stringify(stub));
          return stub;
        });
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user || null;
        setAuthUser(user);
        if (user) {
          setVeterinarian((prev) => {
            if (shouldKeepExistingProfile(prev, user)) return prev;
            const stub = buildSupabaseVetStub(user);
            localStorage.setItem("veterinarian", JSON.stringify(stub));
            return stub;
          });
        } else if (event === "SIGNED_OUT" && !getAccessToken()) {
          setVeterinarian(null);
          localStorage.removeItem("veterinarian");
          clearAccessToken();
        }
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!veterinarian?.id) return null;

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/profile`, {
        headers: getAuthHeaders(veterinarian.id),
      });

      if (response.ok) {
        const updatedProfile = await parseJsonResponse(response, null);
        if (updatedProfile) {
          setVeterinarian(updatedProfile);
          localStorage.setItem("veterinarian", JSON.stringify(updatedProfile));
        }
        return updatedProfile;
      }

      // Token viejo/inválido: forzar re-login (evita encuesta trial fantasma).
      if (response.status === 401) {
        clearAccessToken();
        clearCedulaFlowNonce();
        setVeterinarian(null);
        localStorage.removeItem("veterinarian");
        profileSyncedRef.current = false;
        setPlatformAdmin(false);
      }
    } catch (error) {
      console.error("Error refrescando perfil:", error);
    }
    return null;
  }, [veterinarian?.id]);

  // Tras login o al recargar: sincronizar plan/cupo heredado del consultorio.
  useEffect(() => {
    if (profileSyncedRef.current || !veterinarian?.id || !getAccessToken()) return;
    profileSyncedRef.current = true;
    void refreshProfile();
  }, [veterinarian?.id, refreshProfile]);

  useEffect(() => {
    if (!veterinarian?.id || !getAccessToken()) {
      setPlatformAdmin(false);
      return;
    }
    const backendUrl = getBackendUrl();
    fetchWithTimeout(
      `${backendUrl}/api/admin/access`,
      { headers: getAuthHeaders(veterinarian.id) },
      { timeoutMs: 20000, retries: 2 },
    )
      .then(async (response) => {
        if (!response.ok) return { platform_admin: false };
        return parseJsonResponse(response, { platform_admin: false });
      })
      .then((data) => setPlatformAdmin(!!data.platform_admin))
      .catch(() => setPlatformAdmin(false));
  }, [veterinarian?.id]);

  const login = useCallback((vetData) => {
    persistAuthFromResponse(vetData);
    const { access_token, token_type, expires_in, cedula_flow_nonce, cedula_flow_expires_in, ...profile } =
      vetData || {};
    const nextProfile = profile.id || profile.email ? profile : vetData;
    setVeterinarian(nextProfile);
    localStorage.setItem("veterinarian", JSON.stringify(nextProfile));
    profileSyncedRef.current = true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setVeterinarian(null);
    localStorage.removeItem("veterinarian");
    clearAccessToken();
    clearCedulaFlowNonce();
    profileSyncedRef.current = false;
    setPlatformAdmin(false);
  }, []);

  const loginWithEmailPassword = async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data?.user;
  };

  const loginWithMagicLink = async (email) => {
    const { error, data } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
    return data;
  };

  const patchVeterinarian = useCallback((partial) => {
    if (!partial || typeof partial !== "object") return;
    setVeterinarian((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      localStorage.setItem("veterinarian", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <VetContext.Provider
      value={{
        veterinarian,
        login,
        logout,
        loading,
        authUser,
        platformAdmin,
        loginWithEmailPassword,
        loginWithMagicLink,
        refreshProfile,
        patchVeterinarian,
      }}
    >
      {children}
    </VetContext.Provider>
  );
};
