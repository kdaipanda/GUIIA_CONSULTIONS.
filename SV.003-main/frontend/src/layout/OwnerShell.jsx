import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, History, Home, LogOut, PawPrint } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { LandingBrandLockup } from "../pages/landing/LandingBrandLockup";
import { LandingClinicalTexture } from "../pages/landing/LandingClinicalTexture";
import "./ownerShell.css";

export function OwnerShell({
  owner,
  sessionsRemaining,
  sessionsUnlimited = false,
  onLogout,
  wide = false,
  children,
}) {
  const { t } = useTranslation("owner");
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prevHtml = root.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    root.style.backgroundColor = "#0c2d4d";
    body.style.backgroundColor = "#0c2d4d";
    return () => {
      root.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, []);

  return (
    <div className="owner-shell">
      <div className="owner-shell-frame">
        <LandingClinicalTexture />

        <header className="owner-shell-header">
          <LandingBrandLockup
            variant="navbar"
            onClick={() => navigate("/consulta")}
            className="owner-shell-brand-lockup max-w-[min(100%,36rem)]"
          />
          <div className="owner-shell-header-actions">
            {owner ? (
              <span className="owner-shell-sessions" title={t("shell.sessionsHint")}>
                {sessionsUnlimited
                  ? t("shell.sessionsUnlimited")
                  : t("shell.sessions", { count: sessionsRemaining ?? 0 })}
              </span>
            ) : null}
            <LanguageSwitcher />
            {owner ? (
              <button type="button" className="owner-shell-logout" onClick={onLogout}>
                <LogOut size={16} aria-hidden />
                <span>{t("shell.logout")}</span>
              </button>
            ) : (
              <button
                type="button"
                className="owner-shell-back"
                onClick={() => navigate("/")}
              >
                <ArrowLeft size={16} aria-hidden />
                <span>{t("shell.backHome")}</span>
              </button>
            )}
          </div>
        </header>

        <div className="owner-shell-product-bar">
          <p className="owner-shell-kicker">{t("shell.productName")}</p>
          {owner ? (
            <nav className="owner-shell-nav" aria-label={t("shell.navLabel")}>
              <NavLink to="/consulta" end className="owner-shell-nav-link">
                <Home size={16} aria-hidden />
                {t("nav.home")}
              </NavLink>
              <NavLink to="/consulta/pagar" className="owner-shell-nav-link">
                <CreditCard size={16} aria-hidden />
                {t("nav.pay")}
              </NavLink>
              <NavLink to="/consulta/nueva" className="owner-shell-nav-link">
                <PawPrint size={16} aria-hidden />
                {t("nav.new")}
              </NavLink>
              <NavLink to="/consulta/historial" className="owner-shell-nav-link">
                <History size={16} aria-hidden />
                {t("nav.history")}
              </NavLink>
            </nav>
          ) : null}
        </div>

        <main className={`owner-shell-main${wide ? " owner-shell-main--wide" : ""}`}>{children}</main>

        <footer className="owner-shell-footer">
          <p>{t("shell.disclaimer")}</p>
        </footer>
      </div>
    </div>
  );
}
