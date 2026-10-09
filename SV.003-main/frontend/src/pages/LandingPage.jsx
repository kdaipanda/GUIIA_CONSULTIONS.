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
import "./landing/landingApple2026.css";
import "./landing/landingAntiSlop.css";
import "./landing/landingFrontendDesign.css";
import "./landing/landingUiUxProMax.css";
import "./landing/landingAnimate.css";
/* Pricing al final: cards dark GUIAA no las pisan anti-slop / uipro */
import "./landing/landingPricing.css";
import "./landing/landingVetAnimations.css";

import { LandingFluidHero, LandingHeroCapabilities } from "./landing/LandingFluidHero";
import { LandingHeroStats } from "./landing/LandingHeroStats";
import { LandingHowItWorks } from "./landing/LandingHowItWorks";
import { LandingClinicalWorkflow } from "./landing/LandingClinicalWorkflow";
import { LandingProductShowcase } from "./landing/LandingProductShowcase";
import { LandingFeatures } from "./landing/LandingFeatures";
import { LandingTestimonials } from "./landing/LandingTestimonials";
import { LandingSpeciesMarquee } from "./landing/LandingSpeciesMarquee";
import { LandingTrustStrip } from "./landing/LandingTrustStrip";
import { LandingAwardSeal } from "./landing/LandingAwardSeal";
import { LandingPricing } from "./landing/LandingPricing";
import { LandingFaq } from "./landing/LandingFaq";
import { LandingCta } from "./landing/LandingCta";
import { LandingFooter } from "./landing/LandingFooter";
import { LandingSocialRail } from "./landing/LandingSocialRail";
import { LandingDeferred } from "./landing/LandingDeferred";
import { LandingSeo } from "./landing/LandingSeo";
import { useLandingInteractionQuiet } from "./landing/useLandingInteractionQuiet";
import { trackMetaPageView } from "../lib/metaPixel";
import { trackGoogleAdsPageView } from "../lib/googleAds";
import "./landing/landingFluidHero.css";
import "./landing/landingClinicalMotion.css";

export function LandingPage({ setView }) {
  const { t } = useTranslation("landing");
  useLandingInteractionQuiet();

  useEffect(() => {
    trackMetaPageView();
    trackGoogleAdsPageView();
  }, []);

  const setViewDeferred = useCallback(
    (view) => {
      requestAnimationFrame(() => {
        startTransition(() => {
          setView(view);
        });
      });
    },
    [setView],
  );

  return (
    <div className="landing-shell landing-shell--page landing-shell--fluid-hero min-h-screen p-3 pb-5 antialiased sm:p-5 sm:pb-20 lg:pb-6 lg:p-6">
      <LandingSeo />

      <a href="#landing-main" className="landing-skip-link">
        {t("nav.skipToContent")}
      </a>

      <LandingFluidHero setView={setViewDeferred} />

      <div className="landing-page-card mx-auto max-w-[82rem]">
        <LandingHeroCapabilities />
        <LandingHeroStats />

        <div className="landing-body-wrap">
          <div id="landing-main" className="relative" tabIndex={-1}>
            <LandingHowItWorks setView={setViewDeferred} />
            <LandingClinicalWorkflow />

            {/* Product siempre montado: anclas #product / #product-species */}
            <LandingProductShowcase />

            <LandingDeferred minHeight={520}>
              <LandingFeatures />
            </LandingDeferred>

            <LandingDeferred minHeight={360}>
              <LandingTestimonials />
            </LandingDeferred>

            <LandingDeferred minHeight={240}>
              <LandingAwardSeal />
            </LandingDeferred>

            <LandingDeferred minHeight={100}>
              <LandingTrustStrip />
            </LandingDeferred>

            <LandingDeferred minHeight={120}>
              <LandingSpeciesMarquee />
            </LandingDeferred>

            <LandingDeferred minHeight={520}>
              <LandingPricing setView={setViewDeferred} />
            </LandingDeferred>

            <LandingDeferred minHeight={360}>
              <LandingFaq />
            </LandingDeferred>

            <LandingDeferred minHeight={220}>
              <LandingCta setView={setViewDeferred} />
            </LandingDeferred>
          </div>
        </div>
      </div>

      <LandingFooter />

      <LandingSocialRail />
    </div>
  );
}
