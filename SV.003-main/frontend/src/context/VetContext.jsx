import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { getBackendUrl } from "../lib/backendUrl";
import { getAuthHeaders, storeAccessToken, clearAccessToken } from "../lib/authHeaders";

const DEV_AUTO_LOGIN = false;

const VetContext = createContext();

export const useVet = () => {
  const context = useContext(VetContext);
  if (!context) {
    throw new Error("useVet must be used within a VetProvider");
  }
  return context;
};

export const VetProvider = ({ children }) => {
  const [veterinarian, setVeterinarian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [platformAdmin, setPlatformAdmin] = useState(false);

  useEffect(() => {
    const storedVet = localStorage.getItem("veterinarian");
    if (storedVet) {
      try {
        const parsedVet = JSON.parse(storedVet);
        const isDevCarlos =
          parsedVet?.id === "dev-carlos-hernandez" ||
          parsedVet?.email === "carlos.hernandez@vetmed.com";
        if (isDevCarlos) {
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
        const vetFromSupabase = {
          id: sessionUser.id,
          nombre: sessionUser.email?.split("@")[0] || "usuario",
          email: sessionUser.email,
          membership_type: "basic",
        };
        setAuthUser(sessionUser);
        setVeterinarian((prev) => prev || vetFromSupabase);
        localStorage.setItem("veterinarian", JSON.stringify(vetFromSupabase));
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user || null;
        setAuthUser(user);
        if (user) {
          const vetFromSupabase = {
            id: user.id,
            nombre: user.email?.split("@")[0] || "usuario",
            email: user.email,
            membership_type: "basic",
          };
          setVeterinarian(vetFromSupabase);
          localStorage.setItem("veterinarian", JSON.stringify(vetFromSupabase));
        } else {
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
    if (!veterinarian?.id) {
      setPlatformAdmin(false);
      return;
    }
    const backendUrl = getBackendUrl();
    fetch(`${backendUrl}/api/admin/access`, {
      headers: getAuthHeaders(veterinarian.id),
    })
      .then((response) => (response.ok ? response.json() : { platform_admin: false }))
      .then((data) => setPlatformAdmin(!!data.platform_admin))
      .catch(() => setPlatformAdmin(false));
  }, [veterinarian?.id]);

  const login = (vetData) => {
    const { access_token, token_type, expires_in, ...profile } = vetData || {};
    if (access_token) {
      storeAccessToken(access_token);
    }
    const nextProfile = profile.id || profile.email ? profile : vetData;
    setVeterinarian(nextProfile);
    localStorage.setItem("veterinarian", JSON.stringify(nextProfile));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setVeterinarian(null);
    localStorage.removeItem("veterinarian");
    clearAccessToken();
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

  const refreshProfile = async () => {
    if (!veterinarian?.id) return;

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/profile`, {
        headers: getAuthHeaders(veterinarian.id),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setVeterinarian(updatedProfile);
        localStorage.setItem("veterinarian", JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error("Error refrescando perfil:", error);
    }
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
      }}
    >
      {children}
    </VetContext.Provider>
  );
};
