import React from "react";
import { ArrowUpRight } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  Layers,
  Package,
  Receipt,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { MultiespecieCategoryIcons } from "./MultiespecieCategoryIcons";
import { scrollToLandingProduct } from "./landingScroll";

const PRIMARY_FEATURES = [
  {
    id: "diagnostico",
    icon: Stethoscope,
    title: "GUIAA Diagnóstico",
    description:
      "Anamnesis guiada, hallazgos clínicos y soporte CDS L4/L5 para estructurar el razonamiento diagnóstico.",
    productTab: "consultation",
  },
  {
    id: "expediente",
    icon: ClipboardList,
    title: "Expediente clínico",
    description:
      "Historial por paciente, consultas previas y seguimiento longitudinal en un solo lugar.",
    productTab: "consultation",
  },
  {
    id: "inventario",
    icon: Package,
    title: "Inventario",
    description:
      "Control de stock, alertas de reorden y trazabilidad de insumos clínicos.",
    productTab: null,
  },
  {
    id: "ventas",
    icon: Receipt,
    title: "Ventas",
    description:
      "Registro de servicios y productos con flujo ágil desde la consulta.",
    productTab: null,
  },
];

const SECONDARY_FEATURES = [
  {
    id: "multiespecie",
    title: "Multiespecie",
    description: "Perros, gatos, exóticos y más con flujos adaptados por especie.",
    useCategoryIcons: true,
    productTab: "species",
  },
  {
    id: "panel",
    icon: BarChart3,
    title: "Panel clínico",
    description: "Métricas de consulta y visión general de tu práctica.",
    productTab: "dashboard",
  },
  {
    id: "integracion",
    icon: Layers,
    title: "Integración clínica",
    description: "Diagnóstico, expediente, inventario y ventas en un solo contexto.",
    productTab: "consultation",
  },
  {
    id: "onboarding",
    icon: Sparkles,
    title: "Onboarding guiado",
    description: "Recorrido inicial para dominar la plataforma desde el primer día.",
    productTab: "dashboard",
  },
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

function ProductLink({ productTab }) {
  if (!productTab) return null;

  return (
    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-guiaa-brand-blue transition group-hover:gap-1.5">
      Ver en producto
      <ArrowUpRight size={13} aria-hidden />
    </span>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="landing-section landing-section-alt">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="landing-eyebrow">Módulos principales</p>
            <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
              Cuatro pilares de tu consulta
            </h2>
            <p className="landing-lead mt-4">
              Herramientas clínicas y operativas con la misma identidad visual y flujo
              coherente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToLandingProduct("species")}
            className="landing-link-arrow shrink-0"
          >
            Ver capturas del producto
            <ArrowUpRight size={15} aria-hidden />
          </button>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {PRIMARY_FEATURES.map(({ id, icon, title, description, productTab }, index) => (
            <FeatureCard
              key={id}
              productTab={productTab}
              className="rounded-2xl p-6 landing-card"
            >
              <FeatureIcon icon={icon} alternate={index % 2 === 1} />
              <h3 className="mt-4 text-lg font-semibold text-guiaa-brand-navy">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-guiaa-brand-ink-muted">
                {description}
              </p>
              <ProductLink productTab={productTab} />
            </FeatureCard>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SECONDARY_FEATURES.map(
            ({ id, icon, title, description, useCategoryIcons, productTab }, index) => (
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
                <h3 className="mt-3 text-sm font-semibold text-guiaa-brand-navy">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-guiaa-brand-ink-muted">
                  {description}
                </p>
                <ProductLink productTab={productTab} />
              </FeatureCard>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
