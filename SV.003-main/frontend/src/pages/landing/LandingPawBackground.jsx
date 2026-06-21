import React from "react";
import { PawPrint } from "lucide-react";

const PAWS = [
  { top: "8%", left: "6%", size: 28, rotate: -15, opacity: 0.06 },
  { top: "15%", left: "42%", size: 22, rotate: 20, opacity: 0.05 },
  { top: "22%", left: "78%", size: 26, rotate: -8, opacity: 0.07 },
  { top: "38%", left: "18%", size: 20, rotate: 12, opacity: 0.05 },
  { top: "52%", left: "65%", size: 24, rotate: -22, opacity: 0.06 },
  { top: "68%", left: "8%", size: 22, rotate: 8, opacity: 0.05 },
  { top: "72%", left: "88%", size: 20, rotate: -12, opacity: 0.06 },
  { top: "85%", left: "35%", size: 26, rotate: 18, opacity: 0.05 },
  { top: "90%", left: "72%", size: 18, rotate: -5, opacity: 0.05 },
];

export function LandingPawBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PAWS.map((paw, i) => (
        <PawPrint
          key={i}
          size={paw.size}
          className="absolute text-guiaa-brand-navy"
          style={{
            top: paw.top,
            left: paw.left,
            opacity: paw.opacity,
            transform: `rotate(${paw.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
