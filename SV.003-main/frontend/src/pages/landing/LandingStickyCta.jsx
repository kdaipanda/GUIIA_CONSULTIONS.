import React, { useEffect, useState } from "react";

export function LandingStickyCta({ setView }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".landing-petpal-hero");
    if (!hero) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="landing-sticky-cta lg:hidden" role="region" aria-label="Acción rápida">
      <button
        type="button"
        onClick={() => setView("register")}
        className="landing-sticky-cta-btn"
      >
        Crear cuenta MVZ
      </button>
      <button
        type="button"
        onClick={() => setView("login")}
        className="landing-sticky-cta-secondary"
      >
        Ingresar
      </button>
    </div>
  );
}
