import React, { useEffect, useRef, useState } from "react";
import { LANDING_DEFERRED_READY_EVENT, LANDING_DEFERRED_REVEAL_EVENT } from "./landingScroll";

function shouldRevealForSelector(selector, revealFor) {
  const selectors = Array.isArray(revealFor) ? revealFor : [revealFor].filter(Boolean);
  return selectors.some((target) => selector === target || selector?.startsWith(`${target}-`));
}

/**
 * Mounts children only when near the viewport to keep the landing first paint light.
 */
export function LandingDeferred({ children, revealFor, rootMargin = "280px 0px", minHeight = 240 }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || ready) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setReady(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ready, rootMargin]);

  useEffect(() => {
    if (ready || !revealFor) return undefined;

    const revealFromAnchor = (event) => {
      if (shouldRevealForSelector(event.detail, revealFor)) {
        setReady(true);
      }
    };

    window.addEventListener(LANDING_DEFERRED_REVEAL_EVENT, revealFromAnchor);
    return () => window.removeEventListener(LANDING_DEFERRED_REVEAL_EVENT, revealFromAnchor);
  }, [ready, revealFor]);

  useEffect(() => {
    if (!ready) return;
    window.dispatchEvent(new CustomEvent(LANDING_DEFERRED_READY_EVENT, { detail: revealFor }));
  }, [ready, revealFor]);

  return (
    <div
      ref={ref}
      className="landing-deferred"
      style={ready ? undefined : { minHeight, contentVisibility: "auto", containIntrinsicSize: `auto ${minHeight}px` }}
    >
      {ready ? children : null}
    </div>
  );
}
