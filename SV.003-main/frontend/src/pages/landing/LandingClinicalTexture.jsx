import React from "react";

/** Textura sutil tipo papel clínico — reemplaza huellas genéricas. */
export function LandingClinicalTexture() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(12, 45, 77, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(12, 45, 77, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-guiaa-sky-soft/50 to-transparent" />
    </div>
  );
}
