/** Catálogo de planes y funciones — alineado con backend (server_simple.py) y módulos GUIAA. */

export const DEFAULT_PACKAGES = {
  basic: {
    name: "Básica",
    price_monthly: 950,
    price_annual: 9500,
    consultations: 30,
    currency: "mxn",
  },
  professional: {
    name: "Profesional",
    price_monthly: 1250,
    price_annual: 12500,
    consultations: 35,
    currency: "mxn",
  },
  premium: {
    name: "Premium",
    price_monthly: 2200,
    price_annual: 22000,
    consultations: 150,
    currency: "mxn",
  },
};

/** Consultas incluidas en facturación anual (Stripe / catálogo comercial). */
export const ANNUAL_CONSULTATIONS = {
  basic: 300,
  professional: 350,
  premium: 1500,
};

export const FEATURED_PLAN_KEY = "professional";

const SHARED_CORE = [
  "GUIAA Diagnóstico con soporte CDS L4 · L5",
  "Expediente e historial clínico",
  "Clientes, pacientes y agenda",
  "Panel clínico con métricas de consulta",
  "Exportación PDF de consultas",
];

export const PLAN_FEATURES = {
  basic: [
    "30 consultas CDS al mes",
    "Especies: perros y gatos",
    ...SHARED_CORE,
  ],
  professional: [
    "35 consultas CDS al mes",
    "Todas las especies (11+ categorías)",
    ...SHARED_CORE,
    "Inventario con alertas de stock",
    "Ventas, recibos y facturación",
    "Reportes de actividad clínica",
    "Soporte prioritario por correo",
  ],
  premium: [
    "150 consultas CDS al mes",
    "Todas las especies (11+ categorías)",
    ...SHARED_CORE,
    "Inventario, ventas y reportes",
    "Manejo Experto (consulta acelerada)",
    "Interpretación de análisis clínicos",
    "Análisis diagnóstico avanzado con IA",
    "Onboarding guiado prioritario",
  ],
};

export const PLAN_ANNUAL_FEATURES = {
  basic: [
    "300 consultas CDS al año",
    "Especies: perros y gatos",
    ...SHARED_CORE,
  ],
  professional: [
    "350 consultas CDS al año",
    "Todas las especies (11+ categorías)",
    ...SHARED_CORE,
    "Inventario con alertas de stock",
    "Ventas, recibos y facturación",
    "Reportes de actividad clínica",
    "Soporte prioritario por correo",
  ],
  premium: [
    "1500 consultas CDS al año",
    "Todas las especies (11+ categorías)",
    ...SHARED_CORE,
    "Inventario, ventas y reportes",
    "Manejo Experto (consulta acelerada)",
    "Interpretación de análisis clínicos",
    "Análisis diagnóstico avanzado con IA",
    "Onboarding guiado prioritario",
  ],
};

export const MEMBERSHIP_INFO_ITEMS = [
  {
    id: "cds",
    title: "CDS estructurado",
    description: "Anamnesis, hallazgos y razonamiento clínico L4 · L5 en un solo flujo.",
  },
  {
    id: "clinic",
    title: "Consultorio integrado",
    description: "Expediente, agenda, inventario y ventas conectados entre consultas.",
  },
  {
    id: "species",
    title: "Multiespecie real",
    description: "Desde perros y gatos hasta exóticos, según tu plan activo.",
  },
  {
    id: "evidence",
    title: "Basado en evidencia",
    description: "Referencias bibliográficas y planes terapéuticos documentados.",
  },
];

export const DEFAULT_CREDIT_PACKAGES = {
  credits_10: {
    name: "10 consultas extra",
    price: 350,
    credits: 10,
    currency: "mxn",
  },
};

export function parseMembershipCatalogResponse(data) {
  const packages =
    data?.packages && Object.keys(data.packages).length > 0
      ? data.packages
      : DEFAULT_PACKAGES;

  return {
    packages,
    featuredPlan: data?.featured_plan || FEATURED_PLAN_KEY,
    infoItems:
      Array.isArray(data?.info_items) && data.info_items.length > 0
        ? data.info_items
        : MEMBERSHIP_INFO_ITEMS,
  };
}

export function getPlanFeatureList(planKey, billingCycle = "monthly", pkg) {
  const annual = billingCycle === "annual";
  const apiFeatures = annual ? pkg?.features_annual : pkg?.features;

  if (Array.isArray(apiFeatures) && apiFeatures.length > 0) {
    return apiFeatures;
  }

  const base = annual ? PLAN_ANNUAL_FEATURES[planKey] : PLAN_FEATURES[planKey];
  const resolved = pkg || DEFAULT_PACKAGES[planKey];

  if (!base?.length) {
    return [getConsultationsLabel(planKey, resolved, billingCycle), ...SHARED_CORE];
  }

  if (resolved?.consultations != null || resolved?.consultations_annual != null) {
    const copy = [...base];
    copy[0] = getConsultationsLabel(planKey, resolved, billingCycle);
    return copy;
  }

  return base;
}

export function getConsultationsLabel(planKey, pkg, billingCycle = "monthly") {
  if (pkg?.consultations === "unlimited") {
    return "Consultas CDS ilimitadas";
  }

  if (billingCycle === "annual") {
    const annual =
      pkg?.consultations_annual ??
      ANNUAL_CONSULTATIONS[planKey] ??
      (pkg?.consultations || 0) * 10;
    return `${annual} consultas CDS al año`;
  }

  const monthly = pkg?.consultations ?? DEFAULT_PACKAGES[planKey]?.consultations ?? 0;
  return `${monthly} consultas CDS al mes`;
}

const PLAN_STATUS_LABELS = {
  basic: "Básica",
  professional: "Profesional",
  premium: "Premium",
};

export function getMembershipQuota(veterinarian, packages = DEFAULT_PACKAGES) {
  if (!veterinarian?.membership_type) {
    return {
      planKey: null,
      status: "Sin membresía",
      planName: null,
      consultations: 0,
      maxConsultations: 0,
      progress: 0,
      color: "red",
      speciesScope: null,
    };
  }

  const planKey = veterinarian.membership_type.toLowerCase();
  const pkg = packages[planKey];
  const unlimited = pkg?.consultations === "unlimited";
  const maxConsultations = unlimited
    ? 0
    : typeof pkg?.consultations === "number"
      ? pkg.consultations
      : DEFAULT_PACKAGES[planKey]?.consultations ?? 0;

  const rawRemaining =
    veterinarian.consultations_remaining != null
      ? veterinarian.consultations_remaining
      : maxConsultations;
  const consultations =
    maxConsultations > 0
      ? Math.min(rawRemaining, maxConsultations)
      : rawRemaining || 0;

  const planName = pkg?.name || PLAN_STATUS_LABELS[planKey] || veterinarian.membership_type;

  const color =
    unlimited || maxConsultations === 0
      ? consultations > 0
        ? "green"
        : "red"
      : consultations > maxConsultations * 0.3
        ? "green"
        : consultations > 0
          ? "orange"
          : "red";

  const progress =
    maxConsultations > 0 ? Math.min((consultations / maxConsultations) * 100, 100) : 0;

  return {
    planKey,
    status: planName,
    planName,
    consultations,
    maxConsultations,
    progress,
    color,
    speciesScope: pkg?.species_scope || null,
    unlimited,
  };
}

export function getMembershipStatusText(veterinarian, packages) {
  if (!veterinarian?.membership_type) {
    return { text: "Sin membresía activa", tone: null };
  }

  const expiry = veterinarian.membership_expires
    ? new Date(veterinarian.membership_expires)
    : null;

  if (expiry && expiry < new Date()) {
    return { text: "Membresía expirada", tone: "danger" };
  }

  const planKey = veterinarian.membership_type.toLowerCase();
  const packageName = packages[planKey]?.name || veterinarian.membership_type;
  const remaining = veterinarian.consultations_remaining ?? 0;
  const maxForPlan = packages[planKey]?.consultations;
  const maxDisplay =
    maxForPlan === "unlimited"
      ? "ilimitadas"
      : planKey === "premium" && remaining >= 150
        ? "150"
        : String(remaining);

  return {
    text: `${packageName} · ${maxForPlan === "unlimited" ? "consultas ilimitadas" : `${maxDisplay} consultas restantes`}`,
    tone:
      maxForPlan === "unlimited" || remaining > 5 || remaining >= 150
        ? "success"
        : remaining > 0
          ? "warning"
          : "danger",
  };
}
