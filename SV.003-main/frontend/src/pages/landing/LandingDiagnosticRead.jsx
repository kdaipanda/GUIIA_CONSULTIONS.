import React, { useEffect, useRef, useState } from "react";

/**
 * Lectura diagnóstica al entrar en viewport.
 * Una pasada de “scan” clínico — no fade-up genérico.
 * El contenido permanece visible sin JS.
 */
export function LandingDiagnosticRead({ children, className = "", as: Tag = "div" }) {
  const ref = useRef(null);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (reduce || !desktop) {
      setReading(true);
      return undefined;
    }

    const scrollRoot = document.documentElement.classList.contains("guiaa-native-app")
      ? document.getElementById("root")
      : null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setReading(true);
        observer.disconnect();
      },
      { root: scrollRoot, threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`landing-dx-read${reading ? " is-reading" : ""} ${className}`.trim()}
    >
      <span className="landing-dx-read__scan" aria-hidden />
      <span className="landing-dx-read__ticks" aria-hidden />
      <div className="landing-dx-read__body">{children}</div>
    </Tag>
  );
}
