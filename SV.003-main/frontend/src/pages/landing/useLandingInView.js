import { useEffect, useRef, useState } from "react";

/**
 * One-shot in-view flag. Content stays painted; only the class changes.
 */
export function useLandingInView({ rootMargin = "0px 0px -12% 0px", threshold = 0.2 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return undefined;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return undefined;
    }

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const scrollRoot = document.documentElement.classList.contains("guiaa-native-app")
      ? document.getElementById("root")
      : null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { root: scrollRoot, rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, rootMargin, threshold]);

  return { ref, inView };
}
