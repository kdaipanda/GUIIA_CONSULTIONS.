import React from "react";
import {
  ConsultationFormPreview,
  ConsultationSpeciesPreview,
  DashboardPreview,
} from "./landing/LandingAppPreview";

/** Página interna para generar capturas PNG (`npm run capture:landing`). */
export function LandingScreenshotCapturePage() {
  return (
    <div className="landing-screenshot-capture-page bg-slate-200 p-8">
      <div id="capture-consultation-species" className="landing-capture-frame mb-10">
        <ConsultationSpeciesPreview />
      </div>
      <div id="capture-consultation-form" className="landing-capture-frame mb-10">
        <ConsultationFormPreview />
      </div>
      <div id="capture-dashboard" className="landing-capture-frame">
        <DashboardPreview />
      </div>
    </div>
  );
}
