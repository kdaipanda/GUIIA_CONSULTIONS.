import React from "react";
import { LANDING_IMAGES } from "./landingBrandAssets";

export function LandingBrandBand() {
  return (
    <section className="landing-brand-band" aria-label="Marca GUIAA">
      <div className="landing-container landing-brand-band-inner">
        <div className="landing-brand-band-mascot-wrap" aria-hidden>
          <span className="landing-brand-band-spark landing-brand-band-spark--1" />
          <span className="landing-brand-band-spark landing-brand-band-spark--2" />
          <span className="landing-brand-band-spark landing-brand-band-spark--3" />
          <img
            src={LANDING_IMAGES.mascotFlyingCutout}
            alt=""
            className="landing-brand-band-mascot"
            width={160}
            height={120}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div>
          <strong>Doctor Plumitas te acompaña en consulta</strong>
          <span>
            La mascota de GUIAA representa un flujo clínico cercano, claro y pensado para el
            día a día del médico veterinario.
          </span>
        </div>
      </div>
    </section>
  );
}
