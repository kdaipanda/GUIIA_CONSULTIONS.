import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { LANDING_SCREENSHOTS } from "./landingPreviewData";
import { LANDING_PREVIEW_MAP } from "./LandingAppPreview";
import {
  parseProductTabFromHash,
  setLandingProductTabHash,
  subscribeLandingProductTab,
} from "./landingScroll";
function PreviewFrame({ previewId }) {
  const Preview = LANDING_PREVIEW_MAP[previewId];
  if (!Preview) return null;

  return (
    <div className="landing-preview-viewport">
      <div className="landing-preview-scaler">
        <Preview />
      </div>
    </div>
  );
}

function ScreenshotPanel({ shot, useFallback, onFallback }) {
  if (!useFallback) {
    return (
      <img
        src={shot.src}
        alt={shot.alt}
        className="block h-full w-full object-cover object-top"
        loading="lazy"
        decoding="async"
        onError={onFallback}
      />
    );
  }

  return <PreviewFrame previewId={shot.id} />;
}

export function LandingProductShowcase() {
  const [activeId, setActiveId] = useState(() => parseProductTabFromHash());
  const [fallbackIds, setFallbackIds] = useState(() => new Set());

  useEffect(() => subscribeLandingProductTab(setActiveId), []);

  useEffect(() => {
    const syncFromHash = () => setActiveId(parseProductTabFromHash());
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const activeShot =
    LANDING_SCREENSHOTS.find((shot) => shot.id === activeId) || LANDING_SCREENSHOTS[0];

  const markFallback = (id) => {
    setFallbackIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <section id="product" className="scroll-mt-24 border-y border-guiaa-brand-navy/8 bg-white/60 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-widest text-guiaa-brand-blue">
              Producto en acción
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-guiaa-brand-navy sm:text-3xl">
              La misma interfaz que usas en consulta
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-guiaa-brand-navy/55 sm:text-base">
              Capturas del flujo real de GUIAA: selección multiespecie, consulta
              clínica y panel del MVZ.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-guiaa-brand-navy/70">
              {[
                "Formularios con los estilos y componentes de la app",
                "Progreso de consulta visible en sidebar",
                "Panel con resumen de actividad clínica",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <ChevronRight
                    size={16}
                    className="mt-0.5 shrink-0 text-guiaa-brand-green"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div
              className="mt-8 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Vistas del producto"
              onKeyDown={(event) => {
                const index = LANDING_SCREENSHOTS.findIndex((shot) => shot.id === activeId);
                if (index < 0) return;

                let nextIndex = index;
                if (event.key === "ArrowRight") {
                  nextIndex = (index + 1) % LANDING_SCREENSHOTS.length;
                } else if (event.key === "ArrowLeft") {
                  nextIndex = (index - 1 + LANDING_SCREENSHOTS.length) % LANDING_SCREENSHOTS.length;
                } else {
                  return;
                }

                event.preventDefault();
                const nextShot = LANDING_SCREENSHOTS[nextIndex];
                setActiveId(nextShot.id);
                setLandingProductTabHash(nextShot.id);
              }}
            >
              {LANDING_SCREENSHOTS.map((shot) => {
                const isActive = shot.id === activeId;
                return (
                  <button
                    key={shot.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => {
                      setActiveId(shot.id);
                      setLandingProductTabHash(shot.id);
                    }}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                      isActive
                        ? "bg-guiaa-brand-blue text-white"
                        : "border border-guiaa-brand-navy/12 bg-white text-guiaa-brand-navy/65 hover:border-guiaa-brand-navy/20"
                    }`}
                  >
                    {shot.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-guiaa-brand-navy/50">{activeShot.caption}</p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-guiaa-brand-navy/12 bg-slate-100 shadow-[0_20px_50px_-12px_rgba(12,45,77,0.22)]">
              <div className="flex items-center gap-2 border-b border-guiaa-brand-navy/10 bg-white px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-3 truncate text-[11px] font-medium text-guiaa-brand-navy/45">
                  GUIAA · {activeShot.label}
                </span>
              </div>

              <div
                className="landing-preview-panel relative bg-slate-50"
                role="tabpanel"
                aria-label={activeShot.label}
              >
                <div key={activeShot.id} className="landing-product-panel-enter h-full">
                  <ScreenshotPanel
                    shot={activeShot}
                    useFallback={fallbackIds.has(activeShot.id)}
                    onFallback={() => markFallback(activeShot.id)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
