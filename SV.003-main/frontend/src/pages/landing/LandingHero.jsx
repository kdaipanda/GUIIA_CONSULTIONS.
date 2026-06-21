import React from "react";
import {
  ClipboardList,
  Monitor,
  Package,
  Receipt,
  Stethoscope,
} from "lucide-react";
import { HERO_PRODUCT_SCREENSHOT } from "./landingPreviewData";
import { scrollToLandingProduct, scrollToLandingSection } from "./landingScroll";

const SERVICES = [
  { icon: Stethoscope, label: "Diagnóstico", productTab: "consultation" },
  { icon: ClipboardList, label: "Expediente", productTab: "consultation" },
  { icon: Package, label: "Inventario", href: "#features" },
  { icon: Receipt, label: "Ventas", href: "#features" },
];

const HERO_STATS = [
  { value: "11+", label: "especies con flujo" },
  { value: "CDS L4·L5", label: "soporte clínico" },
  { value: "LATAM", label: "enfoque regional" },
];

export function LandingHero({ setView }) {
  const handleServiceClick = (service) => {
    if (service.productTab) {
      scrollToLandingProduct(service.productTab);
      return;
    }
    if (service.href) scrollToLandingSection(service.href);
  };

  return (
    <section className="relative px-4 pb-20 pt-3 sm:px-8 sm:pb-20 sm:pt-4 lg:px-10 lg:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-8 sm:gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <div className="max-w-xl lg:py-6">
          <p className="text-sm font-medium text-guiaa-brand-navy/55 sm:text-base">
            Plataforma clínica · solo MVZ certificados
          </p>

          <h1 className="mt-3 text-[1.85rem] font-bold leading-[1.14] tracking-tight text-guiaa-brand-navy sm:text-5xl lg:text-[3rem]">
            Soporte CDS estructurado en tu{" "}
            <span className="text-guiaa-brand-green-dark">consulta</span>
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-guiaa-brand-navy/55 sm:mt-5 sm:text-base">
            Anamnesis, hallazgos y antecedentes integrados para hipótesis diagnósticas
            y planes terapéuticos basados en evidencia — multiespecie y pensado para
            Latinoamérica.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => setView("register")}
              className="w-full rounded-xl bg-guiaa-brand-green px-7 py-3.5 text-sm font-bold text-white transition hover:bg-guiaa-brand-green-dark sm:w-auto"
            >
              Comenzar registro
            </button>
            <button
              type="button"
              onClick={() => scrollToLandingProduct("species")}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-guiaa-brand-navy/10 bg-guiaa-sky-soft/40 px-4 py-3 text-sm font-semibold text-guiaa-brand-blue transition hover:bg-guiaa-sky-soft sm:w-auto sm:border-transparent sm:bg-transparent"
            >
              <Monitor size={15} aria-hidden />
              Ver producto
            </button>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-guiaa-brand-navy/10 pt-6 sm:mt-10 sm:flex sm:flex-wrap sm:gap-6 sm:pt-8">
            {HERO_STATS.map(({ value, label }) => (
              <div key={label} className="min-w-0">
                <dt className="text-base font-bold text-guiaa-brand-navy sm:text-xl">{value}</dt>
                <dd className="mt-0.5 text-[10px] leading-tight text-guiaa-brand-navy/45 sm:text-xs">
                  {label}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 grid grid-cols-4 gap-2 sm:mt-10 sm:gap-4">
            {SERVICES.map(({ icon: Icon, label, ...service }, index) => (
              <button
                key={label}
                type="button"
                onClick={() => handleServiceClick(service)}
                className="group flex flex-col items-center gap-1.5 text-center sm:gap-2"
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition group-hover:opacity-90 sm:h-14 sm:w-14 ${
                    index % 2 === 0 ? "bg-guiaa-brand-blue" : "bg-guiaa-brand-green"
                  }`}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden />
                </span>
                <span className="text-[10px] font-medium leading-tight text-guiaa-brand-navy/65 sm:text-xs">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="landing-hero-visual relative mx-auto w-full max-w-md pb-8 sm:max-w-lg sm:pb-10 lg:max-w-none lg:pb-0">
          <div
            className="absolute -right-1 top-6 bottom-10 hidden w-[calc(100%-1rem)] rounded-2xl border border-guiaa-brand-navy/10 bg-guiaa-brand-navy/[0.03] sm:block sm:-right-4 sm:top-8 sm:bottom-8"
            aria-hidden
          />

          <div className="absolute left-0 top-4 z-20 rounded-xl border border-guiaa-brand-navy/10 bg-white px-3 py-2 shadow-md sm:-left-3 sm:top-6 sm:py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-guiaa-brand-navy/40">
              Metodología
            </p>
            <p className="text-sm font-bold text-guiaa-brand-blue">CDS L4 · L5</p>
          </div>

          <div className="relative z-10 ml-2 mt-6 overflow-hidden rounded-2xl border border-guiaa-brand-navy/12 shadow-[0_16px_48px_-8px_rgba(12,45,77,0.2)] sm:ml-8 sm:mt-10">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/landing/consultation-species.png"
              className="aspect-[4/5] w-full object-cover sm:aspect-[5/6]"
            >
              <source src="/VG1.mp4" type="video/mp4" />
            </video>
          </div>

          <button
            type="button"
            onClick={() => scrollToLandingProduct("species")}
            className="landing-hero-screenshot absolute bottom-0 right-0 z-30 w-[min(48%,10.5rem)] overflow-hidden rounded-xl border border-white/80 bg-white text-left shadow-[0_12px_32px_-8px_rgba(12,45,77,0.35)] transition active:scale-[0.98] sm:-bottom-4 sm:w-[min(54%,13.5rem)] sm:hover:-translate-y-0.5 lg:right-4"
            aria-label="Ver capturas del producto GUIAA"
          >
            <div className="flex items-center gap-1.5 border-b border-guiaa-brand-navy/8 bg-guiaa-sky-soft/50 px-2 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-guiaa-brand-green" aria-hidden />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-guiaa-brand-navy/50">
                App en consulta
              </span>
            </div>
            <img
              src={HERO_PRODUCT_SCREENSHOT.src}
              alt={HERO_PRODUCT_SCREENSHOT.alt}
              className="block aspect-[16/11] w-full object-cover object-top"
              loading="eager"
              decoding="async"
            />
            <span className="block px-2 py-1.5 text-[10px] font-semibold text-guiaa-brand-blue">
              Explorar capturas →
            </span>
          </button>

          <div className="landing-hero-badge absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-white/20 bg-guiaa-brand-navy/90 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm sm:bottom-6 sm:px-4 sm:py-2 sm:text-xs lg:left-[42%]">
            <span className="h-1.5 w-1.5 rounded-full bg-guiaa-brand-green" aria-hidden />
            Soporte clínico · LATAM
          </div>
        </div>
      </div>
    </section>
  );
}
