import React, { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

function FaqItem({ id, q, a, isOpen, onToggle }) {
  const panelId = `${id}-panel`;
  return (
    <div className="landing-card overflow-hidden rounded-xl">
      <button
        type="button"
        id={id}
        onClick={onToggle}
        className="landing-faq-trigger flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-guiaa-sky-soft/25"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="text-sm font-semibold text-guiaa-brand-navy sm:text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`landing-faq-chevron shrink-0 text-guiaa-brand-navy/55 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={id}
        className={`landing-faq-panel grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-guiaa-brand-navy/8 px-5 py-4 text-sm leading-relaxed text-guiaa-brand-ink-muted">
            {a}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingFaq({ setView }) {
  const { t } = useTranslation("landing");
  const [openIndex, setOpenIndex] = useState(0);
  const items = t("faq.items", { returnObjects: true }) || [];

  return (
    <section
      id="faq"
      className="landing-section border-t border-guiaa-brand-navy/8 bg-white/40"
    >
      <div className="landing-container">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="landing-eyebrow">{t("faq.eyebrow")}</p>
            <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
              {t("faq.title")}
            </h2>
            <p className="landing-lead mt-4 text-sm sm:text-base">
              {t("faq.lead")}
            </p>

            <div className="landing-card mt-8 rounded-xl p-5">
              <p className="text-sm font-semibold text-guiaa-brand-navy">
                {t("faq.moreTitle")}
              </p>
              <p className="mt-2 text-sm text-guiaa-brand-ink-muted">
                {t("faq.moreLead")}
              </p>
              <a
                href="mailto:soporte@guiaa.vet"
                className="landing-footer-link mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-guiaa-brand-blue transition hover:text-guiaa-brand-navy"
              >
                <Mail size={15} aria-hidden />
                {t("faq.emailCta")}
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {Array.isArray(items) &&
              items.map((item, index) => (
                <FaqItem
                  key={item.q || index}
                  id={`faq-item-${index}`}
                  q={item.q}
                  a={item.a}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex((prev) => (prev === index ? -1 : index))}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
