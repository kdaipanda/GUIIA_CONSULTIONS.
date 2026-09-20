import React, { useCallback, useEffect, startTransition } from "react";
import { useTranslation } from "react-i18next";

import "../styles/consultationFlow.css";
import "./landing/landingPreview.css";
import "./landing/landingMotion.css";
import "./landing/landingTaste.css";
import "./landing/landingPetpal.css";
import "./landing/landingRefined.css";
import "./landing/landingColleaguesBento.css";
import "./landing/landingHero3d.css";
import "./landing/landingInteractions.css";
import "./landing/landingDarkMode.css";
import "./landing/landingPricing.css";
import "./landing/landingApple2026.css";
import "./landing/landingAntiSlop.css";
import "./landing/landingFrontendDesign.css";
import "./landing/landingUiUxProMax.css";
import "./landing/landingAnimate.css";

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
import { LandingDeferred } from "./landing/LandingDeferred";
import { LandingSeo } from "./landing/LandingSeo";
import { useLandingInteractionQuiet } from "./landing/useLandingInteractionQuiet";
import { scrollToLandingHash } from "./landing/landingScroll";
import { trackMetaPageView } from "../lib/metaPixel";

export function LandingPage({ setView }) {
  const { t } = useTranslation("landing");
  useLandingInteractionQuiet();

  useEffect(() => {
    trackMetaPageView();
  }, []);

  useEffect(() => {
    scrollToLandingHash(window.location.hash, { behavior: "auto" });
  }, []);

  const setViewDeferred = useCallback((view) => {
    requestAnimationFrame(() => {
      startTransition(() => {
        setView(view);
      });
    });
  }, [setView]);

  return (
    <div className="landing-shell landing-shell--page min-h-screen p-3 pb-5 antialiased sm:p-5 sm:pb-20 lg:pb-6 lg:p-6">
      <LandingSeo />

      <a href="#landing-main" className="landing-skip-link">
        {t("nav.skipToContent")}
      </a>

      <div className="landing-page-card mx-auto max-w-[82rem]">
        <div className="landing-petpal-top">
          <LandingNavbar setView={setViewDeferred} hero />
          <LandingHero setView={setViewDeferred} />
        </div>

        <LandingReveal>
          <LandingHeroStats />
        </LandingReveal>

        <div className="landing-body-wrap">
          <main id="landing-main" className="relative" tabIndex={-1}>
            <LandingReveal>
              <LandingHowItWorks setView={setViewDeferred} />
            </LandingReveal>

            <LandingReveal>
              <LandingClinicalWorkflow />
            </LandingReveal>

            <LandingReveal>
              <LandingBrandBand />
            </LandingReveal>

            <LandingDeferred revealFor="#product" minHeight={420}>
              <LandingReveal>
                <LandingProductShowcase />
              </LandingReveal>
            </LandingDeferred>

            <LandingDeferred revealFor="#features" minHeight={520}>
              <LandingReveal>
                <LandingFeatures />
              </LandingReveal>
            </LandingDeferred>

            <LandingDeferred minHeight={360}>
              <LandingReveal>
                <LandingUseCases />
              </LandingReveal>
            </LandingDeferred>

            <LandingDeferred minHeight={480}>
              <LandingReveal>
                <LandingTestimonials />
              </LandingReveal>
            </LandingDeferred>

            <LandingDeferred minHeight={120}>
              <LandingReveal>
                <LandingSpeciesMarquee />
              </LandingReveal>
            </LandingDeferred>

            <LandingDeferred minHeight={100}>
              <LandingReveal>
                <LandingTrustStrip />
              </LandingReveal>
            </LandingDeferred>

            <LandingDeferred revealFor="#pricing" minHeight={520}>
              <LandingReveal>
                <LandingPricing setView={setViewDeferred} />
              </LandingReveal>
            </LandingDeferred>

            <LandingDeferred revealFor="#faq" minHeight={360}>
              <LandingReveal>
                <LandingFaq />
              </LandingReveal>
            </LandingDeferred>

            <LandingDeferred minHeight={220}>
              <LandingReveal>
                <LandingCta setView={setViewDeferred} />
              </LandingReveal>
            </LandingDeferred>

            <LandingDeferred minHeight={280}>
              <LandingReveal>
                <LandingGuiaConsultas />
              </LandingReveal>
            </LandingDeferred>
          </main>

          <LandingFooter />
        </div>
      </div>

      <LandingSocialRail />
    </div>
  );
}
