import React from "react";
import { useTranslation } from "react-i18next";

const COLLEAGUE_TESTIMONIALS = [
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
    id: "laura",
    name: "MVZ Laura S.",
    petImage: "/landing/pets/puppy.png",
    tone: "blue",
  },
  {
    id: "patricia",
    name: "Dra. Patricia V.",
    petImage: "/landing/pets/corgi.png",
    tone: "navy",
  },
  {
    id: "miguel",
    name: "Dr. Miguel T.",
    petImage: "/landing/pets/cat-ginger.png",
    tone: "green",
  },
  {
    id: "sofia",
    name: "Dra. Sofía L.",
    petImage: "/landing/pets/cat-black.png",
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
          <p className="landing-eyebrow">{t("testimonials.eyebrow")}</p>
          <h2
            id="landing-colleagues-heading"
            className="landing-section-title mt-3 text-3xl sm:text-4xl"
          >
            {t("testimonials.title")}
          </h2>
          <p className="landing-lead mt-4 max-w-xl">{t("testimonials.lead")}</p>
        </div>

        <ul className="landing-colleagues-bento" aria-label={t("testimonials.listAria")}>
          {COLLEAGUE_TESTIMONIALS.map(({ id, name, petImage, tone }) => (
            <li key={id}>
              <figure className={`landing-colleague-card landing-colleague-card--${tone}`}>
                <blockquote className="landing-colleague-quote">
                  <p>&ldquo;{t(`testimonials.items.${id}.quote`)}&rdquo;</p>
                </blockquote>
                <figcaption className="landing-colleague-meta">
                  <span className="landing-colleague-name">{name}</span>
                  <span className="landing-colleague-role">
                    {t(`testimonials.items.${id}.role`)}
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
