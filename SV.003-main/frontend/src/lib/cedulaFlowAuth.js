import { BACKEND_URL } from "./backendUrl";
import { getAccessToken, getAuthHeaders } from "./authHeaders";
import { formatApiErrorDetail } from "./friendlyFetchError";

/**
 * Entra a la app tras el flujo de cédula: reutiliza JWT si existe,
 * o hace login con contraseña / matrícula legacy.
 */
export async function finalizeCedulaFlowEntry({
  email,
  cedula_profesional,
  veterinarian_id,
  login_password,
}) {
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
