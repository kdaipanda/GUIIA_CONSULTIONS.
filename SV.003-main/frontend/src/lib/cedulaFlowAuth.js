import { BACKEND_URL } from "./backendUrl";
import { getAccessToken, getAuthHeaders, persistAuthFromResponse } from "./authHeaders";
import { formatApiErrorDetail } from "./friendlyFetchError";

/**
 * Entra a la app tras el flujo de cédula: reutiliza JWT si existe,
 * acepta tokens del verify/skip, o hace login con contraseña / matrícula legacy.
 */
export async function finalizeCedulaFlowEntry({
  email,
  cedula_profesional,
  veterinarian_id,
  login_password,
  authPayload,
}) {
  if (authPayload?.access_token) {
    const profile = persistAuthFromResponse(authPayload);
    return {
      ...profile,
      access_token: authPayload.access_token,
      token_type: authPayload.token_type || "bearer",
      id: authPayload.id || profile?.id || veterinarian_id,
      email: authPayload.email || profile?.email || email,
      nombre: authPayload.nombre || profile?.nombre,
    };
  }

  const token = getAccessToken();
  if (token && veterinarian_id) {
    const profileResp = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      headers: getAuthHeaders(veterinarian_id),
    });
    if (profileResp.ok) {
      const profile = await profileResp.json();
      return {
        ...profile,
        access_token: token,
        token_type: "bearer",
      };
    }
  }

  const loginBody = login_password
    ? { email, password: login_password }
    : { email, cedula_profesional };

  const resp = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginBody),
  });

  if (!resp.ok) {
    const raw = await resp.json().catch(() => ({}));
    throw new Error(
      formatApiErrorDetail(raw.detail, "Error iniciando sesión tras verificación"),
    );
  }

  return resp.json();
}
