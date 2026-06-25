import React, { useEffect, useState } from "react";

function useMobileViewport() {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}

export function LandingStickyCta({ setView }) {
  const isMobile = useMobileViewport();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setVisible(false);
      return undefined;
    }

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
  }, [isMobile]);

  if (!isMobile || !visible) return null;

  return (
    <div className="landing-sticky-cta" role="region" aria-label="Acción rápida">
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
