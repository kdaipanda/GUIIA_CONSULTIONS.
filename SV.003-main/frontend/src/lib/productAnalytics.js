/**
 * Eventos de producto en PostHog (snippet en public/index.html).
 * Embudo MVZ: registro → cédula → consulta (paso 1, 2) → análisis CDS.
 */

function getPosthog() {
  if (typeof window === "undefined") return null;
  const ph = window.posthog;
  return ph && typeof ph.capture === "function" ? ph : null;
}

export function trackProductEvent(eventName, properties = {}) {
  const ph = getPosthog();
  if (!ph) return;
  try {
    ph.capture(eventName, properties);
  } catch {
    /* ignore */
  }
}

export function identifyVeterinarian(veterinarian) {
  const ph = getPosthog();
  if (!ph || !veterinarian?.id || typeof ph.identify !== "function") return;
  try {
    ph.identify(String(veterinarian.id), {
      email: veterinarian.email || undefined,
      account_kind: veterinarian.account_kind || "veterinarian",
      membership_type: veterinarian.membership_type || "trial",
      country: veterinarian.profesional_pais || undefined,
      cedula_status: veterinarian.cedula_verification_status || undefined,
    });
  } catch {
    /* ignore */
  }
}

export function resetProductAnalytics() {
  const ph = getPosthog();
  if (!ph || typeof ph.reset !== "function") return;
  try {
    ph.reset();
  } catch {
    /* ignore */
  }
}
