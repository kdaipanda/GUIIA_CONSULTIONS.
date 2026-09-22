import React from "react";
import { useTranslation } from "react-i18next";
import { GuiaaBrandLockup } from "./GuiaaBrandLockup";
import { DoctorPlumitas } from "./brand/DoctorPlumitas";
import "../layout/authShell.css";

export function LoadingScreen() {
  const { t } = useTranslation("common");

  return (
    <div
      className="loading-screen-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <GuiaaBrandLockup variant="loading" className="mb-4" />
      <DoctorPlumitas size="sm" badge className="mb-4" />
      <div className="loading-spinner" aria-hidden />
      <div className="premium-loading-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p>{t("loadingGuiaa")}</p>
    </div>
  );
}
