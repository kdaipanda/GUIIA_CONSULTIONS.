import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Check,
  ClipboardList,
  Package,
  Receipt,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { GuiaaBrandLockup } from "../components/GuiaaBrandLockup";
import { AuthPageShell } from "../layout/AuthPageShell";
import { useVet } from "../context/VetContext";
import { BACKEND_URL } from "../lib/backendUrl";
import { getAuthHeaders } from "../lib/authHeaders";
import {
  DEFAULT_CREDIT_PACKAGES,
  DEFAULT_PACKAGES,
  MEMBERSHIP_INFO_ITEMS,
  parseMembershipCatalogResponse,
  getMembershipStatusText,
  getPlanFeatureList,
} from "../lib/membershipPlans";
import { trackMetaInitiateCheckout } from "../lib/metaPixel";
import "./membershipPage.css";

const INFO_ICONS = {
  cds: Stethoscope,
  clinic: ClipboardList,
  species: Sparkles,
  evidence: BookOpen,
};

function MembershipPlans({ veterinarian, packages, billingCycle, loading, featuredPlanKey, onPurchase }) {
  const entries = Object.entries(packages);

  if (!entries.length) {
    return (
      <p className="membership-hero" style={{ paddingTop: 0 }}>
        Cargando planes…
      </p>
    );
  }

  return (
    <div className="pricing-grid">
      {entries.map(([key, pkg]) => {
        const price = billingCycle === "annual" ? pkg.price_annual : pkg.price_monthly;
        const periodText = billingCycle === "annual" ? "MXN/año" : "MXN/mes";
        const monthlyEquivalent =
          billingCycle === "annual" ? (pkg.price_annual / 12).toFixed(0) : null;
        const isCurrent = veterinarian?.membership_type === key;
        const isFeatured = key === featuredPlanKey || pkg?.featured === true;
        const features = getPlanFeatureList(key, billingCycle, pkg);

        return (
          <article
            key={key}
            className={`pricing-card${isFeatured ? " pricing-card--featured" : ""}${isCurrent ? " current" : ""}`}
          >
            <div className="pricing-header">
              <h3>{pkg.name}</h3>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">{Number(price).toLocaleString("es-MX")}</span>
                <span className="period">{periodText} + IVA</span>
              </div>
              {monthlyEquivalent && (
                <p className="price-equivalent">≈ ${monthlyEquivalent} MXN/mes</p>
              )}
              {isCurrent && <div className="current-plan-pill">Plan actual</div>}
            </div>

            <div className="pricing-features">
              {features.map((feature) => (
                <div key={feature} className="feature">
                  <Check size={15} className="feature-icon" aria-hidden />
                  {feature}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onPurchase(key)}
              disabled={loading || isCurrent}
              className={`btn ${isFeatured || key === "premium" ? "btn-primary" : "btn-secondary"} btn-full`}
            >
              {isCurrent ? "Plan actual" : loading ? "Procesando…" : "Seleccionar plan"}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function MembershipCredits({ veterinarian, creditPackages, loading, onBuyCredits }) {
  const entries = Object.entries(creditPackages);
  if (!entries.length) return null;

  return (
    <section className="membership-credits">
      <div className="membership-credits-inner">
        <div>
          <p className="membership-eyebrow">Recarga</p>
          <h2>Consultas adicionales</h2>
          <p>
            ¿Se agotaron las consultas de tu plan? Compra un paquete extra sin cambiar de
            membresía. Se suman a tu saldo actual.
          </p>
        </div>
        <div className="membership-credits-cards">
          {entries.map(([key, pkg]) => (
            <article key={key} className="membership-credit-card">
              <p className="membership-credit-name">{pkg.name}</p>
              <p className="membership-credit-price">
                ${Number(pkg.price).toLocaleString("es-MX")}{" "}
                <span>MXN + IVA</span>
              </p>
              <p className="membership-credit-note">
                {pkg.description ||
                  `${pkg.credits} consultas CDS · válidas con cuenta MVZ activa`}
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                disabled={loading || !veterinarian?.id}
                onClick={() => onBuyCredits(key)}
              >
                {loading ? "Procesando…" : "Comprar paquete"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MembershipPage({ setView }) {
  const { veterinarian, refreshProfile } = useVet();
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [featuredPlanKey, setFeaturedPlanKey] = useState("professional");
  const [infoItems, setInfoItems] = useState(MEMBERSHIP_INFO_ITEMS);
  const [creditPackages, setCreditPackages] = useState(DEFAULT_CREDIT_PACKAGES);
  const [loading, setLoading] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");

  const loadPackages = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/membership/packages`);
      const data = response.ok ? await response.json() : null;
      const catalog = parseMembershipCatalogResponse(data);
      setPackages(catalog.packages);
      setFeaturedPlanKey(catalog.featuredPlan);
      setInfoItems(catalog.infoItems);
    } catch (error) {
      console.error("Error loading packages:", error);
      const catalog = parseMembershipCatalogResponse(null);
      setPackages(catalog.packages);
      setFeaturedPlanKey(catalog.featuredPlan);
      setInfoItems(catalog.infoItems);
    }
  }, []);

  const loadCreditPackages = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/consultations/credit-packages`);
      if (!response.ok) {
        setCreditPackages(DEFAULT_CREDIT_PACKAGES);
        return;
      }
      const data = await response.json();
      const next = data.packages || data.credit_packages || data;
      if (next && typeof next === "object" && Object.keys(next).length > 0) {
        setCreditPackages(next);
      } else {
        setCreditPackages(DEFAULT_CREDIT_PACKAGES);
      }
    } catch (error) {
      console.error("Error loading credit packages:", error);
      setCreditPackages(DEFAULT_CREDIT_PACKAGES);
    }
  }, []);

  useEffect(() => {
    if (!veterinarian?.id) return undefined;
    const timeoutId = setTimeout(() => refreshProfile(), 100);
    return () => clearTimeout(timeoutId);
  }, [veterinarian?.id, refreshProfile]);

  useEffect(() => {
    if (!veterinarian?.id) return;
    loadPackages();
    loadCreditPackages();
  }, [veterinarian?.id, loadPackages, loadCreditPackages]);

  const handlePurchase = async (packageId) => {
    if (!veterinarian?.id) {
      setView("login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/checkout/session`, {
        method: "POST",
        headers: getAuthHeaders(veterinarian.id),
        body: JSON.stringify({
          package_id: packageId,
          origin_url: window.location.origin,
          billing_cycle: billingCycle,
          veterinarian_id: veterinarian.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Error creando sesión de pago";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.checkout_url) {
        throw new Error("No se recibió la URL de checkout. Por favor, intenta de nuevo.");
      }

      const pkg = packages[packageId];
      const price = pkg
        ? billingCycle === "annual"
          ? pkg.price_annual
          : pkg.price_monthly
        : null;
      trackMetaInitiateCheckout({
        packageId,
        value: price,
        contentCategory: "membership",
      });

      window.location.href = data.checkout_url;
    } catch (error) {
      alert(error.message || "Error procesando el pago. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (packageId) => {
    if (!veterinarian?.id) {
      setView("login");
      return;
    }

    setCreditsLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/payments/consultations/checkout/session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            veterinarian_id: veterinarian.id,
            package_id: packageId,
            origin_url: window.location.origin,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error creando sesión de pago");
      }

      const data = await response.json();
      if (!data.checkout_url) {
        throw new Error("No se recibió la URL de checkout.");
      }

      const pkg = creditPackages[packageId];
      trackMetaInitiateCheckout({
        packageId,
        value: pkg?.price,
        contentCategory: "consultation_credits",
      });

      window.location.href = data.checkout_url;
    } catch (error) {
      alert(error.message || "Error procesando la compra de consultas.");
    } finally {
      setCreditsLoading(false);
    }
  };

  const status = useMemo(
    () => getMembershipStatusText(veterinarian, packages),
    [veterinarian, packages],
  );

  if (!veterinarian) {
    return (
      <AuthPageShell setView={setView}>
        <GuiaaBrandLockup variant="auth" className="mb-6" />
        <h2>Membresía GUIAA</h2>
        <p>
          Planes con diagnóstico CDS, expediente, inventario, ventas y multiespecie según
          nivel. Inicia sesión para contratar o recargar consultas.
        </p>
        <ul className="membership-auth-features">
          <li>CDS L4 · L5 en consulta clínica</li>
          <li>Expediente, agenda e inventario</li>
          <li>Funciones Premium: Manejo Experto y onboarding guiado</li>
        </ul>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button type="button" onClick={() => setView("login")} className="w-full sm:flex-1">
            Iniciar sesión
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setView("register")}
            className="w-full sm:flex-1"
          >
            Registrarse
          </Button>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <div className="membership-page">
      <div className="container">
        <div className="membership-hero">
          <p className="membership-eyebrow">Plataforma clínica GUIAA</p>
          <h1>Membresías por módulo y consulta</h1>
          <p>
            Diagnóstico CDS, expediente, inventario, ventas y multiespecie — con Manejo
            Experto y mayor volumen de consultas en Premium.
          </p>
          {status.tone && (
            <div className={`membership-status-badge membership-status-badge--${status.tone}`}>
              <Check size={16} aria-hidden />
              {status.text}
            </div>
          )}
        </div>

        <div className="membership-module-strip" aria-label="Módulos incluidos en la plataforma">
          {[
            { icon: Stethoscope, label: "Diagnóstico CDS" },
            { icon: ClipboardList, label: "Expediente" },
            { icon: Package, label: "Inventario" },
            { icon: Receipt, label: "Ventas" },
            { icon: BarChart3, label: "Reportes" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="membership-module-chip">
              <Icon size={14} aria-hidden />
              {label}
            </span>
          ))}
        </div>

        <div className="billing-toggle-container">
          <p className="membership-payment-note">
            Pagos seguros con Stripe en pesos mexicanos (MXN). En México puedes pagar con
            tarjeta u OXXO; en el resto de Latinoamérica, con tarjeta internacional.
          </p>
          <div className="billing-toggle-wrapper">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`billing-toggle-btn ${billingCycle === "monthly" ? "active" : ""}`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`billing-toggle-btn ${billingCycle === "annual" ? "active" : ""}`}
            >
              Anual
              <span className="billing-badge">Ahorra 2 meses</span>
            </button>
          </div>
        </div>

        <MembershipPlans
          veterinarian={veterinarian}
          packages={packages}
          billingCycle={billingCycle}
          loading={loading}
          featuredPlanKey={featuredPlanKey}
          onPurchase={handlePurchase}
        />

        <MembershipCredits
          veterinarian={veterinarian}
          creditPackages={creditPackages}
          loading={creditsLoading}
          onBuyCredits={handleBuyCredits}
        />

        <section className="membership-info">
          <h2>Todo gira en torno a la consulta</h2>
          <p>
            Desde la anamnesis hasta el cierre administrativo, con la misma identidad GUIAA.
          </p>
          <div className="info-grid">
            {infoItems.map(({ id, title, description }) => {
              const Icon = INFO_ICONS[id] || BookOpen;
              return (
                <article key={id} className="info-card">
                  <span className="info-icon-wrap">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <p className="membership-footnote">
          Solo médicos veterinarios certificados. La verificación de cédula es requisito para
          activar la cuenta clínica.
        </p>
      </div>
    </div>
  );
}
