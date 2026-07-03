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
import { MultiespecieCategoryIcons } from "./MultiespecieCategoryIcons";
import { scrollToLandingProduct } from "./landingScroll";

const PRIMARY_FEATURES = [
  {
    id: "diagnostico",
    icon: Stethoscope,
    title: "GUIAA Diagnóstico",
    description:
      "Anamnesis guiada, examen físico y soporte CDS L4/L5 para documentar el razonamiento diagnóstico veterinario.",
    productTab: "consultation",
  },
  {
    id: "expediente",
    icon: ClipboardList,
    title: "Expediente clínico",
    description:
      "Historial clínico por paciente: consultas previas, tratamientos y evolución entre visitas.",
    productTab: "consultation",
  },
  {
    id: "inventario",
    icon: Package,
    title: "Inventario",
    description:
      "Stock de medicamentos e insumos clínicos, alertas de reorden y trazabilidad en consulta.",
    productTab: null,
  },
  {
    id: "ventas",
    icon: Receipt,
    title: "Ventas",
    description:
      "Cobro de servicios y productos desde la consulta, vinculado al acto clínico del paciente.",
    productTab: null,
  },
];

const SECONDARY_FEATURES = [
  {
    id: "multiespecie",
    title: "Multiespecie",
    description: "11 categorías con formularios veterinarios dedicados por especie.",
    useCategoryIcons: true,
    productTab: "species",
  },
  {
    id: "panel",
    icon: BarChart3,
    title: "Panel clínico",
    description: "Indicadores de consultas, actividad clínica y resumen de tu práctica MVZ.",
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
    icon: BookOpen,
    title: "Capacitación inicial",
    description: "Recorrido guiado para dominar la plataforma desde tu primera consulta.",
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
      <div className="landing-container">
        <div className="landing-section-head-wide">
          <div className="landing-section-head">
            <p className="landing-eyebrow">Módulos del consultorio</p>
            <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
              Clínica y operación en un solo entorno
            </h2>
            <p className="landing-lead mt-4">
              Diagnóstico, expediente, inventario y ventas — diseñados para la rutina del
              médico veterinario, no para un dashboard genérico.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToLandingProduct("species")}
            className="landing-link-arrow inline-flex min-h-11 shrink-0 items-center gap-1"
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
              className={`rounded-2xl p-6 landing-card ${
                index === 0 ? "landing-card-accent-top landing-card-featured" : ""
              }`}
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
