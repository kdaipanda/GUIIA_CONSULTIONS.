import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { getBackendUrl } from "../lib/backendUrl";
import { parseJsonResponse } from "../lib/friendlyFetchError";
import {
  getAuthHeaders,
  clearAccessToken,
  clearCedulaFlowNonce,
  persistAuthFromResponse,
  getAccessToken,
} from "../lib/authHeaders";
import { fetchAdminAccess } from "../lib/clinicApi";
import { isPlatformAdminEmail } from "../lib/platformAdmin";
import i18n from "../i18n";

const DEV_AUTO_LOGIN = false;

const VetContext = createContext();

export const useVet = () => {
  const context = useContext(VetContext);
  if (!context) {
    throw new Error(i18n.t("errors.vetContext", { ns: "common" }));
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
  const [veterinarian, setVeterinarian] = useState(() => {
    try {
      const storedVet = localStorage.getItem("veterinarian");
      if (!storedVet) return null;
      const parsedVet = JSON.parse(storedVet);
      if (parsedVet?.id === "dev-carlos-hernandez") {
        localStorage.removeItem("veterinarian");
        return null;
      }
      return parsedVet;
    } catch {
      localStorage.removeItem("veterinarian");
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const profileSyncedRef = useRef(false);

  const refreshProfile = useCallback(async () => {
    if (!veterinarian?.id) return;

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
          const isCarlos = isPlatformAdminEmail(updatedProfile.email);
          if (typeof updatedProfile.platform_admin === "boolean") {
            setPlatformAdmin(isCarlos && updatedProfile.platform_admin);
          } else {
            setPlatformAdmin(isCarlos);
          }
        }
        return;
      }

      // Token viejo/inválido: forzar re-login en lugar de dejar estado trial fantasma.
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
  }, [veterinarian?.id]);

  useEffect(() => {
    if (DEV_AUTO_LOGIN && !veterinarian) {
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
  }, [veterinarian]);

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

  useEffect(() => {
    if (profileSyncedRef.current || !veterinarian?.id || !getAccessToken()) return;
    profileSyncedRef.current = true;
    void refreshProfile();
  }, [veterinarian?.id, refreshProfile]);

  useEffect(() => {
    if (!veterinarian?.id) {
      setPlatformAdmin(false);
      return;
    }

    // Admin GUIAA: solo carlos.hernandez@vetmed.com
    const isCarlos = isPlatformAdminEmail(veterinarian.email);
    if (!isCarlos) {
      setPlatformAdmin(false);
      return;
    }

    setPlatformAdmin(true);

    let cancelled = false;
    let retryTimer = null;
    let stopTimer = null;

    const resolveAccess = () => {
      fetchAdminAccess(veterinarian.id)
        .then((data) => {
          if (!cancelled) {
            setPlatformAdmin(isPlatformAdminEmail(veterinarian.email) && !!data.platform_admin);
          }
        })
        .catch(() => {
          /* Mantener visible para Carlos si la red falla; AdminPage revalida. */
        });
    };

    if (getAccessToken()) {
      resolveAccess();
    } else {
      retryTimer = window.setInterval(() => {
        if (!getAccessToken()) return;
        window.clearInterval(retryTimer);
        retryTimer = null;
        resolveAccess();
      }, 400);
      stopTimer = window.setTimeout(() => {
        if (retryTimer) window.clearInterval(retryTimer);
      }, 12000);
    }

    return () => {
      cancelled = true;
      if (retryTimer) window.clearInterval(retryTimer);
      if (stopTimer) window.clearTimeout(stopTimer);
    };
  }, [veterinarian?.id, veterinarian?.email, authUser?.id]);

  const login = (vetData) => {
    persistAuthFromResponse(vetData);
    const {
      access_token,
      token_type,
      expires_in,
      cedula_flow_nonce,
      cedula_flow_expires_in,
      ...profile
    } = vetData || {};
    const nextProfile = profile.id || profile.email ? profile : vetData;
    setVeterinarian(nextProfile);
    localStorage.setItem("veterinarian", JSON.stringify(nextProfile));
    profileSyncedRef.current = true;
    const isCarlos = isPlatformAdminEmail(nextProfile.email);
    if (!isCarlos) {
      setPlatformAdmin(false);
    } else if (typeof nextProfile.platform_admin === "boolean") {
      setPlatformAdmin(nextProfile.platform_admin);
    } else {
      setPlatformAdmin(true);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setVeterinarian(null);
    localStorage.removeItem("veterinarian");
    clearAccessToken();
    clearCedulaFlowNonce();
    profileSyncedRef.current = false;
    setPlatformAdmin(false);
  };

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

  const patchVeterinarian = (partial) => {
    if (!partial || typeof partial !== "object") return;
    setVeterinarian((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      localStorage.setItem("veterinarian", JSON.stringify(next));
      return next;
    });
  };

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
