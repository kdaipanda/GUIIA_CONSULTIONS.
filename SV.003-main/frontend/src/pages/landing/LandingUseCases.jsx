import React from "react";
import { useTranslation } from "react-i18next";
import { onLandingAnchorClick, productTabHref } from "./landingScroll";

const USE_CASES = [
  { id: "first", productTab: "consultation", featured: true },
  { id: "chronic", productTab: "consultation" },
  { id: "exotic", productTab: "species" },
  { id: "house", productTab: "consultation" },
];

export function LandingUseCases() {
  const { t } = useTranslation("landing");

  return (
    <section
      className="landing-section border-t border-guiaa-brand-navy/8"
      aria-labelledby="landing-usecases-heading"
    >
      <div className="landing-container">
        <div className="landing-usecases-layout">
          <div className="landing-section-head max-w-xl">
            <h2
              id="landing-usecases-heading"
              className="landing-section-title text-guiaa-brand-navy"
            >
              {t("useCases.title")}
            </h2>
            <p className="landing-lead mt-4">{t("useCases.lead")}</p>
          </div>

          <div className="landing-usecases-list">
            {USE_CASES.map(({ id, productTab, featured }) => {
              const title = t(`useCases.items.${id}.title`);
              return (
                <a
                  key={id}
                  href={productTabHref(productTab)}
                  onClick={(event) => onLandingAnchorClick(event, { productTab })}
                  className={`landing-usecase-row text-left ${
                    featured ? "landing-usecase-row--featured" : ""
                  }`}
                  aria-label={title}
                >
                  <p className="landing-usecase-tag">{t(`useCases.items.${id}.tag`)}</p>
                  <h3 className="landing-usecase-title">{title}</h3>
                  <p className="landing-usecase-desc">
                    {t(`useCases.items.${id}.description`)}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
