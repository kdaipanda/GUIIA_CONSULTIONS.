import React, { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

function FaqItem({ id, q, a, isOpen, onToggle }) {
  const panelId = `${id}-panel`;
  return (
    <li className={`landing-faq-row${isOpen ? " is-open" : ""}`}>
      <h3 className="landing-faq-heading">
        <button
          type="button"
          id={id}
          onClick={onToggle}
          className="landing-faq-trigger flex min-h-11 w-full items-center justify-between gap-4 py-4 text-left"
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="text-sm font-semibold text-guiaa-brand-navy sm:text-base">{q}</span>
          <ChevronDown
            size={18}
            className={`landing-faq-chevron shrink-0 text-guiaa-brand-navy/55 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={id}
        className="landing-faq-panel"
        hidden={!isOpen}
      >
        <div className="landing-faq-panel-inner pb-4 pr-8 text-sm leading-relaxed text-guiaa-brand-ink-muted">
          {a}
        </div>
      </div>
    </li>
  );
}

export function LandingFaq() {
  const { t } = useTranslation("landing");
  const [openIndex, setOpenIndex] = useState(0);
  const items = t("faq.items", { returnObjects: true }) || [];

  return (
    <section id="faq" className="landing-section border-t border-guiaa-brand-navy/8">
      <div className="landing-container">
        <div className="landing-faq-layout">
          <div className="landing-faq-intro">
            <h2 className="landing-section-title text-guiaa-brand-navy">
              {t("faq.title")}
            </h2>
            <p className="landing-lead mt-3 text-sm sm:text-base">{t("faq.lead")}</p>
            <a
              href="mailto:soporte@guiaa.vet"
              className="landing-link-quiet mt-6 inline-flex min-h-11 items-center gap-2"
            >
              <Mail size={15} aria-hidden />
              {t("faq.emailCta")}
            </a>
          </div>

          <ul className="landing-faq-list" aria-label={t("faq.title")}>
            {Array.isArray(items) && items.length > 0 ? (
              items.map((item, index) => (
                <FaqItem
                  key={item.q || index}
                  id={`faq-item-${index}`}
                  q={item.q}
                  a={item.a}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex((prev) => (prev === index ? -1 : index))}
                />
              ))
            ) : (
              <li className="py-4 text-sm text-guiaa-brand-ink-muted">{t("faq.empty")}</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
