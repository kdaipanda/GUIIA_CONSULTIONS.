import React from "react";
import { useTranslation } from "react-i18next";

const COLLEAGUE_TESTIMONIALS = [
  {
    id: "ana",
    name: "Dra. Ana M.",
    petName: "Max",
    petImage: "/landing/pets/dog-golden.png",
    tone: "coral",
  },
  {
    id: "carlos",
    name: "Dr. Carlos R.",
    petName: "Luna",
    petImage: "/landing/pets/cat-tabby.png",
    tone: "rose",
  },
  {
    id: "laura",
    name: "MVZ Laura S.",
    petName: "Rocky",
    petImage: "/landing/pets/puppy.png",
    tone: "sky",
  },
  {
    id: "patricia",
    name: "Dra. Patricia V.",
    petName: "Nala",
    petImage: "/landing/pets/corgi.png",
    tone: "amber",
  },
  {
    id: "miguel",
    name: "Dr. Miguel T.",
    petName: "Simba",
    petImage: "/landing/pets/cat-ginger.png",
    tone: "violet",
  },
  {
    id: "sofia",
    name: "Dra. Sofía L.",
    petName: "Mía",
    petImage: "/landing/pets/cat-black.png",
    tone: "slate",
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

        <div
          className="landing-colleagues-bento"
          role="list"
          aria-label={t("testimonials.listAria")}
        >
          {COLLEAGUE_TESTIMONIALS.map(({ id, name, petName, petImage, tone }) => {
            const tags = t(`testimonials.items.${id}.tags`, {
              returnObjects: true,
            });
            return (
              <figure
                key={id}
                role="listitem"
                className={`landing-colleague-card landing-colleague-card--${tone}`}
              >
                <div className="landing-colleague-card-top">
                  <figcaption className="landing-colleague-name">{petName}</figcaption>
                  <ul
                    className="landing-colleague-tags"
                    aria-label={t("testimonials.caseOf", { name: petName })}
                  >
                    {(Array.isArray(tags) ? tags : []).map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </div>

                <blockquote className="landing-colleague-quote">
                  &ldquo;{t(`testimonials.items.${id}.quote`)}&rdquo;
                </blockquote>
                <p className="landing-colleague-role">
                  {name} · {t(`testimonials.items.${id}.role`)}
                </p>

                <picture>
                  <source
                    srcSet={petImage.replace(/\.png$/, ".webp")}
                    type="image/webp"
                  />
                  <img
                    src={petImage}
                    alt={t(`testimonials.items.${id}.petAlt`)}
                    className="landing-colleague-pet"
                    loading="lazy"
                    decoding="async"
                    width={320}
                    height={400}
                  />
                </picture>

                <span className="landing-colleague-curve" aria-hidden />
              </figure>
            );
          })}
        </div>

        <p className="landing-colleagues-disclaimer landing-colleagues-scroll-hint">
          <span className="landing-colleagues-scroll-hint-mobile">
            {t("testimonials.disclaimerMobile")}
          </span>
          {t("testimonials.disclaimer")}
        </p>
      </div>
    </section>
  );
}
