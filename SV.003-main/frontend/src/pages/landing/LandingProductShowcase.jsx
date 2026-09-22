import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LANDING_SCREENSHOTS } from "./landingPreviewData";
import { LANDING_PREVIEW_MAP } from "./LandingAppPreview";
import {
  parseProductTabFromHash,
  setLandingProductTabHash,
  subscribeLandingProductTab,
} from "./landingScroll";

function PreviewFrame({ previewId }) {
  const Preview = LANDING_PREVIEW_MAP[previewId];
  if (!Preview) return null;

  return (
    <div className="landing-preview-viewport">
      <div className="landing-preview-scaler">
        <Preview />
      </div>
    </div>
  );
}

function ProductTabs({ activeId, setActiveId, t }) {
  return (
    <div
      className="landing-product-tabs flex gap-2"
      role="tablist"
      aria-label={t("product.tabsAria")}
      onKeyDown={(event) => {
        const index = LANDING_SCREENSHOTS.findIndex((shot) => shot.id === activeId);
        if (index < 0) return;

        let nextIndex = index;
        if (event.key === "ArrowRight") {
          nextIndex = (index + 1) % LANDING_SCREENSHOTS.length;
        } else if (event.key === "ArrowLeft") {
          nextIndex = (index - 1 + LANDING_SCREENSHOTS.length) % LANDING_SCREENSHOTS.length;
        } else {
          return;
        }

        event.preventDefault();
        const nextShot = LANDING_SCREENSHOTS[nextIndex];
        setActiveId(nextShot.id);
        setLandingProductTabHash(nextShot.id);
      }}
    >
      {LANDING_SCREENSHOTS.map((shot) => {
        const isActive = shot.id === activeId;
        return (
          <button
            key={shot.id}
            type="button"
            role="tab"
            id={`product-tab-${shot.id}`}
            aria-selected={isActive}
            aria-controls="product-panel"
            tabIndex={isActive ? 0 : -1}
            onClick={() => {
              setActiveId(shot.id);
              setLandingProductTabHash(shot.id);
            }}
            className={`landing-tab landing-product-tab ${isActive ? "is-active" : ""}`}
          >
            {t(`product.shots.${shot.id}.label`)}
          </button>
        );
      })}
    </div>
  );
}

export function LandingProductShowcase() {
  const { t } = useTranslation("landing");
  const [activeId, setActiveId] = useState(() => parseProductTabFromHash());

  useEffect(() => subscribeLandingProductTab(setActiveId), []);

  useEffect(() => {
    const syncFromHash = () => setActiveId(parseProductTabFromHash());
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const activeShot =
    LANDING_SCREENSHOTS.find((shot) => shot.id === activeId) || LANDING_SCREENSHOTS[0];
  const activeLabel = t(`product.shots.${activeShot.id}.label`);
  const activeCaption = t(`product.shots.${activeShot.id}.caption`);
  const bullets = t("product.bullets", { returnObjects: true });
  const bulletItems = Array.isArray(bullets) ? bullets : [];

  return (
    <section id="product" className="landing-section border-y border-guiaa-brand-navy/8">
      <div className="landing-container">
        <div className="landing-product-layout">
          <div className="landing-product-copy lg:sticky lg:top-24">
            <h2 className="landing-section-title text-guiaa-brand-navy text-balance">
              {t("product.title")}
            </h2>
            <p className="landing-lead mt-3 text-sm sm:mt-4 sm:text-base text-pretty">
              {t("product.lead")}
            </p>

            <ul className="landing-product-bullets mt-5 hidden lg:block">
              {bulletItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="landing-product-tabs-desktop mt-8 hidden lg:block">
              <ProductTabs activeId={activeId} setActiveId={setActiveId} t={t} />
              <p className="mt-4 text-sm text-guiaa-brand-ink-muted">{activeCaption}</p>
            </div>
          </div>

          <div className="landing-product-visual">
            <div className="landing-product-tabs-mobile mb-3 lg:hidden">
              <ProductTabs activeId={activeId} setActiveId={setActiveId} t={t} />
            </div>

            <div className="landing-product-shot w-full">
              <div className="landing-product-frame">
                <div className="landing-product-frame-inner">
                  <div className="landing-product-chrome flex items-center border-b border-guiaa-brand-navy/10 bg-white px-3 py-2">
                    <span className="landing-product-chrome-label truncate">
                      GUIAA · {activeLabel}
                    </span>
                  </div>

                  <div
                    id="product-panel"
                    className="landing-preview-panel relative"
                    role="tabpanel"
                    aria-labelledby={`product-tab-${activeShot.id}`}
                  >
                    <div key={activeShot.id} className="landing-product-panel-enter h-full">
                      <PreviewFrame previewId={activeShot.id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="landing-product-caption mt-3 text-sm text-guiaa-brand-ink-muted lg:hidden">
              {activeCaption}
            </p>

            <ul className="landing-product-bullets mt-4 lg:hidden">
              {bulletItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
