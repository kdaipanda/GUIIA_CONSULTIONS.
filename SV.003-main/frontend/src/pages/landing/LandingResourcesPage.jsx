import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Mail, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GuiaaLogoImg } from "../../components/GuiaaBrandLockup";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { LandingFooter } from "./LandingFooter";
import "./landingResources.css";

const RESOURCE_TOPIC_IDS = [
  "getting-started",
  "cds",
  "diagnosis",
  "membership",
  "clients",
  "agenda",
];

export function LandingResourcesPage({ setView }) {
  const { t } = useTranslation(["landing", "help"]);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCE_TOPIC_IDS.map((id) => ({
      id,
      title: t(`help:topics.${id}.title`),
      summary: t(`help:topics.${id}.summary`),
      tip: t(`help:topics.${id}.tip`),
      body: t(`help:topics.${id}.body`, { returnObjects: true }),
      steps: t(`help:topics.${id}.steps`, { returnObjects: true }),
    })).filter((topic) => {
      if (!q) return true;
      const hay = `${topic.title} ${topic.summary} ${topic.tip}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, t]);

  const goHome = () => {
    setView?.("landing");
    navigate("/");
  };

  const goLogin = () => {
    setView?.("login");
    navigate("/login");
  };

  const goRegister = () => {
    setView?.("register");
    navigate("/registro");
  };

  return (
    <div className="landing-resources antialiased">
      <header className="landing-resources-header">
        <button
          type="button"
          className="landing-resources-brand"
          onClick={goHome}
          aria-label="GUIAA"
        >
          <GuiaaLogoImg tone="on-light" className="landing-resources-logo" alt="" />
        </button>
        <div className="landing-resources-header-actions">
          <LanguageSwitcher className="landing-resources-lang" />
          <button type="button" className="landing-resources-back" onClick={goHome}>
            <ArrowLeft size={16} aria-hidden />
            <span>{t("landing:resources.backHome")}</span>
          </button>
        </div>
      </header>

      <main className="landing-resources-main">
        <div className="landing-resources-hero">
          <p className="landing-resources-eyebrow">{t("landing:resources.eyebrow")}</p>
          <h1>{t("landing:resources.title")}</h1>
          <p className="landing-resources-lead">{t("landing:resources.lead")}</p>

          <label className="landing-resources-search">
            <Search size={18} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("landing:resources.searchPlaceholder")}
              aria-label={t("landing:resources.searchPlaceholder")}
            />
          </label>
        </div>

        <div className="landing-resources-quick">
          <a href="/#faq" className="landing-resources-quick-card">
            <BookOpen size={18} aria-hidden />
            <span>
              <strong>{t("landing:resources.quickFaq")}</strong>
              <em>{t("landing:resources.quickFaqLead")}</em>
            </span>
            <ArrowRight size={16} aria-hidden />
          </a>
          <a href="/#pricing" className="landing-resources-quick-card">
            <BookOpen size={18} aria-hidden />
            <span>
              <strong>{t("landing:resources.quickPricing")}</strong>
              <em>{t("landing:resources.quickPricingLead")}</em>
            </span>
            <ArrowRight size={16} aria-hidden />
          </a>
          <a href="mailto:soporte@guiaa.vet" className="landing-resources-quick-card">
            <Mail size={18} aria-hidden />
            <span>
              <strong>{t("landing:resources.quickSupport")}</strong>
              <em>soporte@guiaa.vet</em>
            </span>
            <ArrowRight size={16} aria-hidden />
          </a>
        </div>

        <section className="landing-resources-list" aria-label={t("landing:resources.title")}>
          {topics.length === 0 ? (
            <p className="landing-resources-empty">{t("landing:resources.empty")}</p>
          ) : (
            topics.map((topic) => {
              const open = openId === topic.id;
              return (
                <article key={topic.id} className={`landing-resources-card${open ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="landing-resources-card-head"
                    aria-expanded={open}
                    onClick={() => setOpenId((prev) => (prev === topic.id ? null : topic.id))}
                  >
                    <span>
                      <strong>{topic.title}</strong>
                      <em>{topic.summary}</em>
                    </span>
                    <ArrowRight size={18} aria-hidden className="landing-resources-card-chevron" />
                  </button>
                  {open && (
                    <div className="landing-resources-card-body">
                      <p className="landing-resources-tip">{topic.tip}</p>
                      {Array.isArray(topic.body) &&
                        topic.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                      {Array.isArray(topic.steps) && topic.steps.length > 0 && (
                        <>
                          <h2>{t("help:stepsLabel")}</h2>
                          <ol>
                            {topic.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        <div className="landing-resources-cta">
          <div>
            <h2>{t("landing:resources.ctaTitle")}</h2>
            <p>{t("landing:resources.ctaLead")}</p>
          </div>
          <div className="landing-resources-cta-actions">
            <button type="button" className="landing-resources-btn-primary" onClick={goRegister}>
              {t("landing:resources.ctaRegister")}
            </button>
            <button type="button" className="landing-resources-btn-secondary" onClick={goLogin}>
              {t("landing:resources.ctaLogin")}
            </button>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
