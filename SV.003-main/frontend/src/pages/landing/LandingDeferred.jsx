import React, { useEffect, useRef, useState } from "react";

/**
 * Mounts children only when near the viewport to keep the landing first paint light.
 */
export function LandingDeferred({ children, rootMargin = "280px 0px", minHeight = 240 }) {
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
