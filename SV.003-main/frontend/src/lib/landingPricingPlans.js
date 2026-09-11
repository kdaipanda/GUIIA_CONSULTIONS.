/**
 * Tarjetas de precios de la landing — una por cada membresía del catálogo.
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

function formatMxPrice(amount, suffix = "") {
  if (amount == null || Number.isNaN(Number(amount))) return landingT("askPrice");
  return `$${Number(amount).toLocaleString(priceLocale())}${suffix}`;
}

function buildPlanCard(planKey, pkg, featuredKey) {
  if (!pkg) return null;

  const features = getPlanFeatureList(planKey, "monthly", pkg).slice(0, 6);
  const isFeatured = planKey === featuredKey;

  const speciesNote = pkg.species_scope ? `${pkg.species_scope}` : "";
  const annualHint = pkg.price_annual
    ? `${landingT("annual")} ${formatMxPrice(pkg.price_annual)}`
    : null;
  const priceNote = [speciesNote, annualHint, landingT("billingNote")]
    .filter(Boolean)
    .join(" · ");

  const descriptionKey = `planDescriptions.${planKey}`;
  const description = i18n.exists(descriptionKey, { ns: "landing" })
    ? landingT(descriptionKey)
    : pkg.description || "";

  return {
    key: planKey,
    name: getPlanDisplayName(planKey, pkg),
    price: formatMxPrice(pkg.price_monthly, landingT("pricePerMonth")),
    priceNote,
    description,
    highlighted: isFeatured,
    badge: isFeatured
      ? landingT("badgeFeatured")
      : pkg.consultations
        ? landingT("badgeConsultations", { count: pkg.consultations })
        : null,
    features,
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
    buildPlanCard(key, packages[key] || DEFAULT_PACKAGES[key], featuredKey),
  ).filter(Boolean);

  const creditSource = catalog?.creditPackages || DEFAULT_CREDIT_PACKAGES;
  const credits10 = creditSource.credits_10;

  const creditAddon = credits10
    ? {
        name: getCreditPackageDisplayName("credits_10", credits10),
        price: formatMxPrice(credits10.price),
        description:
          credits10.description || landingT("creditAddonDesc"),
        credits: credits10.credits,
      }
    : null;

  return { plans, creditAddon };
}
