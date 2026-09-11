import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CircleHelp,
  PlayCircle,
  Search,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  HELP_TOPIC_IDS,
  HELP_TOPIC_TO_VIEW,
  requestPlatformOnboarding,
} from "../../lib/helpCenter";
import { dispatchOpenSupport } from "../../lib/supportReadState";
import "./clinicPageShared.css";
import "./helpCenterPage.css";

export function HelpCenterPage({ setView }) {
  const { t } = useTranslation("help");
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");

  const activeTopic = searchParams.get("tema");
  const selectedId = HELP_TOPIC_IDS.includes(activeTopic) ? activeTopic : null;

  const topics = useMemo(
    () =>
      HELP_TOPIC_IDS.map((id) => ({
        id,
        title: t(`topics.${id}.title`),
        summary: t(`topics.${id}.summary`),
        tip: t(`topics.${id}.tip`),
        steps: t(`topics.${id}.steps`, { returnObjects: true }),
      })),
    [t],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((topic) => {
      const stepsText = Array.isArray(topic.steps) ? topic.steps.join(" ") : "";
      return `${topic.title} ${topic.summary} ${topic.tip} ${stepsText}`
        .toLowerCase()
        .includes(q);
    });
  }, [topics, query]);

  const selected = selectedId ? topics.find((topic) => topic.id === selectedId) : null;

  const openTopic = (id) => {
    setSearchParams(id ? { tema: id } : {});
  };

  const goToModule = (topicId) => {
    const view = HELP_TOPIC_TO_VIEW[topicId];
    if (!view) return;
    setView?.(view);
  };

  const openTour = () => {
    requestPlatformOnboarding();
  };

  if (selected) {
    const steps = Array.isArray(selected.steps) ? selected.steps : [];
    return (
      <div className="clinic-page clinic-page-guiaa help-center-page">
        <div className="clinic-page-header">
          <div>
            <p className="clinic-page-eyebrow">{t("eyebrow")}</p>
            <h1>{selected.title}</h1>
            <p>{selected.summary}</p>
          </div>
          <div className="help-center-header-actions">
            <Button type="button" variant="outline" onClick={() => openTopic(null)}>
              <ArrowLeft size={16} aria-hidden />
              {t("backToList")}
            </Button>
            {HELP_TOPIC_TO_VIEW[selected.id] && (
              <Button type="button" onClick={() => goToModule(selected.id)}>
                {t("goToModule")}
                <ArrowRight size={16} aria-hidden />
              </Button>
            )}
          </div>
        </div>

        <article className="help-center-detail">
          <p className="help-center-detail-tip">{selected.tip}</p>
          <h2>{t("stepsLabel")}</h2>
          <ol className="help-center-steps">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="help-center-support-hint">{t("supportHint")}</p>
          <div className="help-center-detail-actions">
            <Button type="button" variant="secondary" onClick={openTour}>
              <PlayCircle size={16} aria-hidden />
              {t("openTour")}
            </Button>
            <Button type="button" variant="outline" onClick={() => dispatchOpenSupport()}>
              <MessageCircle size={16} aria-hidden />
              {t("contactSupport")}
            </Button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="clinic-page clinic-page-guiaa help-center-page">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("lead")}</p>
        </div>
        <div className="help-center-header-actions">
          <Button type="button" variant="secondary" onClick={openTour}>
            <PlayCircle size={16} aria-hidden />
            {t("openTour")}
          </Button>
        </div>
      </div>

      <div className="help-center-toolbar">
        <div className="clinic-search help-center-search">
          <Search size={16} aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
          />
        </div>
        <p className="help-center-tour-hint">{t("restartTourHint")}</p>
      </div>

      {filtered.length === 0 ? (
        <p className="help-center-empty">{t("emptySearch")}</p>
      ) : (
        <div className="help-center-grid">
          {filtered.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className="help-center-card"
              onClick={() => openTopic(topic.id)}
            >
              <span className="help-center-card-icon" aria-hidden>
                {topic.id === "getting-started" ? <BookOpen size={18} /> : <CircleHelp size={18} />}
              </span>
              <span className="help-center-card-title">{topic.title}</span>
              <span className="help-center-card-summary">{topic.summary}</span>
              <span className="help-center-card-cta">
                {t("openGuide")}
                <ArrowRight size={14} aria-hidden />
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="help-center-support-hint">{t("supportHint")}</p>
    </div>
  );
}
