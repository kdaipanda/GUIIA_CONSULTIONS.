import { getBackendUrl } from "./backendUrl";
import { friendlyFetchError, formatApiErrorDetail, parseJsonResponse } from "./friendlyFetchError";
import { getAuthHeaders } from "./authHeaders";
import { fetchWithTimeout } from "./fetchWithTimeout";

function vetHeaders(veterinarianId, extra = {}) {
  return {
    "Content-Type": "application/json",
    ...getAuthHeaders(veterinarianId, extra),
  };
}

async function clinicFetch(path, veterinarianId, options = {}) {
  const response = await fetchWithTimeout(
    `${getBackendUrl()}${path}`,
    {
      ...options,
      headers: vetHeaders(veterinarianId, options.headers),
    },
    { timeoutMs: 45000, retries: 2 },
  );
  if (!response.ok) {
    const data = await parseJsonResponse(response, {});
    throw new Error(
      formatApiErrorDetail(data.detail, friendlyFetchError(response.status, getBackendUrl())) ||
        "Error de servidor",
    );
  }
  return parseJsonResponse(response, {});
}

export async function fetchOrganization(veterinarianId) {
  return clinicFetch("/api/organization", veterinarianId);
}

export async function updateOrganization(veterinarianId, data) {
  return clinicFetch("/api/organization", veterinarianId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function addOrganizationMember(veterinarianId, email, role) {
  return clinicFetch("/api/organization/members", veterinarianId, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export async function removeOrganizationMember(veterinarianId, memberId) {
  return clinicFetch(`/api/organization/members/${memberId}`, veterinarianId, {
    method: "DELETE",
  });
}

export async function fetchAdminAccess(veterinarianId) {
  return clinicFetch("/api/admin/access", veterinarianId);
}

export async function sendPresenceHeartbeat(veterinarianId) {
  return clinicFetch("/api/presence/heartbeat", veterinarianId, {
    method: "POST",
  });
}

export async function fetchAdminOverview(veterinarianId) {
  return clinicFetch("/api/admin/overview", veterinarianId);
}

export async function fetchAdminUsers(
  veterinarianId,
  search = "",
  planFilter = "all",
  limit = 500,
  presenceFilter = "all",
) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (planFilter && planFilter !== "all") params.set("plan_filter", planFilter);
  if (presenceFilter && presenceFilter !== "all") params.set("presence_filter", presenceFilter);
  if (limit) params.set("limit", String(limit));
  const q = params.toString() ? `?${params}` : "";
  return clinicFetch(`/api/admin/users${q}`, veterinarianId);
}

export async function fetchAdminOrganizations(veterinarianId) {
  return clinicFetch("/api/admin/organizations", veterinarianId);
}

export async function adminDeleteUser(veterinarianId, email) {
  return clinicFetch("/api/admin/delete-user", veterinarianId, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function adminLookupUser(veterinarianId, email) {
  const params = new URLSearchParams({ email: email.trim() });
  return clinicFetch(`/api/admin/users/lookup?${params}`, veterinarianId);
}

export async function adminVerifyUserCedula(veterinarianId, profileId) {
  return clinicFetch(`/api/admin/users/${profileId}/cedula/verify`, veterinarianId, {
    method: "POST",
  });
}

export async function adminReviewUserCedula(veterinarianId, profileId, action, note = "") {
  return clinicFetch(`/api/admin/users/${profileId}/cedula/review`, veterinarianId, {
    method: "POST",
    body: JSON.stringify({ action, note: note || undefined }),
  });
}

export async function fetchAdminUserConsultations(veterinarianId, profileId, limit = 50) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  const q = params.toString() ? `?${params}` : "";
  return clinicFetch(`/api/admin/users/${profileId}/consultations${q}`, veterinarianId);
}

export async function fetchAdminUserCedulaDocument(veterinarianId, profileId) {
  return clinicFetch(`/api/admin/users/${profileId}/cedula/document`, veterinarianId);
}

export async function fetchAdminUserCedulaDocumentBlob(veterinarianId, profileId) {
  const response = await fetchWithTimeout(
    `${getBackendUrl()}/api/admin/users/${profileId}/cedula/document/file`,
    {
      headers: getAuthHeaders(veterinarianId),
    },
    { timeoutMs: 60000, retries: 2 },
  );
  if (!response.ok) {
    const data = await parseJsonResponse(response, {});
    throw new Error(
      formatApiErrorDetail(data.detail, friendlyFetchError(response.status, getBackendUrl())) ||
        "Error de servidor",
    );
  }
  return response.blob();
}

export async function createSupportTicket(veterinarianId, data) {
  return clinicFetch("/api/support/tickets", veterinarianId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchMySupportTickets(veterinarianId) {
  return clinicFetch("/api/support/tickets", veterinarianId);
}

export async function fetchMySupportTicketsSummary(veterinarianId) {
  return clinicFetch("/api/support/tickets/summary", veterinarianId);
}

export async function fetchMySupportTicket(veterinarianId, ticketId) {
  return clinicFetch(`/api/support/tickets/${ticketId}`, veterinarianId);
}

export async function addUserSupportMessage(veterinarianId, ticketId, body) {
  return clinicFetch(`/api/support/tickets/${ticketId}/messages`, veterinarianId, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function fetchAdminSupportTickets(veterinarianId, status = "") {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const q = params.toString() ? `?${params}` : "";
  return clinicFetch(`/api/admin/support/tickets${q}`, veterinarianId);
}

export async function fetchAdminSupportTicket(veterinarianId, ticketId) {
  return clinicFetch(`/api/admin/support/tickets/${ticketId}`, veterinarianId);
}

export async function updateAdminSupportTicket(veterinarianId, ticketId, data) {
  return clinicFetch(`/api/admin/support/tickets/${ticketId}`, veterinarianId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function replyAdminSupportTicket(veterinarianId, ticketId, body, status = "") {
  return clinicFetch(`/api/admin/support/tickets/${ticketId}/reply`, veterinarianId, {
    method: "POST",
    body: JSON.stringify({ body, status: status || undefined }),
  });
}

export async function fetchClients(veterinarianId, search = "") {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return clinicFetch(`/api/clients${q}`, veterinarianId);
}

export async function fetchClient(veterinarianId, clientId) {
  return clinicFetch(`/api/clients/${clientId}`, veterinarianId);
}

export async function createClient(veterinarianId, data) {
  return clinicFetch("/api/clients", veterinarianId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateClient(veterinarianId, clientId, data) {
  return clinicFetch(`/api/clients/${clientId}`, veterinarianId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteClient(veterinarianId, clientId) {
  return clinicFetch(`/api/clients/${clientId}`, veterinarianId, { method: "DELETE" });
}

export async function fetchPatients(veterinarianId, { search = "", clientId = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (clientId) params.set("client_id", clientId);
  const q = params.toString() ? `?${params}` : "";
  return clinicFetch(`/api/patients${q}`, veterinarianId);
}

export async function fetchPatient(veterinarianId, patientId) {
  return clinicFetch(`/api/patients/${patientId}`, veterinarianId);
}

export async function createPatient(veterinarianId, data) {
  return clinicFetch("/api/patients", veterinarianId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePatient(veterinarianId, patientId, data) {
  return clinicFetch(`/api/patients/${patientId}`, veterinarianId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePatient(veterinarianId, patientId) {
  return clinicFetch(`/api/patients/${patientId}`, veterinarianId, { method: "DELETE" });
}

export async function fetchAppointments(veterinarianId, fromDate, toDate) {
  const params = new URLSearchParams({ from_date: fromDate, to_date: toDate });
  return clinicFetch(`/api/appointments/calendar?${params}`, veterinarianId);
}

export async function createAppointment(veterinarianId, data) {
  return clinicFetch("/api/appointments", veterinarianId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAppointment(veterinarianId, appointmentId, data) {
  return clinicFetch(`/api/appointments/${appointmentId}`, veterinarianId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAppointment(veterinarianId, appointmentId) {
  return clinicFetch(`/api/appointments/${appointmentId}`, veterinarianId, {
    method: "DELETE",
  });
}

export async function fetchNotifications(veterinarianId) {
  return clinicFetch("/api/notifications", veterinarianId);
}

export async function fetchAppointmentRequests(veterinarianId, status = "pending") {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return clinicFetch(`/api/appointment-requests${q}`, veterinarianId);
}

export async function updateAppointmentRequest(veterinarianId, requestId, data) {
  return clinicFetch(`/api/appointment-requests/${requestId}`, veterinarianId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchPublicOrganization(organizationId) {
  const response = await fetch(`${getBackendUrl()}/api/public/organizations/${organizationId}`);
  const data = await parseJsonResponse(response, {});
  if (!response.ok) {
    throw new Error(formatApiErrorDetail(data.detail, "Consultorio no encontrado"));
  }
  return data;
}

export async function submitAppointmentRequest(data) {
  const response = await fetch(`${getBackendUrl()}/api/public/appointment-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await parseJsonResponse(response, {});
  if (!response.ok) {
    throw new Error(formatApiErrorDetail(body.detail, "No se pudo enviar la solicitud"));
  }
  return body;
}

export async function submitGuiaConsultasLead(data) {
  const response = await fetch(`${getBackendUrl()}/api/public/guia-consultas-leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await parseJsonResponse(response, {});
  if (!response.ok) {
    throw new Error(formatApiErrorDetail(body.detail, "No se pudo enviar la solicitud"));
  }
  return body;
}

export async function fetchAdminGuiaConsultasLeads(veterinarianId, status = "") {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const q = params.toString() ? `?${params}` : "";
  return clinicFetch(`/api/admin/guia-consultas-leads${q}`, veterinarianId);
}

export async function fetchAdminTrialSurveys(veterinarianId, search = "") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const q = params.toString() ? `?${params}` : "";
  return clinicFetch(`/api/admin/trial-surveys${q}`, veterinarianId);
}

export async function updateAdminGuiaConsultasLead(veterinarianId, leadId, data) {
  return clinicFetch(`/api/admin/guia-consultas-leads/${leadId}`, veterinarianId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchProducts(veterinarianId, search = "") {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return clinicFetch(`/api/products${q}`, veterinarianId);
}

export async function fetchInventorySummary(veterinarianId) {
  return clinicFetch("/api/inventory/summary", veterinarianId);
}

export async function fetchProductMovements(veterinarianId, productId, limit = 50) {
  return clinicFetch(`/api/products/${productId}/movements?limit=${limit}`, veterinarianId);
}

export async function createProduct(veterinarianId, data) {
  return clinicFetch("/api/products", veterinarianId, { method: "POST", body: JSON.stringify(data) });
}

export async function updateProduct(veterinarianId, productId, data) {
  return clinicFetch(`/api/products/${productId}`, veterinarianId, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteProduct(veterinarianId, productId) {
  return clinicFetch(`/api/products/${productId}`, veterinarianId, { method: "DELETE" });
}

export async function registerStockMovement(veterinarianId, productId, data) {
  return clinicFetch(`/api/products/${productId}/stock-movement`, veterinarianId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchInvoices(veterinarianId, status = "") {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return clinicFetch(`/api/invoices${q}`, veterinarianId);
}

export async function fetchInvoice(veterinarianId, invoiceId) {
  return clinicFetch(`/api/invoices/${invoiceId}`, veterinarianId);
}

export async function createInvoice(veterinarianId, data) {
  return clinicFetch("/api/invoices", veterinarianId, { method: "POST", body: JSON.stringify(data) });
}

export async function updateInvoice(veterinarianId, invoiceId, data) {
  return clinicFetch(`/api/invoices/${invoiceId}`, veterinarianId, { method: "PATCH", body: JSON.stringify(data) });
}

export async function fetchReportsOverview(veterinarianId, fromDate, toDate) {
  const params = new URLSearchParams({
    from_date: fromDate,
    to_date: toDate,
  });
  return clinicFetch(`/api/reports/overview?${params}`, veterinarianId);
}

export async function fetchDashboardOverview(veterinarianId) {
  return clinicFetch("/api/dashboard/overview", veterinarianId);
}
