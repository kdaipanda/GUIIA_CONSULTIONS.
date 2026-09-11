/** Catálogo de planes y funciones — alineado con backend (server_simple.py) y módulos GUIAA. */

import i18n from "../i18n";
import { TRIAL_CONSULTATION_LIMIT } from "./membershipAccess";

function planT(key, options) {
  return i18n.t(`membershipPlans.${key}`, { ns: "clinic", ...options });
}

export function getPlanDisplayName(planKey, pkg) {
  const key = `planNames.${planKey}`;
  if (i18n.exists(`membershipPlans.${key}`, { ns: "clinic" })) {
    return planT(key);
  }
  return pkg?.name || planKey;
}

export function getCreditPackageDisplayName(packageKey, pkg) {
  const key = `creditPackages.${packageKey}.name`;
  if (i18n.exists(`membershipPlans.${key}`, { ns: "clinic" })) {
    return planT(key);
  }
  return pkg?.name || packageKey;
}

export function getLocalizedInfoItems(items = MEMBERSHIP_INFO_ITEMS) {
  return items.map((item) => {
    const titleKey = `infoItems.${item.id}.title`;
    const descKey = `infoItems.${item.id}.description`;
    return {
      id: item.id,
      title: i18n.exists(`membershipPlans.${titleKey}`, { ns: "clinic" })
        ? planT(titleKey)
        : item.title,
      description: i18n.exists(`membershipPlans.${descKey}`, { ns: "clinic" })
        ? planT(descKey)
        : item.description,
    };
  });
}

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
    "Interpretación de laboratorio (PDF y estudios)",
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
    "Interpretación de laboratorio (PDF y estudios)",
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

  const cycleKey = annual ? "annual" : "monthly";
  const i18nKey = `features.${planKey}.${cycleKey}`;
  const localizedTail = i18n.exists(`membershipPlans.${i18nKey}`, { ns: "clinic" })
    ? planT(i18nKey, { returnObjects: true })
    : null;

  const base = Array.isArray(localizedTail) && localizedTail.length > 0
    ? localizedTail
    : annual
      ? PLAN_ANNUAL_FEATURES[planKey]
      : PLAN_FEATURES[planKey];
  const resolved = pkg || DEFAULT_PACKAGES[planKey];

  if (!base?.length) {
    return [getConsultationsLabel(planKey, resolved, billingCycle), ...SHARED_CORE];
  }

  if (resolved?.consultations != null || resolved?.consultations_annual != null) {
    return [getConsultationsLabel(planKey, resolved, billingCycle), ...base];
  }

  return base;
}

export function getConsultationsLabel(planKey, pkg, billingCycle = "monthly") {
  if (pkg?.consultations === "unlimited") {
    return planT("consultationsUnlimited");
  }

  if (billingCycle === "annual") {
    const annual =
      pkg?.consultations_annual ??
      ANNUAL_CONSULTATIONS[planKey] ??
      (pkg?.consultations || 0) * 10;
    return planT("consultationsAnnual", { count: annual });
  }

  const monthly = pkg?.consultations ?? DEFAULT_PACKAGES[planKey]?.consultations ?? 0;
  return planT("consultationsMonthly", { count: monthly });
}

export function getMembershipQuota(veterinarian, packages = DEFAULT_PACKAGES) {
  if (!veterinarian?.membership_type) {
    const remaining = veterinarian?.consultations_remaining ?? 0;
    if (remaining > 0) {
      return {
        planKey: "trial",
        status: planT("quotaTrialPeriod"),
        planName: planT("planNames.trial"),
        consultations: remaining,
        maxConsultations: TRIAL_CONSULTATION_LIMIT,
        progress: Math.min(
          ((TRIAL_CONSULTATION_LIMIT - remaining) / TRIAL_CONSULTATION_LIMIT) * 100,
          100,
        ),
        color: remaining > 1 ? "green" : remaining === 1 ? "orange" : "red",
        speciesScope: "premium",
        unlimited: false,
        trialExhausted: false,
      };
    }
    return {
      planKey: null,
      status: planT("quotaTrialExhausted"),
      planName: null,
      consultations: 0,
      maxConsultations: TRIAL_CONSULTATION_LIMIT,
      progress: 100,
      color: "red",
      speciesScope: null,
      unlimited: false,
      trialExhausted: true,
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

  const planName = getPlanDisplayName(planKey, pkg);

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
    return { text: planT("statusNoActive"), tone: null };
  }

  const expiry = veterinarian.membership_expires
    ? new Date(veterinarian.membership_expires)
    : null;

  if (expiry && expiry < new Date()) {
    return { text: planT("statusExpired"), tone: "danger" };
  }

  const planKey = veterinarian.membership_type.toLowerCase();
  const packageName = getPlanDisplayName(planKey, packages[planKey]);
  const remaining = veterinarian.consultations_remaining ?? 0;
  const maxForPlan = packages[planKey]?.consultations;
  const maxDisplay =
    maxForPlan === "unlimited"
      ? planT("statusUnlimited")
      : planKey === "premium" && remaining >= 150
        ? "150"
        : String(remaining);

  const detail =
    maxForPlan === "unlimited"
      ? planT("statusUnlimited")
      : planT("statusRemaining", { count: maxDisplay });

  return {
    text: planT("statusLine", { plan: packageName, detail }),
    tone:
      maxForPlan === "unlimited" || remaining > 5 || remaining >= 150
        ? "success"
        : remaining > 0
          ? "warning"
          : "danger",
  };
}
