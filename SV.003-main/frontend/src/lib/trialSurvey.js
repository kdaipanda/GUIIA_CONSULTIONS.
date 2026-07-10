/** Encuesta al agotar las 3 consultas de prueba. */

import { getBackendUrl } from "./backendUrl";
import {
  friendlyDatabaseError,
  formatApiErrorDetail,
  parseJsonResponse,
} from "./friendlyFetchError";

export function shouldShowTrialSurvey(veterinarian) {
  if (!veterinarian) return false;
  if (veterinarian.membership_type) return false;
  if ((veterinarian.consultations_remaining ?? 0) > 0) return false;
  if (veterinarian.trial_survey_completed_at) return false;
  return true;
}

function trialSurveyApiError(data, fallback) {
  const detail = data?.detail ?? data?.message ?? data;
  return friendlyDatabaseError(detail, formatApiErrorDetail(detail, fallback));
}

export async function fetchTrialSurveyStatus(veterinarianId, headers) {
  const response = await fetch(`${getBackendUrl()}/api/trial-survey/status`, {
    headers,
  });
  const data = await parseJsonResponse(response, {});
  if (!response.ok) {
    throw new Error(trialSurveyApiError(data, "No se pudo cargar la encuesta"));
  }
  return data;
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
  const data = await parseJsonResponse(response, {});
  if (!response.ok) {
    throw new Error(trialSurveyApiError(data, "No se pudo enviar la encuesta"));
  }
  return data;
}
