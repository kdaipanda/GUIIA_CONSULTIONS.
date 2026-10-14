import { getAuthHeaders, persistAuthFromResponse } from "./authHeaders";
import { getBackendUrl } from "./backendUrl";

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.detail || data?.message || response.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export async function registerPetOwner(body) {
  const response = await fetch(`${getBackendUrl()}/api/owner/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson(response);
  return persistAuthFromResponse(data);
}

export async function fetchOwnerMe(ownerId) {
  const response = await fetch(`${getBackendUrl()}/api/owner/me`, {
    headers: getAuthHeaders(ownerId),
  });
  return parseJson(response);
}

export async function fetchOwnerPackages() {
  const response = await fetch(`${getBackendUrl()}/api/owner/packages`);
  return parseJson(response);
}

export async function createOwnerCheckout(ownerId, originUrl, packageId = "owner_single_consultation") {
  const response = await fetch(`${getBackendUrl()}/api/owner/payments/checkout/session`, {
    method: "POST",
    headers: getAuthHeaders(ownerId),
    body: JSON.stringify({ origin_url: originUrl, package_id: packageId }),
  });
  return parseJson(response);
}

export async function fetchOwnerCheckoutStatus(ownerId, sessionId) {
  const response = await fetch(
    `${getBackendUrl()}/api/owner/payments/checkout/status/${encodeURIComponent(sessionId)}`,
    { headers: getAuthHeaders(ownerId) },
  );
  return parseJson(response);
}

export async function createOwnerConsultation(ownerId, body) {
  const response = await fetch(`${getBackendUrl()}/api/owner/consultations`, {
    method: "POST",
    headers: getAuthHeaders(ownerId),
    body: JSON.stringify(body),
  });
  return parseJson(response);
}

export async function analyzeOwnerConsultation(ownerId, consultationId) {
  const response = await fetch(
    `${getBackendUrl()}/api/owner/consultations/${encodeURIComponent(consultationId)}/analyze`,
    {
      method: "POST",
      headers: getAuthHeaders(ownerId),
    },
  );
  return parseJson(response);
}

export async function fetchOwnerConsultations(ownerId) {
  const response = await fetch(`${getBackendUrl()}/api/owner/consultations`, {
    headers: getAuthHeaders(ownerId),
  });
  return parseJson(response);
}

export async function fetchOwnerConsultation(ownerId, consultationId) {
  const response = await fetch(
    `${getBackendUrl()}/api/owner/consultations/${encodeURIComponent(consultationId)}`,
    { headers: getAuthHeaders(ownerId) },
  );
  return parseJson(response);
}

export function isPetOwnerProfile(profile) {
  return (profile?.account_kind || "").trim().toLowerCase() === "pet_owner";
}

/** Dueño B2C o tester interno (Carlos / platform admin) para /consulta. */
export function canAccessOwnerConsulta(profile) {
  if (!profile) return false;
  if (isPetOwnerProfile(profile)) return true;
  if (profile.owner_unlimited === true || profile.platform_admin === true) return true;
  const email = String(profile.email || "").trim().toLowerCase();
  return email === "carlos.hernandez@vetmed.com";
}
