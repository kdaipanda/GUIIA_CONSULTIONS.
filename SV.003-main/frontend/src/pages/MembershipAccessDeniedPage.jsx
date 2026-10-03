import React from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GuiaaLogoImg } from "../components/GuiaaBrandLockup";
import "./membershipAccessDeniedPage.css";

/**
 * Pantalla de acceso denegado cuando la membresía (p. ej. Premium) expiró
 * y no se renovó. Empuja a comprar / renovar.
 */
export function MembershipAccessDeniedPage({ setView, planName }) {
  const { t } = useTranslation("clinic");

  const goMembership = () => {
    if (typeof setView === "function") setView("membership");
  };

  const goHelp = () => {
    if (typeof setView === "function") setView("help");
  };

  return (
    <div className="guiaa-access-denied" role="alert" aria-labelledby="guiaa-access-denied-title">
      <header className="guiaa-access-denied-brand">
        <GuiaaLogoImg tone="on-dark" className="guiaa-access-denied-logo" alt="" />
        <span>GUIAA</span>
      </header>

      <div className="guiaa-access-denied-card">
        <div className="guiaa-access-denied-icon" aria-hidden>
          <Lock size={22} strokeWidth={1.75} />
        </div>

        <p className="guiaa-access-denied-code">{t("accessDenied.code")}</p>
        <h1 id="guiaa-access-denied-title" className="guiaa-access-denied-title">
          {t("accessDenied.title")}
        </h1>
        <p className="guiaa-access-denied-body">
          {t("accessDenied.body", {
            plan: planName || t("accessDenied.planFallback"),
          })}
        </p>

        <div className="guiaa-access-denied-actions">
          <button
            type="button"
            className="guiaa-access-denied-btn guiaa-access-denied-btn--primary"
            onClick={goMembership}
          >
            <ArrowLeft size={16} strokeWidth={2.25} aria-hidden />
            {t("accessDenied.renewCta")}
          </button>
          <button
            type="button"
            className="guiaa-access-denied-btn guiaa-access-denied-btn--ghost"
            onClick={goHelp}
          >
            {t("accessDenied.helpCta")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MembershipAccessDeniedPage;
