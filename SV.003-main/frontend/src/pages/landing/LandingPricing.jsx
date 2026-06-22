import React, { useEffect, useState } from "react";
import { Check, Coins, ShieldCheck } from "lucide-react";
import { getBackendUrl } from "../../lib/backendUrl";
import { buildLandingPricingPlans } from "../../lib/landingPricingPlans";
import {
  DEFAULT_CREDIT_PACKAGES,
  parseMembershipCatalogResponse,
} from "../../lib/membershipPlans";

const FALLBACK = buildLandingPricingPlans(null);

export function LandingPricing({ setView }) {
  const [plans, setPlans] = useState(FALLBACK.plans);
  const [creditAddon, setCreditAddon] = useState(FALLBACK.creditAddon);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const apiBase = getBackendUrl();
        const [membershipRes, creditsRes] = await Promise.all([
          fetch(`${apiBase}/api/membership/packages`),
          fetch(`${apiBase}/api/consultations/credit-packages`).catch(() => null),
        ]);

        if (cancelled || !membershipRes.ok) return;

        const membershipData = await membershipRes.json();
        const catalog = parseMembershipCatalogResponse(membershipData);

        let creditPackages = DEFAULT_CREDIT_PACKAGES;
        if (creditsRes?.ok) {
          const creditsData = await creditsRes.json();
          if (creditsData?.packages && Object.keys(creditsData.packages).length > 0) {
            creditPackages = creditsData.packages;
          }
        }

        const built = buildLandingPricingPlans({
          packages: catalog.packages,
          featuredPlan: catalog.featuredPlan,
          creditPackages,
        });

        setPlans(built.plans);
        setCreditAddon(built.creditAddon);
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
          <p className="landing-eyebrow">Membresía MVZ</p>
          <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
            Planes para tu consultorio veterinario
          </h2>
          <p className="landing-lead mt-4">
            Básica, Profesional y Premium — elige el volumen de consultas CDS y el alcance
            multiespecie que necesitas. Verificación de cédula incluida.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
          {plans.map(
            ({ key, name, price, priceNote, description, highlighted, badge, features, cta, action }) => (
              <article
                key={key}
                className={`landing-card relative flex flex-col rounded-2xl p-6 sm:p-7 ${
                  highlighted
                    ? "landing-pricing-featured landing-card-accent-top md:col-span-2 lg:col-span-1 lg:-mt-2 lg:mb-2 lg:py-8"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-guiaa-brand-navy">{name}</h3>
                    <p className="landing-stat-value mt-1 text-2xl text-guiaa-brand-green-dark">
                      {price}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-guiaa-brand-ink-muted">
                      {priceNote}
                    </p>
                  </div>
                  {badge && (
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${
                        highlighted
                          ? "bg-guiaa-brand-blue/10 text-guiaa-brand-blue"
                          : "bg-guiaa-sky-soft text-guiaa-brand-navy/70"
                      }`}
                    >
                      {badge}
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

        {creditAddon && (
          <div className="landing-trust-banner mt-6 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="landing-trust-icon shrink-0">
                <Coins size={17} className="text-guiaa-brand-blue" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-guiaa-brand-navy">{creditAddon.name}</p>
                <p className="mt-0.5 text-sm text-guiaa-brand-ink-muted">
                  {creditAddon.description}
                </p>
              </div>
            </div>
            <p className="shrink-0 text-lg font-bold text-guiaa-brand-green-dark">
              {creditAddon.price}
            </p>
          </div>
        )}

        <div className="landing-trust-banner mt-4 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-guiaa-brand-blue" aria-hidden />
            <p className="text-sm text-guiaa-brand-ink-muted">
              Solo médicos veterinarios certificados. La verificación de cédula es parte
              del registro inicial.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView("membership")}
            className="landing-link-arrow shrink-0"
          >
            Comparar planes en detalle →
          </button>
        </div>
      </div>
    </section>
  );
}
