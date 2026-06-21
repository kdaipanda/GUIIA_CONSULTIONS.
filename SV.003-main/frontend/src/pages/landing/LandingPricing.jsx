import React, { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { BACKEND_URL } from "../../lib/backendUrl";
import { buildLandingPricingPlans } from "../../lib/landingPricingPlans";
import { parseMembershipCatalogResponse } from "../../lib/membershipPlans";

const FALLBACK_PLANS = buildLandingPricingPlans(null);

export function LandingPricing({ setView }) {
  const [plans, setPlans] = useState(FALLBACK_PLANS);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/membership/packages`);
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const catalog = parseMembershipCatalogResponse(data);
        setPlans(
          buildLandingPricingPlans({
            packages: catalog.packages,
            featuredPlan: catalog.featuredPlan,
          }),
        );
      } catch {
        /* fallback estático */
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="pricing" className="landing-section landing-section-alt">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-xl">
          <p className="landing-eyebrow">Acceso profesional</p>
          <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
            Planes para tu consulta
          </h2>
          <p className="landing-lead mt-4">
            Registro exclusivo para MVZ. Verificamos cédula profesional antes de activar
            tu cuenta clínica.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch">
          {plans.map(
            ({ name, price, priceNote, description, highlighted, features, cta, action }) => (
              <article
                key={name}
                className={`landing-card relative flex flex-col rounded-2xl p-6 sm:p-8 ${
                  highlighted
                    ? "ring-1 ring-guiaa-brand-blue/12 shadow-[0_10px_36px_-10px_rgba(38,91,147,0.2)]"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-guiaa-brand-navy">{name}</h3>
                    <p className="mt-1 text-2xl font-bold text-guiaa-brand-green-dark">{price}</p>
                    <p className="mt-0.5 text-xs text-guiaa-brand-ink-muted">{priceNote}</p>
                  </div>
                  {highlighted && (
                    <span className="rounded-md bg-guiaa-brand-blue/10 px-2 py-1 text-[11px] font-semibold text-guiaa-brand-blue">
                      Más usado
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-guiaa-brand-ink-muted">
                  {description}
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-guiaa-brand-navy/80"
                    >
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-guiaa-brand-green"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setView(action)}
                  className={`mt-8 w-full ${
                    highlighted
                      ? "landing-btn-primary"
                      : "landing-btn-secondary justify-center py-3 font-bold text-guiaa-brand-navy"
                  }`}
                >
                  {cta}
                </button>
              </article>
            ),
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-xl border border-guiaa-brand-navy/10 bg-guiaa-sky-soft/35 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-guiaa-brand-blue" aria-hidden />
            <p className="text-sm text-guiaa-brand-navy/65">
              Solo médicos veterinarios certificados. La verificación de cédula es parte
              del registro inicial.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView("register")}
            className="shrink-0 text-sm font-semibold text-guiaa-brand-blue transition hover:text-guiaa-brand-navy"
          >
            Iniciar verificación →
          </button>
        </div>
      </div>
    </section>
  );
}
