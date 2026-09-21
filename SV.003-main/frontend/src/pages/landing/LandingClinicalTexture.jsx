import React from "react";

/** Textura de papel clínico — rejilla sutil, sin orbes ni sky wash. */
export function LandingClinicalTexture() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(12, 45, 77, 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(12, 45, 77, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
