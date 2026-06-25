import React from "react";
import { Bone, Cat, Dog, Heart, PawPrint, Stethoscope, Syringe } from "lucide-react";

const HERO_FLOATERS = [
  { Icon: PawPrint, className: "vet-floater--paw-1", size: 34 },
  { Icon: PawPrint, className: "vet-floater--paw-2", size: 22 },
  { Icon: PawPrint, className: "vet-floater--paw-3", size: 26 },
  { Icon: Stethoscope, className: "vet-floater--stethoscope", size: 30 },
  { Icon: Heart, className: "vet-floater--heart", size: 24 },
  { Icon: Syringe, className: "vet-floater--syringe", size: 22 },
  { Icon: Dog, className: "vet-floater--dog", size: 28 },
  { Icon: Cat, className: "vet-floater--cat", size: 26 },
  { Icon: Bone, className: "vet-floater--bone", size: 20 },
];

const PAW_TRAIL = [
  { className: "vet-paw-step--1", rotate: -18 },
  { className: "vet-paw-step--2", rotate: 12 },
  { className: "vet-paw-step--3", rotate: -14 },
  { className: "vet-paw-step--4", rotate: 16 },
  { className: "vet-paw-step--5", rotate: -10 },
];

const BODY_FLOATERS = [
  { Icon: PawPrint, className: "vet-body-floater--1", size: 20 },
  { Icon: Heart, className: "vet-body-floater--2", size: 18 },
  { Icon: Stethoscope, className: "vet-body-floater--3", size: 22 },
  { Icon: PawPrint, className: "vet-body-floater--4", size: 16 },
];

export function LandingVetAnimations({ variant = "hero" }) {
  if (variant === "hero") {
    return (
      <div className="landing-vet-anim landing-vet-anim--hero" aria-hidden>
        <div className="landing-vet-paw-trail">
          {PAW_TRAIL.map(({ className, rotate }) => (
            <span
              key={className}
              className={`landing-vet-paw-step ${className}`}
              style={{ "--vet-paw-rotate": `${rotate}deg` }}
            >
              <PawPrint size={16} strokeWidth={1.75} />
            </span>
          ))}
        </div>

        {HERO_FLOATERS.map(({ Icon, className, size }) => (
          <span key={className} className={`landing-vet-floater ${className}`}>
            <Icon size={size} strokeWidth={1.6} />
          </span>
        ))}

        <span className="landing-vet-ecg" />
      </div>
    );
  }

  return (
    <div className="landing-vet-anim landing-vet-anim--body" aria-hidden>
      {BODY_FLOATERS.map(({ Icon, className, size }) => (
        <span key={className} className={`landing-vet-body-floater ${className}`}>
          <Icon size={size} strokeWidth={1.6} />
        </span>
      ))}
    </div>
  );
}
