/** Encuesta al agotar las 3 consultas de prueba. */

export function shouldShowTrialSurvey(veterinarian) {
  if (!veterinarian) return false;
  if (veterinarian.membership_type) return false;
  if ((veterinarian.consultations_remaining ?? 0) > 0) return false;
  if (veterinarian.trial_survey_completed_at) return false;
  return true;
}

import { getBackendUrl } from "./backendUrl";

export async function fetchTrialSurveyStatus(veterinarianId, headers) {
  const response = await fetch(`${getBackendUrl()}/api/trial-survey/status`, {
    headers,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "No se pudo cargar la encuesta");
  }
  return response.json();
}

export async function submitTrialSurvey(veterinarianId, headers, { rating, comment }) {
  const response = await fetch(`${getBackendUrl()}/api/trial-survey`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rating, comment }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "No se pudo enviar la encuesta");
  }
  return data;
}
