import React from "react";
import "./landing/landingPreview.css";
import "./landing/landingMotion.css";
import "./landing/landingTaste.css";
import { LandingClinicalTexture } from "./landing/LandingClinicalTexture";
import { LandingNavbar } from "./landing/LandingNavbar";
import { LandingHero } from "./landing/LandingHero";
import { LandingTrustStrip } from "./landing/LandingTrustStrip";
import { LandingProductShowcase } from "./landing/LandingProductShowcase";
import { LandingFeatures } from "./landing/LandingFeatures";
import { LandingUseCases } from "./landing/LandingUseCases";
import { LandingSpeciesMarquee } from "./landing/LandingSpeciesMarquee";
import { LandingPricing } from "./landing/LandingPricing";
import { LandingFaq } from "./landing/LandingFaq";
import { LandingCta } from "./landing/LandingCta";
import { LandingFooter } from "./landing/LandingFooter";
import { LandingSocialRail } from "./landing/LandingSocialRail";
import { LandingReveal } from "./landing/LandingReveal";
import { LandingSeo } from "./landing/LandingSeo";

export function LandingPage({ setView }) {
  return (
    <div className="landing-shell min-h-screen bg-guiaa-brand-blue p-3 pb-[4.75rem] antialiased sm:p-5 sm:pb-20 lg:pb-6 lg:p-6">
      <LandingSeo />
      <div className="landing-shell-inner relative mx-auto max-w-[82rem] overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-50/90 via-white to-white sm:rounded-[2.75rem]">
        <LandingClinicalTexture />
        <LandingNavbar setView={setView} />
        <main className="relative">
          <LandingHero setView={setView} />
          <LandingReveal>
            <LandingTrustStrip />
          </LandingReveal>
          <LandingReveal delay={40}>
            <LandingProductShowcase />
          </LandingReveal>
          <LandingReveal delay={60}>
            <LandingFeatures />
          </LandingReveal>
          <LandingReveal delay={80}>
            <LandingUseCases />
          </LandingReveal>
          <LandingReveal>
            <LandingSpeciesMarquee />
          </LandingReveal>
          <LandingReveal delay={40}>
            <LandingPricing setView={setView} />
          </LandingReveal>
          <LandingReveal delay={60}>
            <LandingFaq setView={setView} />
          </LandingReveal>
          <LandingReveal>
            <LandingCta setView={setView} />
          </LandingReveal>
        </main>
        <LandingFooter setView={setView} />
      </div>
      <LandingSocialRail setView={setView} />
    </div>
  );
}
