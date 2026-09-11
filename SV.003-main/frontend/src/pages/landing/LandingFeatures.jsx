import React from "react";
import { ArrowUpRight } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Layers,
  Package,
  Receipt,
  Stethoscope,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { MultiespecieCategoryIcons } from "./MultiespecieCategoryIcons";
import { scrollToLandingProduct } from "./landingScroll";

const PRIMARY_FEATURES = [
  { id: "diagnostico", icon: Stethoscope, productTab: "consultation" },
  { id: "expediente", icon: ClipboardList, productTab: "consultation" },
  { id: "inventario", icon: Package, productTab: null },
  { id: "ventas", icon: Receipt, productTab: null },
];

const SECONDARY_FEATURES = [
  { id: "multiespecie", useCategoryIcons: true, productTab: "species" },
  { id: "panel", icon: BarChart3, productTab: "dashboard" },
  { id: "integracion", icon: Layers, productTab: "consultation" },
  { id: "onboarding", icon: BookOpen, productTab: "dashboard" },
];

function FeatureIcon({ icon: Icon, alternate }) {
  return (
    <div
      className={`inline-flex rounded-lg p-2.5 ${
        alternate
          ? "bg-guiaa-brand-green/10 text-guiaa-brand-green-dark"
          : "bg-guiaa-brand-blue/10 text-guiaa-brand-blue"
      }`}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden />
    </div>
  );
}

function FeatureCard({ children, productTab, className = "" }) {
  const interactive = Boolean(productTab);

  if (!interactive) {
    return <article className={className}>{children}</article>;
  }

  return (
    <button
      type="button"
      onClick={() => scrollToLandingProduct(productTab)}
      className={`${className} group w-full text-left landing-card landing-card-interactive`}
    >
      {children}
    </button>
  );
}

function ProductLink({ productTab, label }) {
  if (!productTab) return null;

  return (
    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-guiaa-brand-blue transition group-hover:gap-1.5">
      {label}
      <ArrowUpRight size={13} aria-hidden />
    </span>
  );
}

export function LandingFeatures() {
  const { t } = useTranslation("landing");

  return (
    <section id="features" className="landing-section landing-section-alt">
      <div className="landing-container">
        <div className="landing-section-head-wide">
          <div className="landing-section-head">
            <p className="landing-eyebrow">{t("features.eyebrow")}</p>
            <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
              {t("features.title")}
            </h2>
            <p className="landing-lead mt-4">{t("features.lead")}</p>
          </div>
          <button
            type="button"
            onClick={() => scrollToLandingProduct("species")}
            className="landing-link-arrow inline-flex min-h-11 shrink-0 items-center gap-1"
          >
            {t("features.viewProduct")}
            <ArrowUpRight size={15} aria-hidden />
          </button>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {PRIMARY_FEATURES.map(({ id, icon, productTab }, index) => (
            <FeatureCard
              key={id}
              productTab={productTab}
              className={`rounded-2xl p-6 landing-card ${
                index === 0 ? "landing-card-accent-top landing-card-featured" : ""
              }`}
            >
              <FeatureIcon icon={icon} alternate={index % 2 === 1} />
              <h3 className="mt-4 text-lg font-semibold text-guiaa-brand-navy">
                {t(`features.primary.${id}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-guiaa-brand-ink-muted">
                {t(`features.primary.${id}.description`)}
              </p>
              <ProductLink productTab={productTab} label={t("features.seeInProduct")} />
            </FeatureCard>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SECONDARY_FEATURES.map(
            ({ id, icon, useCategoryIcons, productTab }, index) => (
              <FeatureCard
                key={id}
                productTab={productTab}
                className="rounded-2xl p-5 landing-card"
              >
                {useCategoryIcons ? (
                  <div className="rounded-xl border border-guiaa-brand-navy/8 bg-guiaa-sky-soft/40 p-2">
                    <MultiespecieCategoryIcons compact />
                  </div>
                ) : (
                  <FeatureIcon icon={icon} alternate={index % 2 === 1} />
                )}
                <h3 className="mt-3 text-sm font-semibold text-guiaa-brand-navy">
                  {t(`features.secondary.${id}.title`)}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-guiaa-brand-ink-muted">
                  {t(`features.secondary.${id}.description`)}
                </p>
                <ProductLink productTab={productTab} label={t("features.seeInProduct")} />
              </FeatureCard>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
