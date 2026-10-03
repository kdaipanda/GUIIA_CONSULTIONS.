import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { HELP_TOPIC_IDS } from "../lib/helpCenter";

/**
 * Guías del centro de ayuda embebidas en el widget de soporte.
 */
export function SupportHelpPanel({ initialTopicId = null }) {
  const { t } = useTranslation("help");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(
    HELP_TOPIC_IDS.includes(initialTopicId) ? initialTopicId : null,
  );

  const topics = useMemo(
    () =>
      HELP_TOPIC_IDS.map((id) => ({
        id,
        title: t(`topics.${id}.title`),
        summary: t(`topics.${id}.summary`),
        tip: t(`topics.${id}.tip`),
        body: t(`topics.${id}.body`, { returnObjects: true, defaultValue: [] }),
        steps: t(`topics.${id}.steps`, { returnObjects: true }),
      })),
    [t],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((topic) => {
      const stepsText = Array.isArray(topic.steps) ? topic.steps.join(" ") : "";
      const bodyText = Array.isArray(topic.body) ? topic.body.join(" ") : "";
      return `${topic.title} ${topic.summary} ${topic.tip} ${bodyText} ${stepsText}`
        .toLowerCase()
        .includes(q);
    });
  }, [topics, query]);

  const selected = selectedId ? topics.find((topic) => topic.id === selectedId) : null;

  if (selected) {
    const steps = Array.isArray(selected.steps) ? selected.steps : [];
    const body = Array.isArray(selected.body) ? selected.body.filter(Boolean) : [];
    return (
      <div className="support-help-panel">
        <button
          type="button"
          className="support-chat-back"
          onClick={() => setSelectedId(null)}
        >
          <ArrowLeft size={14} aria-hidden />
          {t("backToList")}
        </button>
        <article className="support-help-detail">
          <h4>{selected.title}</h4>
          <p className="support-help-summary">{selected.summary}</p>
          <p className="support-help-tip">{selected.tip}</p>
          {body.length > 0 && (
            <div className="support-help-body">
              {body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          )}
          {steps.length > 0 && (
            <>
              <h5>{t("stepsLabel")}</h5>
              <ol className="support-help-steps">
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className="support-help-panel">
      <p className="support-help-lead">{t("lead")}</p>
      <label className="support-help-search">
        <Search size={14} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
        />
      </label>
      {filtered.length === 0 ? (
        <p className="support-chat-tickets-empty">{t("emptySearch")}</p>
      ) : (
        <ul className="support-help-list">
          {filtered.map((topic) => (
            <li key={topic.id}>
              <button
                type="button"
                className="support-help-item"
                onClick={() => setSelectedId(topic.id)}
              >
                <span className="support-help-item-title">{topic.title}</span>
                <span className="support-help-item-summary">{topic.summary}</span>
                <span className="support-help-item-cta">
                  {t("openGuide")}
                  <ArrowRight size={12} aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
