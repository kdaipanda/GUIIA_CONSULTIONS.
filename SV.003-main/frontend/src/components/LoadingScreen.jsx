import React from "react";
import { GuiaaBrandLockup } from "./GuiaaBrandLockup";
import "../layout/authShell.css";

export function LoadingScreen() {
  return (
    <div className="loading-screen-shell">
      <GuiaaBrandLockup variant="loading" className="mb-8" />
      <div className="loading-spinner" aria-hidden />
      <div className="premium-loading-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p>Cargando GUIAA…</p>
    </div>
  );
}
