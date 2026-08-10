/** Control de acceso por membresía — alineado con backend/membership_access.py */

export const MEMBERSHIP_FEATURES = {
  inventory: "inventory",
  billing: "billing",
  reports: "reports",
  multiespecies: "multiespecies",
  expertMode: "expert_mode",
  advancedAnalysis: "advanced_analysis",
  medicalImages: "medical_images",
};

const FEATURE_ACCESS = {
  inventory: new Set(["professional", "premium", "trial"]),
  billing: new Set(["professional", "premium", "trial"]),
  reports: new Set(["professional", "premium", "trial"]),
  multiespecies: new Set(["professional", "premium", "trial"]),
  expert_mode: new Set(["premium"]),
  advanced_analysis: new Set(["premium", "trial"]),
  medical_images: new Set(["premium"]),
};

export const FEATURE_UPGRADE_MESSAGES = {
  inventory: "El inventario requiere membresía Profesional o Premium.",
  billing: "Ventas y facturación requieren membresía Profesional o Premium.",
  reports: "Los reportes clínicos requieren membresía Profesional o Premium.",
  multiespecies: "Las consultas multiespecie requieren membresía Profesional o Premium.",
  expert_mode: "Manejo Experto está disponible solo con membresía Premium.",
  advanced_analysis: "La síntesis clínica CDS L5 requiere membresía Premium.",
  medical_images: "La interpretación de laboratorio (PDF y estudios) requiere membresía Premium.",
};

export const TRIAL_CONSULTATION_LIMIT = 3;

export const TRIAL_EXHAUSTED_MESSAGE =
  "Has agotado tus 3 consultas de prueba. Suscríbete a un plan de membresía para continuar usando GUIAA.";

export function getEffectivePlan(veterinarian, { platformAdmin = false } = {}) {
  if (platformAdmin) return "premium";
  if (!veterinarian) return "basic";

  const membershipType = veterinarian.membership_type?.toLowerCase();
  const remaining = veterinarian.consultations_remaining ?? 0;

  if (membershipType) return membershipType;
  if (remaining > 0) return "trial";
  return "basic";
}

export function canAccessFeature(veterinarian, feature, options = {}) {
  const allowedPlans = FEATURE_ACCESS[feature];
  if (!allowedPlans) return false;
  const plan = getEffectivePlan(veterinarian, options);
  return allowedPlans.has(plan);
}

/** Interpretación de laboratorio (PDF / estudios) — solo Premium. */
export function canUseMedicalImages(veterinarian, options = {}) {
  return canAccessFeature(veterinarian, MEMBERSHIP_FEATURES.medicalImages, options);
}

export function getFeatureUpgradeMessage(feature) {
  return FEATURE_UPGRADE_MESSAGES[feature] || "Tu plan no incluye esta función.";
}

/** ¿Puede iniciar una nueva consulta CDS? (trial, plan activo o premium) */
export function canCreateConsultation(veterinarian, options = {}) {
  if (options.platformAdmin) return true;
  if (!veterinarian) return false;

  const membershipType = veterinarian.membership_type?.toLowerCase();
  const remaining = veterinarian.consultations_remaining ?? 0;

  if (membershipType === "premium") return true;
  if (membershipType && remaining > 0) return true;
  if (!membershipType && remaining > 0) return true;
  return false;
}

/** ¿Puede generar la síntesis CDS de una consulta ya iniciada? */
export function canAnalyzeConsultation(veterinarian, options = {}) {
  if (options.platformAdmin) return true;
  if (!veterinarian) return false;

  const membershipType = veterinarian.membership_type?.toLowerCase();
  const remaining = veterinarian.consultations_remaining ?? 0;

  if (["basic", "professional", "premium"].includes(membershipType)) return true;
  if (!membershipType && remaining > 0) return true;
  return false;
}

export function isTrialExhausted(veterinarian, options = {}) {
  if (options.platformAdmin) return false;
  if (!veterinarian) return false;
  if (veterinarian.membership_type) return false;
  return (veterinarian.consultations_remaining ?? 0) <= 0;
}

export function requiresProfessionalPlan(veterinarian, options = {}) {
  return (
    canAccessFeature(veterinarian, MEMBERSHIP_FEATURES.inventory, options) &&
    canAccessFeature(veterinarian, MEMBERSHIP_FEATURES.billing, options) &&
    canAccessFeature(veterinarian, MEMBERSHIP_FEATURES.reports, options)
  );
}
