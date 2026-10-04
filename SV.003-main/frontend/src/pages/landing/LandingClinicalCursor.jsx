import React, { useEffect, useRef, useState } from "react";

/**
 * Cursor vital clínico — solo desktop con puntero fino.
 * Metáfora: retícula de lectura CDS (no partículas / glow genérico).
 */
export function LandingClinicalCursor({ enabled = true }) {
  const wrapRef = useRef(null);
  const [active, setActive] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || !wide || reduce) return undefined;

    const host = wrapRef.current?.parentElement;
    if (!host) return undefined;

    const el = wrapRef.current;
    const setXY = () => {
      el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      raf.current = 0;
    };

    const onMove = (e) => {
      const rect = host.getBoundingClientRect();
      pos.current.x = e.clientX - rect.left;
      pos.current.y = e.clientY - rect.top;
      if (!raf.current) raf.current = requestAnimationFrame(setXY);
    };

    const onEnter = () => setActive(true);
    const onLeave = () => setActive(false);

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerenter", onEnter, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [enabled]);

  return (
    <div
      ref={wrapRef}
      className={`landing-clinical-cursor${active ? " is-active" : ""}`}
      aria-hidden
    >
      <span className="landing-clinical-cursor__reticle" />
      <svg className="landing-clinical-cursor__ecg" viewBox="0 0 48 16" fill="none">
        <path
          d="M0 8 H10 L13 8 L16 2 L20 14 L24 5 L28 8 H48"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
