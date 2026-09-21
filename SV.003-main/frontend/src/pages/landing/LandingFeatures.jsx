import React from "react";
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
    <span className="landing-feature-link mt-4 text-xs font-semibold text-guiaa-brand-blue" aria-hidden>
      {label}
    </span>
  );
}

/** Índice clínico: un bloque dominante + filas + franja densa (rompe grid SaaS). */
export function LandingFeatures() {
  const { t } = useTranslation("landing");
  const featured = PRIMARY_FEATURES.find((f) => f.featured);
  const restPrimary = PRIMARY_FEATURES.filter((f) => !f.featured);

  return (
    <section id="features" className="landing-section landing-features-section">
      <div className="landing-container">
        <div className="landing-features-head">
          <h2 className="landing-section-title text-guiaa-brand-navy">
            {t("features.title")}
          </h2>
          <div className="landing-features-head-side">
            <p className="landing-lead">{t("features.lead")}</p>
            <a
              href={productTabHref("species")}
              onClick={(event) => onLandingAnchorClick(event, { productTab: "species" })}
              className="landing-link-quiet"
            >
              {t("features.viewProduct")}
            </a>
          </div>
        </div>

        <FeatureCard
          productTab={featured.productTab}
          className="landing-feature-hero mt-10 p-6 sm:p-8 landing-card"
          ariaLabel={t("features.seeInProductFor", {
            title: t(`features.primary.${featured.id}.title`),
          })}
        >
          <h3 className="text-xl font-semibold text-guiaa-brand-navy sm:text-2xl">
            {t(`features.primary.${featured.id}.title`)}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-guiaa-brand-ink-muted sm:text-base">
            {t(`features.primary.${featured.id}.description`)}
          </p>
          <ProductLink productTab={featured.productTab} label={t("features.seeInProduct")} />
        </FeatureCard>

        <div className="landing-feature-list mt-3">
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

        <ul className="landing-feature-strip" aria-label={t("features.stripAria")}>
          {SECONDARY_FEATURES.map(({ id, useCategoryIcons, productTab }) => {
            const title = t(`features.secondary.${id}.title`);
            const body = (
              <>
                {useCategoryIcons ? (
                  <span className="landing-feature-strip-icons" aria-hidden>
                    <MultiespecieCategoryIcons compact />
                  </span>
                ) : null}
                <span className="landing-feature-strip-title">{title}</span>
                <span className="landing-feature-strip-desc">
                  {t(`features.secondary.${id}.description`)}
                </span>
              </>
            );

            return (
              <li key={id}>
                {productTab ? (
                  <a
                    href={productTabHref(productTab)}
                    onClick={(event) => onLandingAnchorClick(event, { productTab })}
                    className="landing-feature-strip-item"
                    aria-label={t("features.seeInProductFor", { title })}
                  >
                    {body}
                  </a>
                ) : (
                  <div className="landing-feature-strip-item">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
