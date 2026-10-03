/**
 * Tarjetas de precios de la landing — layout tipo membresía (header + checks / locked).
 */
import i18n from "../i18n";
import {
  DEFAULT_CREDIT_PACKAGES,
  DEFAULT_PACKAGES,
  FEATURED_PLAN_KEY,
  getPlanFeatureList,
  getPlanDisplayName,
  getCreditPackageDisplayName,
} from "./membershipPlans";

/** Orden comercial en la landing */
export const LANDING_PLAN_ORDER = ["basic", "professional", "premium"];

function landingT(key, options) {
  return i18n.t(`pricing.${key}`, { ns: "landing", ...options });
}

function priceLocale() {
  return i18n.language?.startsWith("en") ? "en-US" : "es-MX";
}

function formatMxAmount(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  return `$${Number(amount).toLocaleString(priceLocale())}`;
}

function formatMxPrice(amount, suffix = "") {
  const base = formatMxAmount(amount);
  if (!base) return landingT("askPrice");
  return `${base}${suffix}`;
}

/** Cupo/consultas: no se comparan entre planes (cada uno tiene el suyo). */
function isQuotaFeature(feature) {
  return /consultas?\s+CDS|CDS\s+consultations?/i.test(feature || "");
}

/**
 * Funciones del catálogo completo (Premium) que el plan actual no incluye.
 * Así cada card muestra toda la plataforma: ✓ incluidas / ✗ superiores.
 */
function getLockedFeatures(planKey, packages) {
  const idx = LANDING_PLAN_ORDER.indexOf(planKey);
  if (idx < 0 || idx >= LANDING_PLAN_ORDER.length - 1) return [];

  const pkg = packages[planKey] || DEFAULT_PACKAGES[planKey];
  const current = new Set(getPlanFeatureList(planKey, "monthly", pkg));

  const topKey = LANDING_PLAN_ORDER[LANDING_PLAN_ORDER.length - 1];
  const topPkg = packages[topKey] || DEFAULT_PACKAGES[topKey];
  const fullCatalog = getPlanFeatureList(topKey, "monthly", topPkg);

  return fullCatalog.filter((f) => !current.has(f) && !isQuotaFeature(f));
}

function buildPlanCard(planKey, pkg, featuredKey, packages) {
  if (!pkg) return null;

  const included = getPlanFeatureList(planKey, "monthly", pkg);
  const locked = getLockedFeatures(planKey, packages);
  const isFeatured = planKey === featuredKey;

  const monthly = pkg.price_monthly;
  const listPrice =
    pkg.compare_price_monthly != null && !Number.isNaN(Number(pkg.compare_price_monthly))
      ? Number(pkg.compare_price_monthly)
      : null;
  const annualMonthly =
    pkg.price_annual != null && !Number.isNaN(Number(pkg.price_annual))
      ? Math.round(Number(pkg.price_annual) / 12)
      : null;

  // Tachado solo si el catálogo trae precio de lista mayor al mensual.
  const priceCompare =
    listPrice != null && monthly != null && listPrice > Number(monthly)
      ? formatMxAmount(listPrice)
      : null;

  const descriptionKey = `planDescriptions.${planKey}`;
  const description = i18n.exists(`pricing.${descriptionKey}`, { ns: "landing" })
    ? landingT(descriptionKey)
    : pkg.description || "";

  const audienceKey = `audienceBadge.${planKey}`;
  const audienceBadge = i18n.exists(`pricing.${audienceKey}`, { ns: "landing" })
    ? landingT(audienceKey)
    : pkg.consultations
      ? landingT("badgeConsultations", { count: pkg.consultations })
      : null;

  const priceNoteParts = [
    annualMonthly != null
      ? landingT("annualFrom", { price: formatMxAmount(annualMonthly) })
      : null,
    landingT("billingNote"),
  ].filter(Boolean);

  return {
    key: planKey,
    name: getPlanDisplayName(planKey, pkg),
    priceAmount: formatMxAmount(monthly) || landingT("askPrice"),
    pricePeriod: landingT("pricePerMonth"),
    priceCompare,
    priceNote: priceNoteParts.join(" · "),
    description,
    highlighted: isFeatured,
    badge: isFeatured ? landingT("badgeFeatured") : audienceBadge,
    audienceBadge,
    included,
    locked,
    lockedLabel: landingT("lockedSection"),
    cta: isFeatured ? landingT("ctaRegister") : landingT("ctaPlan"),
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
    buildPlanCard(key, packages[key] || DEFAULT_PACKAGES[key], featuredKey, packages),
  ).filter(Boolean);

  const creditSource = catalog?.creditPackages || DEFAULT_CREDIT_PACKAGES;
  const credits10 = creditSource.credits_10;

  const creditAddon = credits10
    ? {
        name: getCreditPackageDisplayName("credits_10", credits10),
        price: formatMxPrice(credits10.price),
        description: credits10.description || landingT("creditAddonDesc"),
        credits: credits10.credits,
      }
    : null;

  return { plans, creditAddon };
}
