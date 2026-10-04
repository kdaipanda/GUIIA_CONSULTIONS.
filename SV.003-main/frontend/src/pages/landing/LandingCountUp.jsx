import React, { useEffect, useMemo, useState } from "react";

function parseStatValue(raw) {
  const text = String(raw || "").trim();
  const match = text.match(/^(\d+(?:[.,]\d+)?)(\+?)(\s*.*)$/);
  if (!match) {
    return { kind: "text", text };
  }

  const numeric = Number(match[1].replace(",", "."));
  if (!Number.isFinite(numeric)) {
    return { kind: "text", text };
  }

  return {
    kind: "number",
    target: numeric,
    plus: match[2] || "",
    suffix: match[3] || "",
    decimals: match[1].includes(".") || match[1].includes(",") ? 1 : 0,
  };
}

function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - 2 ** (-10 * t);
}

/**
 * Doctor Multimedia–style proof counters: animate leading digits once in view.
 */
export function LandingCountUp({ value, active, className = "", duration = 1100 }) {
  const parsed = useMemo(() => parseStatValue(value), [value]);
  const finalText =
    parsed.kind === "number" ? `${parsed.target}${parsed.plus}${parsed.suffix}` : parsed.text;
  const [display, setDisplay] = useState(() =>
    parsed.kind === "number" ? `0${parsed.plus}${parsed.suffix}` : parsed.text,
  );

  useEffect(() => {
    if (parsed.kind !== "number") {
      setDisplay(parsed.text);
      return undefined;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(finalText);
      return undefined;
    }

    if (!active) {
      setDisplay(`0${parsed.plus}${parsed.suffix}`);
      return undefined;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const current = parsed.target * easeOutExpo(t);
      const rounded =
        parsed.decimals > 0 ? current.toFixed(parsed.decimals) : String(Math.round(current));
      setDisplay(`${rounded}${parsed.plus}${parsed.suffix}`);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, finalText, parsed]);

  return (
    <span className={className}>
      <span aria-hidden={parsed.kind === "number" ? "true" : undefined}>{display}</span>
      {parsed.kind === "number" ? <span className="sr-only">{finalText}</span> : null}
    </span>
  );
}
