/**
 * Tarjetas de precios de la landing — una por cada membresía del catálogo.
 */
import {
  DEFAULT_CREDIT_PACKAGES,
  DEFAULT_PACKAGES,
  FEATURED_PLAN_KEY,
  getPlanFeatureList,
} from "./membershipPlans";

/** Orden comercial en la landing */
export const LANDING_PLAN_ORDER = ["basic", "professional", "premium"];

const PLAN_DESCRIPTIONS = {
  basic:
    "Consultorio de pequeñas especies: CDS estructurado, expediente y agenda para perros y gatos.",
  professional:
    "Práctica multiespecie activa con inventario, ventas y reportes clínicos integrados.",
  premium:
    "Alto volumen de consultas con Manejo Experto e interpretación de análisis clínicos.",
};

function formatMxPrice(amount, suffix = "") {
  if (amount == null || Number.isNaN(Number(amount))) return "Consultar";
  return `$${Number(amount).toLocaleString("es-MX")}${suffix}`;
}

function buildPlanCard(planKey, pkg, featuredKey) {
  if (!pkg) return null;

  const features = getPlanFeatureList(planKey, "monthly", pkg).slice(0, 6);
  const isFeatured = planKey === featuredKey;

  const speciesNote = pkg.species_scope ? `${pkg.species_scope}` : "";
  const annualHint = pkg.price_annual
    ? `Anual ${formatMxPrice(pkg.price_annual)}`
    : null;
  const priceNote = [speciesNote, annualHint, "facturación mensual o anual"]
    .filter(Boolean)
    .join(" · ");

  return {
    key: planKey,
    name: pkg.name,
    price: formatMxPrice(pkg.price_monthly, "/mes"),
    priceNote,
    description: PLAN_DESCRIPTIONS[planKey] || pkg.description || "",
    highlighted: isFeatured,
    badge: isFeatured ? "Más usado" : pkg.consultations ? `${pkg.consultations} consultas/mes` : null,
    features,
    cta: isFeatured ? "Comenzar registro" : "Contratar plan",
    action: isFeatured ? "register" : "membership",
  };
}

/**
 * @param {object|null} catalog
 * @param {Record<string, object>} [catalog.packages]
 * @param {string} [catalog.featuredPlan]
 * @param {Record<string, object>} [catalog.creditPackages]
 */
export function buildLandingPricingPlans(catalog) {
  const packages =
    catalog?.packages && Object.keys(catalog.packages).length > 0
      ? catalog.packages
      : DEFAULT_PACKAGES;
  const featuredKey = catalog?.featuredPlan || FEATURED_PLAN_KEY;

  const plans = LANDING_PLAN_ORDER.map((key) =>
    buildPlanCard(key, packages[key] || DEFAULT_PACKAGES[key], featuredKey),
  ).filter(Boolean);

  const creditSource = catalog?.creditPackages || DEFAULT_CREDIT_PACKAGES;
  const credits10 = creditSource.credits_10;

  const creditAddon = credits10
    ? {
        name: credits10.name || "Recarga de consultas",
        price: formatMxPrice(credits10.price),
        description:
          credits10.description ||
          "Consultas CDS adicionales sin cambiar de plan. Se suman a tu saldo actual.",
        credits: credits10.credits,
      }
    : null;

  return { plans, creditAddon };
}
