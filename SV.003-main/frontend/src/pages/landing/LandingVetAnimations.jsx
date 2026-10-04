import React from "react";

/**
 * Capas de motion clínico profesional.
 * Hero: HUD estático + una pasada de scan/ECG al cargar.
 * Body: sin decoración loop (evita look “AI ambient”).
 */
export function LandingVetAnimations({ variant = "hero" }) {
  if (variant !== "hero") {
    return null;
  }

  return (
    <div className="landing-vet-anim landing-vet-anim--hero landing-vet-anim--clinical" aria-hidden>
      <span className="landing-vet-scan" />
      <span className="landing-vet-hud landing-vet-hud--tl" />
      <span className="landing-vet-hud landing-vet-hud--tr" />
      <span className="landing-vet-hud landing-vet-hud--bl" />
      <span className="landing-vet-hud landing-vet-hud--br" />
      <span className="landing-vet-vital-ring" />
      <svg
        className="landing-vet-ecg-svg"
        viewBox="0 0 160 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="landing-vet-ecg-path"
          d="M0 18 H28 L36 18 L42 6 L50 30 L58 12 L66 22 L74 18 H160"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
