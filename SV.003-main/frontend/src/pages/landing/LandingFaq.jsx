import React, { useState } from "react";
import { ArrowRight, ChevronDown, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { dispatchOpenHelp } from "../../lib/supportReadState";

function FaqAnswer({ a }) {
  const paragraphs = Array.isArray(a) ? a.filter(Boolean) : a ? [a] : [];
  if (paragraphs.length === 0) return null;
  return (
    <div className="landing-faq-panel-inner space-y-3 pb-4 pr-8 text-sm leading-relaxed text-guiaa-brand-ink-muted">
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
    </div>
  );
}

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
        <FaqAnswer a={a} />
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
            <p className="landing-faq-eyebrow text-xs font-semibold uppercase tracking-[0.14em] text-guiaa-brand-ink-muted">
              {t("faq.eyebrow")}
            </p>
            <h2 className="landing-section-title mt-2 text-guiaa-brand-navy">
              {t("faq.title")}
            </h2>
            <p className="landing-lead mt-3 text-sm sm:text-base">{t("faq.lead")}</p>
            <p className="mt-4 text-sm leading-relaxed text-guiaa-brand-ink-muted">
              {t("faq.moreLead")}
            </p>
            <div className="mt-6 flex flex-col items-start gap-3">
              <button
                type="button"
                onClick={() => dispatchOpenHelp()}
                className="landing-faq-help-cta inline-flex min-h-11 items-center gap-2 rounded-full border border-guiaa-brand-navy/15 bg-white px-5 text-sm font-semibold text-guiaa-brand-navy shadow-sm transition hover:border-guiaa-brand-green/45 hover:bg-guiaa-brand-green/5"
              >
                {t("faq.helpCenterCta")}
                <ArrowRight size={16} aria-hidden />
              </button>
              <a
                href="mailto:soporte@guiaa.vet"
                className="landing-link-quiet inline-flex min-h-11 items-center gap-2"
              >
                <Mail size={15} aria-hidden />
                {t("faq.emailCta")}
              </a>
            </div>
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
