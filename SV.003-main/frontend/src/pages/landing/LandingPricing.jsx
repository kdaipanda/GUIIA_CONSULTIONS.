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

        <div className="landing-pricing-grid grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
          {plans.map(
            ({ key, name, price, priceNote, description, highlighted, badge, features, cta, action }) => (
              <article
                key={key}
                className={`landing-pricing-card landing-card relative flex flex-col ${
                  highlighted
                    ? "landing-pricing-card--featured landing-pricing-featured landing-card-accent-top md:col-span-2 lg:col-span-1"
                    : ""
                }`}
              >
                <div className="landing-pricing-card-head">
                  <div>
                    <h3 className="landing-pricing-plan-name">{name}</h3>
                    <p className="landing-pricing-price">{price}</p>
                    <p className="landing-pricing-price-note">{priceNote}</p>
                  </div>
                  {badge && (
                    <span
                      className={`landing-pricing-badge ${
                        highlighted
                          ? "landing-pricing-badge--featured"
                          : "landing-pricing-badge--quota"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </div>

                <p className="landing-pricing-desc">{description}</p>

                <ul className="landing-pricing-features">
                  {features.map((feature) => (
                    <li key={feature} className="landing-pricing-feature">
                      <Check size={15} className="landing-pricing-feature-icon" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setView(action)}
                  className={`landing-pricing-cta ${
                    highlighted
                      ? "landing-btn-primary"
                      : "landing-btn-secondary justify-center"
                  }`}
                >
                  {cta}
                </button>
              </article>
            ),
          )}
        </div>

        {creditAddon && (
          <div className="landing-pricing-addon">
            <div className="landing-pricing-addon-body">
              <span className="landing-pricing-addon-icon" aria-hidden>
                <Coins size={18} />
              </span>
              <div>
                <p className="landing-pricing-addon-title">{creditAddon.name}</p>
                <p className="landing-pricing-addon-desc">{creditAddon.description}</p>
              </div>
            </div>
            <p className="landing-pricing-addon-price">{creditAddon.price}</p>
          </div>
        )}

        <div className="landing-pricing-trust landing-trust-banner flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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
