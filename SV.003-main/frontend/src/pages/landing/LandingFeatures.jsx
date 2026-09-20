import React from "react";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MultiespecieCategoryIcons } from "./MultiespecieCategoryIcons";
import { onLandingAnchorClick, productTabHref } from "./landingScroll";

const PRIMARY_FEATURES = [
  { id: "diagnostico", productTab: "consultation", featured: true },
  { id: "expediente", productTab: "consultation" },
  { id: "inventario", productTab: null },
  { id: "ventas", productTab: null },
];

const SECONDARY_FEATURES = [
  { id: "multiespecie", useCategoryIcons: true, productTab: "species" },
  { id: "panel", productTab: "dashboard" },
  { id: "integracion", productTab: "consultation" },
  { id: "onboarding", productTab: "dashboard" },
];

function FeatureCard({ children, productTab, className = "", ariaLabel }) {
  if (!productTab) {
    return <article className={className}>{children}</article>;
  }

  return (
    <a
      href={productTabHref(productTab)}
      onClick={(event) => onLandingAnchorClick(event, { productTab })}
      className={`${className} group block w-full text-left landing-card landing-card-interactive`}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}

function ProductLink({ productTab, label }) {
  if (!productTab) return null;

  return (
    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-guiaa-brand-blue transition group-hover:gap-1.5" aria-hidden>
      {label}
      <ArrowUpRight size={13} aria-hidden />
    </span>
  );
}

export function LandingFeatures() {
  const { t } = useTranslation("landing");
  const featured = PRIMARY_FEATURES.find((f) => f.featured);
  const restPrimary = PRIMARY_FEATURES.filter((f) => !f.featured);

  return (
    <section id="features" className="landing-section">
      <div className="landing-container">
        <div className="landing-section-head-wide">
          <div className="landing-section-head max-w-2xl">
            <p className="landing-eyebrow">{t("features.eyebrow")}</p>
            <h2 className="landing-section-title text-3xl text-guiaa-brand-navy sm:text-4xl">
              {t("features.title")}
            </h2>
            <p className="landing-lead mt-4">{t("features.lead")}</p>
          </div>
          <a
            href={productTabHref("species")}
            onClick={(event) => onLandingAnchorClick(event, { productTab: "species" })}
            className="landing-link-arrow inline-flex min-h-11 shrink-0 items-center gap-1"
          >
            {t("features.viewProduct")}
            <ArrowUpRight size={15} aria-hidden />
          </a>
        </div>

        <FeatureCard
          productTab={featured.productTab}
          className="landing-feature-hero mt-12 p-6 sm:p-8 landing-card"
          ariaLabel={t("features.seeInProductFor", {
            title: t(`features.primary.${featured.id}.title`),
          })}
        >
          <p className="landing-feature-unique">{t("features.uniqueBadge")}</p>
          <h3 className="mt-2 text-xl font-semibold text-guiaa-brand-navy sm:text-2xl">
            {t(`features.primary.${featured.id}.title`)}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-guiaa-brand-ink-muted sm:text-base">
            {t(`features.primary.${featured.id}.description`)}
          </p>
          <ProductLink productTab={featured.productTab} label={t("features.seeInProduct")} />
        </FeatureCard>

        <div className="landing-feature-list mt-4">
          {restPrimary.map(({ id, productTab }) => (
            <FeatureCard
              key={id}
              productTab={productTab}
              className="landing-feature-row landing-card"
              ariaLabel={
                productTab
                  ? t("features.seeInProductFor", {
                      title: t(`features.primary.${id}.title`),
                    })
                  : undefined
              }
            >
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-guiaa-brand-navy">
                  {t(`features.primary.${id}.title`)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-guiaa-brand-ink-muted">
                  {t(`features.primary.${id}.description`)}
                </p>
              </div>
              <ProductLink productTab={productTab} label={t("features.seeInProduct")} />
            </FeatureCard>
          ))}
        </div>

        <div className="landing-feature-secondary mt-6">
          {SECONDARY_FEATURES.map(({ id, useCategoryIcons, productTab }) => (
            <FeatureCard
              key={id}
              productTab={productTab}
              className="landing-feature-secondary-item landing-card"
              ariaLabel={
                productTab
                  ? t("features.seeInProductFor", {
                      title: t(`features.secondary.${id}.title`),
                    })
                  : undefined
              }
            >
              {useCategoryIcons ? (
                <div className="landing-feature-species mb-2" aria-hidden>
                  <MultiespecieCategoryIcons compact />
                </div>
              ) : null}
              <h3 className="text-sm font-semibold text-guiaa-brand-navy">
                {t(`features.secondary.${id}.title`)}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-guiaa-brand-ink-muted">
                {t(`features.secondary.${id}.description`)}
              </p>
              <ProductLink productTab={productTab} label={t("features.seeInProduct")} />
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
}
