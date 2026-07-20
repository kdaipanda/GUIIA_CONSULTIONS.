import { useEffect } from "react";

/**
 * Pauses decorative CSS animations briefly around pointer/keyboard input
 * so the next paint is not competing with continuous animation work (INP).
 */
export function useLandingInteractionQuiet() {
  useEffect(() => {
    const root = document.documentElement;
    let clearTimer = 0;

    const quiet = () => {
      root.classList.add("landing-inp-quiet");
      if (clearTimer) window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => {
        root.classList.remove("landing-inp-quiet");
        clearTimer = 0;
      }, 140);
    };

    const opts = { passive: true, capture: true };
    document.addEventListener("pointerdown", quiet, opts);
    document.addEventListener("keydown", quiet, opts);

    return () => {
      document.removeEventListener("pointerdown", quiet, opts);
      document.removeEventListener("keydown", quiet, opts);
      if (clearTimer) window.clearTimeout(clearTimer);
      root.classList.remove("landing-inp-quiet");
    };
  }, []);
}
