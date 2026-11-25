const TOKEN_KEY = "guiaa_access_token";
const FLOW_NONCE_KEY = "guiaa_cedula_flow_nonce";

export function storeAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function storeCedulaFlowNonce(nonce) {
  if (nonce) {
    localStorage.setItem(FLOW_NONCE_KEY, nonce);
  }
}

export function getCedulaFlowNonce() {
  return localStorage.getItem(FLOW_NONCE_KEY) || "";
}

export function clearCedulaFlowNonce() {
  localStorage.removeItem(FLOW_NONCE_KEY);
}

/**
 * Cabeceras de autenticación para la API.
 * Por defecto incluye Content-Type: application/json (requerido por FastAPI).
 * Para FormData/multipart: getAuthHeaders(vetId, { skipContentType: true })
 */
export function getAuthHeaders(veterinarianId, extra = {}) {
  const { skipContentType, ...headerFields } = extra;
  const headers = { ...headerFields };
  const token = getAccessToken();
  const flowNonce = getCedulaFlowNonce();
  // Flujo cédula: nunca mezclar Bearer viejo con nonce (bloqueaba /api/cedula/skip).
  if (flowNonce) {
    headers["x-cedula-flow-nonce"] = flowNonce;
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (veterinarianId) {
    headers["x-veterinarian-id"] = veterinarianId;
  }
  if (!headers["Content-Type"] && !skipContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export function persistAuthFromResponse(data) {
  if (!data || typeof data !== "object") return data;
  const {
    access_token,
    token_type,
    expires_in,
    cedula_flow_nonce,
    cedula_flow_expires_in,
    ...profile
  } = data;
  // Mutuamente excluyentes: sesión normal vs. flujo de cédula.
  if (cedula_flow_nonce) {
    storeCedulaFlowNonce(cedula_flow_nonce);
    clearAccessToken();
  } else if (access_token) {
    storeAccessToken(access_token);
    clearCedulaFlowNonce();
  }
  const hasProfileFields =
    profile.id || profile.email || profile.veterinarian_id || profile.status;
  return hasProfileFields ? profile : data;
}
