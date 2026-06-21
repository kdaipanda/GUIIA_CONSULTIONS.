import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LandingClinicalTexture } from "../pages/landing/LandingClinicalTexture";
import { LandingBrandLockup } from "../pages/landing/LandingBrandLockup";
import "./authShell.css";

export function AuthPageShell({ setView, wide = false, children }) {
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
          <button
            type="button"
            onClick={() => setView("landing")}
            className="auth-shell-back"
          >
            <ArrowLeft size={15} aria-hidden />
            Inicio
          </button>
        </header>

        <div className="auth-shell-body">
          <div className={wide ? "auth-card auth-card--wide w-full" : "auth-card w-full"}>
            {children}
            <div className="auth-shell-trust" aria-hidden>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} />
                Solo MVZ certificados
              </span>
              <span>CDS L4 · L5</span>
              <span>Enfoque LATAM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
