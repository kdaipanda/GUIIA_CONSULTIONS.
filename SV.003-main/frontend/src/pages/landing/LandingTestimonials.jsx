import React from "react";
import { useTranslation } from "react-i18next";

const PRACTICE_OUTCOMES = [
  {
    id: "ana",
    name: "Dra. Ana M.",
    petImage: "/landing/pets/dog-golden.png",
    tone: "navy",
  },
  {
    id: "carlos",
    name: "Dr. Carlos R.",
    petImage: "/landing/pets/cat-tabby.png",
    tone: "green",
  },
  {
    id: "patricia",
    name: "Dra. Patricia V.",
    petImage: "/landing/pets/corgi.png",
    tone: "blue",
  },
];

export function LandingTestimonials() {
  const { t } = useTranslation("landing");

  return (
    <section
      className="landing-colleagues-section landing-section"
      aria-labelledby="landing-colleagues-heading"
    >
      <div className="landing-container">
        <div className="landing-colleagues-head">
          <h2
            id="landing-colleagues-heading"
            className="landing-section-title"
          >
            {t("testimonials.title")}
          </h2>
          <p className="landing-lead mt-4 max-w-xl">{t("testimonials.lead")}</p>
        </div>

        <ul className="landing-colleagues-bento landing-colleagues-bento--outcomes" aria-label={t("testimonials.listAria")}>
          {PRACTICE_OUTCOMES.map(({ id, name, petImage, tone }) => (
            <li key={id}>
              <figure className={`landing-colleague-card landing-colleague-card--${tone}`}>
                <p className="landing-colleague-result">
                  <span className="landing-colleague-result-label">
                    {t("testimonials.resultLabel")}
                  </span>
                  {t(`testimonials.items.${id}.result`)}
                </p>
                <blockquote className="landing-colleague-quote">
                  <p>&ldquo;{t(`testimonials.items.${id}.quote`)}&rdquo;</p>
                </blockquote>
                <figcaption className="landing-colleague-meta">
                  <span className="landing-colleague-name">{name}</span>
                  <span className="landing-colleague-clinic">
                    {t(`testimonials.items.${id}.clinic`)}
                  </span>
                  <span className="landing-colleague-role">
                    {t(`testimonials.items.${id}.city`)}
                  </span>
                </figcaption>
                <picture>
                  <source
                    srcSet={petImage.replace(/\.png$/, ".webp")}
                    type="image/webp"
                  />
                  <img
                    src={petImage}
                    alt=""
                    aria-hidden
                    className="landing-colleague-pet"
                    loading="lazy"
                    decoding="async"
                    width={280}
                    height={340}
                  />
                </picture>
              </figure>
            </li>
          ))}
        </ul>

        <p className="landing-colleagues-disclaimer">
          <span className="landing-colleagues-scroll-hint-mobile">
            {t("testimonials.disclaimerMobile")}
          </span>
          {t("testimonials.disclaimer")}
        </p>
      </div>
    </section>
  );
}
