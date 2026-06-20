const TOKEN_KEY = "guiaa_access_token";

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

export function getAuthHeaders(veterinarianId, extra = {}) {
  const headers = { ...extra };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (veterinarianId) {
    headers["x-veterinarian-id"] = veterinarianId;
  }
  if (
    !headers["Content-Type"] &&
    extra.body !== undefined &&
    !(extra.body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export function persistAuthFromResponse(data) {
  if (!data || typeof data !== "object") return data;
  const { access_token, token_type, expires_in, ...profile } = data;
  if (access_token) {
    storeAccessToken(access_token);
  }
  const hasProfileFields =
    profile.id || profile.email || profile.veterinarian_id || profile.status;
  return hasProfileFields ? profile : data;
}
