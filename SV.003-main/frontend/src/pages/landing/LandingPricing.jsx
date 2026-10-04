import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Coins, ShieldCheck, Stethoscope, PawPrint, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MembershipPromoOffer } from "../../components/MembershipPromoOffer";
import { getBackendUrl } from "../../lib/backendUrl";
import { buildLandingPricingPlans } from "../../lib/landingPricingPlans";
import { trackMetaViewContent } from "../../lib/metaPixel";
import {
  DEFAULT_CREDIT_PACKAGES,
  parseMembershipCatalogResponse,
} from "../../lib/membershipPlans";
import "../../styles/membershipPromoOffer.css";

const PLAN_ICONS = {
  basic: PawPrint,
  professional: Stethoscope,
  premium: Sparkles,
};

const PREMIUM_PROMO_CODE = "FRIENDS40";

export function LandingPricing({ setView }) {
  const { t, i18n } = useTranslation("landing");
  const [catalog, setCatalog] = useState(null);
  const pricingRef = useRef(null);
  const pricingViewTracked = useRef(false);

  const { plans, creditAddon } = useMemo(
    () => buildLandingPricingPlans(catalog),
    [catalog, i18n.language],
  );

  useEffect(() => {
    const section = pricingRef.current;
    if (!section || pricingViewTracked.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || pricingViewTracked.current) return;
        pricingViewTracked.current = true;
        trackMetaViewContent("Pricing");
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

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
        const parsed = parseMembershipCatalogResponse(membershipData);

        let creditPackages = DEFAULT_CREDIT_PACKAGES;
        if (creditsRes?.ok) {
          const creditsData = await creditsRes.json();
          if (creditsData?.packages && Object.keys(creditsData.packages).length > 0) {
            creditPackages = creditsData.packages;
          }
        }

        setCatalog({
          packages: parsed.packages,
          featuredPlan: parsed.featuredPlan,
          creditPackages,
        });
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
    <section id="pricing" ref={pricingRef} className="landing-section landing-pricing-section">
      <div className="landing-container">
        <div className="max-w-xl">
          <h2 className="landing-section-title text-guiaa-brand-navy">
            {t("pricing.title")}
          </h2>
          <p className="landing-lead mt-4">{t("pricing.lead")}</p>
          <p className="landing-pricing-trial-note mt-3 text-sm font-semibold text-guiaa-brand-green-dark">
            {t("pricing.trialNote")}
          </p>
          <p className="landing-pricing-roi-note mt-2 text-sm text-guiaa-brand-ink-muted">
            {t("pricing.roiNote")}
          </p>
        </div>

        <div className="landing-pricing-grid">
          {plans.map((plan) => {
            const {
              key,
              name,
              priceAmount,
              pricePeriod,
              priceCompare,
              priceNote,
              highlighted,
              audienceBadge,
              badge,
              included,
              locked,
              lockedLabel,
              cta,
              action,
            } = plan;
            const PlanIcon = PLAN_ICONS[key] || PawPrint;

            return (
              <article
                key={key}
                className={`landing-pricing-card${
                  highlighted ? " landing-pricing-card--featured" : ""
                }`}
                aria-labelledby={`pricing-plan-${key}`}
              >
                <div className="landing-pricing-card-top">
                  <div className="landing-pricing-card-meta">
                    <div className="landing-pricing-plan-label">
                      <PlanIcon size={16} strokeWidth={1.75} aria-hidden />
                      <h3 id={`pricing-plan-${key}`} className="landing-pricing-plan-name">
                        {name}
                      </h3>
                    </div>
                    {(audienceBadge || badge) && (
                      <span
                        className={`landing-pricing-badge${
                          highlighted ? " landing-pricing-badge--featured" : ""
                        }`}
                      >
                        {highlighted ? badge : audienceBadge}
                      </span>
                    )}
                  </div>

                  <div className="landing-pricing-price-row">
                    <div className="landing-pricing-price-main">
                      <span className="landing-pricing-price">{priceAmount}</span>
                      <span className="landing-pricing-price-period">{pricePeriod}</span>
                    </div>
                    {priceCompare && (
                      <span className="landing-pricing-price-compare">{priceCompare}</span>
                    )}
                  </div>

                  {priceNote && <p className="landing-pricing-price-note">{priceNote}</p>}

                  {key === "premium" && (
                    <MembershipPromoOffer
                      badge={t("pricing.promoBadge")}
                      message={t("pricing.promoMessage")}
                      code={PREMIUM_PROMO_CODE}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => setView(action)}
                    className={`landing-pricing-cta${
                      highlighted ? " landing-pricing-cta--primary" : " landing-pricing-cta--secondary"
                    }`}
                  >
                    {cta}
                  </button>
                </div>

                <div className="landing-pricing-card-body">
                  <ul className="landing-pricing-features">
                    {included.map((feature) => (
                      <li key={feature} className="landing-pricing-feature">
                        <span className="landing-pricing-feature-mark landing-pricing-feature-mark--ok" aria-hidden>
                          <Check size={11} strokeWidth={3} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {locked.length > 0 && (
                    <>
                      <p className="landing-pricing-divider">
                        <span>{lockedLabel}</span>
                      </p>
                      <ul className="landing-pricing-features landing-pricing-features--locked">
                        {locked.map((feature) => (
                          <li key={feature} className="landing-pricing-feature landing-pricing-feature--locked">
                            <span className="landing-pricing-feature-mark landing-pricing-feature-mark--no" aria-hidden>
                              <X size={11} strokeWidth={3} />
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </article>
            );
          })}
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

        <div className="landing-pricing-trust landing-trust-banner mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-guiaa-brand-blue" aria-hidden />
            <p className="text-sm text-guiaa-brand-ink-muted">{t("pricing.trustNote")}</p>
          </div>
          <button
            type="button"
            onClick={() => setView("membership")}
            className="landing-link-arrow inline-flex min-h-11 shrink-0 items-center"
          >
            {t("pricing.comparePlans")}
          </button>
        </div>
      </div>
    </section>
  );
}
