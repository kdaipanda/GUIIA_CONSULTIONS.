import React, { useEffect, useRef, useState } from "react";

/**
 * Subtle enter cue. Content stays visible (no opacity:0 trap) so fast
 * scroll never paints blank sections.
 */
export function LandingReveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const node = ref.current;
    if (!node) return undefined;

    if (prefersReduced) {
      setVisible(true);
      return undefined;
    }

    const scrollRoot = document.documentElement.classList.contains("guiaa-native-app")
      ? document.getElementById("root")
      : null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { root: scrollRoot, threshold: 0.01, rootMargin: "120px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`landing-reveal${visible ? " is-visible" : ""} ${className}`.trim()}
      style={!visible && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
