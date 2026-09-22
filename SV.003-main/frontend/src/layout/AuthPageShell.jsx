import React from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingClinicalTexture } from "../pages/landing/LandingClinicalTexture";
import { LandingBrandLockup } from "../pages/landing/LandingBrandLockup";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import "./authShell.css";

export function AuthPageShell({ setView, wide = false, children }) {
  const { t } = useTranslation("auth");

  return (
    <div className="auth-shell antialiased">
      <div className="auth-shell-frame">
        <LandingClinicalTexture />
        <header className="auth-shell-header">
          <LandingBrandLockup
            variant="navbar"
            onClick={() => setView("landing")}
            className="max-w-[min(100%,36rem)]"
          />
          <div className="auth-shell-header-actions">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setView("landing")}
              className="auth-shell-back"
            >
              <ArrowLeft size={16} aria-hidden />
              {t("login.backHome")}
            </button>
          </div>
        </header>

        <div className="auth-shell-body">
          <div className={wide ? "auth-card auth-card--wide w-full" : "auth-card w-full"}>
            {children}
            <p className="auth-shell-trust">{t("shell.trustLine")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
