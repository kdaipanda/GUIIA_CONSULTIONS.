import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { LandingVideoModal } from "./LandingVideoModal";
import { LandingVetAnimations } from "./LandingVetAnimations";
import { LandingHeroVideo } from "./LandingHeroVideo";
import { scrollToLandingProduct } from "./landingScroll";

const BASE_TILT = { rx: 4, ry: -6 };
const TILT_STRENGTH = 12;

function Hero3DPanel({ children }) {
  const panelRef = useRef(null);
  const frameRef = useRef(0);
  const pendingTiltRef = useRef(null);
  const [tiltEnabled, setTiltEnabled] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const update = () => setTiltEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const applyTilt = useCallback((rx, ry, tilting) => {
    const node = panelRef.current;
    if (!node) return;
    node.style.transform = `rotateX(${BASE_TILT.rx + rx}deg) rotateY(${BASE_TILT.ry + ry}deg)`;
    node.classList.toggle("is-tilting", tilting);
  }, []);

  const handlePointerMove = useCallback(
    (event) => {
      if (!tiltEnabled) return;
      const node = panelRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      pendingTiltRef.current = {
        rx: py * -TILT_STRENGTH,
        ry: px * TILT_STRENGTH,
      };

      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0;
        const next = pendingTiltRef.current;
        if (!next) return;
        applyTilt(next.rx, next.ry, true);
      });
    },
    [applyTilt, tiltEnabled],
  );

  const resetTilt = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    pendingTiltRef.current = null;
    applyTilt(0, 0, false);
  }, [applyTilt]);

  return (
    <div className="landing-hero-3d-scene">
      <span className="landing-hero-3d-glow" aria-hidden />
      <span className="landing-hero-3d-orbit" aria-hidden />
      <span className="landing-hero-3d-floor-shadow" aria-hidden />

      <div
        ref={panelRef}
        className="landing-hero-3d-panel landing-petpal-media-ring"
        style={{
          transform: `rotateX(${BASE_TILT.rx}deg) rotateY(${BASE_TILT.ry}deg)`,
        }}
        onPointerMove={tiltEnabled ? handlePointerMove : undefined}
        onPointerLeave={tiltEnabled ? resetTilt : undefined}
        onPointerCancel={tiltEnabled ? resetTilt : undefined}
      >
        <div className="landing-hero-3d-bezel">
          <div className="landing-hero-3d-screen">
            {children}
            <span className="landing-hero-3d-shine" aria-hidden />
            <span className="landing-hero-3d-scanline landing-hero-3d-scanline--desktop" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingHero({ setView }) {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      <section className="landing-petpal-hero" aria-labelledby="landing-hero-title">
        <LandingVetAnimations variant="hero" />
        <div className="landing-petpal-curve" aria-hidden />

        <div className="landing-container">
          <div className="landing-petpal-grid">
            <div className="landing-petpal-copy">
              <p className="landing-petpal-kicker">Software clínico veterinario · GUIAA</p>
              <h1 id="landing-hero-title" className="landing-petpal-title">
                Conecta con{" "}
                <span className="landing-petpal-accent">tu consulta</span>, en cualquier momento
              </h1>
              <p className="landing-petpal-lead">
                Comunicación fluida entre tu práctica y cada caso clínico. Gestión de salud
                simplificada para{" "}
                <span className="landing-petpal-accent">cada paciente</span> con anamnesis
                multiespecie y soporte CDS avanzado.
              </p>

              <div className="landing-petpal-cta-row">
                <button
                  type="button"
                  onClick={() => setView("register")}
                  className="landing-petpal-cta-primary"
                >
                  Comenzar registro MVZ
                </button>
                <button
                  type="button"
                  className="landing-petpal-cta-play"
                  onClick={() => setVideoOpen(true)}
                  aria-label="Ver video de presentación"
                >
                  <Play size={18} fill="currentColor" aria-hidden />
                  <span className="sr-only">Ver video de presentación</span>
                </button>
              </div>

              <p className="landing-petpal-cta-hint">
                Registro MVZ en minutos · Verificación de cédula incluida
              </p>

              <button
                type="button"
                onClick={() => scrollToLandingProduct("species")}
                className="landing-petpal-demo-link"
              >
                Explorar interfaz sin registro →
              </button>

              <div className="landing-petpal-scroll-hint" aria-hidden>
                <ChevronDown size={18} className="mx-auto opacity-60" />
              </div>
            </div>

            <div className="landing-petpal-visual">
              <Hero3DPanel>
                <LandingHeroVideo />
              </Hero3DPanel>
            </div>
          </div>
        </div>
      </section>

      <LandingVideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </>
  );
}
