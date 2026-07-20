import React, { useCallback, useEffect, startTransition } from "react";

import "../styles/consultationFlow.css";
import "./landing/landingPreview.css";
import "./landing/landingMotion.css";
import "./landing/landingTaste.css";
import "./landing/landingPetpal.css";
import "./landing/landingRefined.css";
import "./landing/landingVetAnimations.css";
import "./landing/landingColleaguesBento.css";
import "./landing/landingHero3d.css";
import "./landing/landingInteractions.css";
import "./landing/landingDarkMode.css";
import "./landing/landingPricing.css";

import { LandingNavbar } from "./landing/LandingNavbar";
import { LandingHero } from "./landing/LandingHero";
import { LandingHeroStats } from "./landing/LandingHeroStats";
import { LandingHowItWorks } from "./landing/LandingHowItWorks";
import { LandingClinicalWorkflow } from "./landing/LandingClinicalWorkflow";
import { LandingBrandBand } from "./landing/LandingBrandBand";
import { LandingProductShowcase } from "./landing/LandingProductShowcase";
import { LandingFeatures } from "./landing/LandingFeatures";
import { LandingUseCases } from "./landing/LandingUseCases";
import { LandingTestimonials } from "./landing/LandingTestimonials";
import { LandingSpeciesMarquee } from "./landing/LandingSpeciesMarquee";
import { LandingTrustStrip } from "./landing/LandingTrustStrip";
import { LandingPricing } from "./landing/LandingPricing";
import { LandingFaq } from "./landing/LandingFaq";
import { LandingCta } from "./landing/LandingCta";
import { LandingGuiaConsultas } from "./landing/LandingGuiaConsultas";
import { LandingFooter } from "./landing/LandingFooter";
import { LandingSocialRail } from "./landing/LandingSocialRail";
import { LandingReveal } from "./landing/LandingReveal";
import { LandingSeo } from "./landing/LandingSeo";
import { LandingVetAnimations } from "./landing/LandingVetAnimations";
import { useLandingInteractionQuiet } from "./landing/useLandingInteractionQuiet";
import { trackMetaPageView } from "../lib/metaPixel";

export function LandingPage({ setView }) {
  useLandingInteractionQuiet();

  useEffect(() => {
    trackMetaPageView();
  }, []);

  const setViewDeferred = useCallback((view) => {
    // Yield one frame so the click paint (pressed state) lands before the route swap.
    requestAnimationFrame(() => {
      startTransition(() => {
        setView(view);
      });
    });
  }, [setView]);

  return (
    <div className="landing-shell landing-shell--page min-h-screen p-3 pb-5 antialiased sm:p-5 sm:pb-20 lg:pb-6 lg:p-6">
      <LandingSeo />

      <div className="landing-page-card mx-auto max-w-[82rem]">
        <div className="landing-petpal-top">
          <LandingNavbar setView={setViewDeferred} hero />
          <LandingHero setView={setViewDeferred} />
        </div>

        <LandingHeroStats />

        <div className="landing-body-wrap">
          <LandingVetAnimations variant="body" />
          <main className="relative">
            <LandingReveal>
              <LandingHowItWorks setView={setViewDeferred} />
            </LandingReveal>

            <LandingReveal delay={15}>
              <LandingClinicalWorkflow />
            </LandingReveal>

            <LandingReveal delay={20}>
              <LandingBrandBand />
            </LandingReveal>

            <LandingReveal delay={30}>
              <LandingProductShowcase />
            </LandingReveal>

            <LandingReveal delay={40}>
              <LandingFeatures />
            </LandingReveal>

            <LandingReveal delay={50}>
              <LandingUseCases />
            </LandingReveal>

            <LandingReveal delay={60}>
              <LandingTestimonials />
            </LandingReveal>

            <LandingReveal>
              <LandingSpeciesMarquee />
            </LandingReveal>

            <LandingReveal delay={30}>
              <LandingTrustStrip />
            </LandingReveal>

            <LandingReveal delay={40}>
              <LandingPricing setView={setViewDeferred} />
            </LandingReveal>

            <LandingReveal delay={50}>
              <LandingFaq setView={setViewDeferred} />
            </LandingReveal>

            <LandingReveal>
              <LandingCta setView={setViewDeferred} />
            </LandingReveal>

            <LandingReveal delay={20}>
              <LandingGuiaConsultas />
            </LandingReveal>
          </main>

          <LandingFooter />
        </div>
      </div>

      <LandingSocialRail />
    </div>
  );
}
