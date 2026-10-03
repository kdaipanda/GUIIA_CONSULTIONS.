import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Brain,
  ClipboardList,
  Crown,
  MoreVertical,
  Plus,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  formatConsultationDateShort,
  formatConsultationFolio,
  getConsultationPatientTitle,
  getConsultationReasonPreview,
  getConsultationSpeciesIcon,
  getConsultationSpeciesLabel,
  getConsultationStatusLabel,
} from "../../lib/consultationDisplay";
import "./dashboardActivity.css";

const ACCENT_BY_STATUS = {
  completed: "teal",
  in_progress: "blue",
  draft: "amber",
};

function consultationProgress(status) {
  if (status === "completed") return 100;
  if (status === "in_progress") return 65;
  return 30;
}

function relativeTimeLabel(iso, t) {
  if (!iso) return t("dashActivity.badgeDraft");
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return formatConsultationDateShort(iso);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t("dashActivity.timeJustNow");
  if (mins < 60) return t("dashActivity.timeMinutes", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 48) return t("dashActivity.timeHours", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 14) return t("dashActivity.timeDays", { count: days });
  return t("dashActivity.timeWeeks", { count: Math.floor(days / 7) });
}

function statusBadgeLabel(status, t) {
  if (status === "completed") return t("dashActivity.badgeCompleted");
  if (status === "in_progress") return t("dashActivity.badgeInProgress");
  return t("dashActivity.badgeDraft");
}

function ActivityCard({ consultation, embedded, onOpen, continueLabel, viewLabel, t }) {
  const status = consultation.status || "draft";
  const accent = ACCENT_BY_STATUS[status] || "blue";
  const progress = consultationProgress(status);
  const actionLabel = status === "draft" || status === "in_progress" ? continueLabel : viewLabel;
  const title = getConsultationPatientTitle(consultation);
  const species = getConsultationSpeciesLabel(consultation);
  const preview = getConsultationReasonPreview(consultation, 72);

  return (
    <article
      className={`dashboard-activity-card dashboard-activity-card--project accent-${accent}${
        embedded ? " dashboard-activity-card--embedded" : ""
      }`}
    >
      <div className="dashboard-activity-card-glow" aria-hidden />

      <div className="dashboard-activity-card-top">
        <time className="dashboard-activity-date" dateTime={consultation.created_at || undefined}>
          {formatConsultationDateShort(consultation.created_at)}
        </time>
        <button
          type="button"
          className="dashboard-activity-more"
          aria-label={t("dashActivity.openMenu")}
          onClick={() => onOpen?.(consultation.id)}
        >
          <MoreVertical size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="dashboard-activity-hero">
        <span className="dashboard-activity-species" aria-hidden>
          {getConsultationSpeciesIcon(consultation)}
        </span>
        <h3 className="dashboard-activity-title">{title}</h3>
        <p className="dashboard-activity-subtitle">
          {species}
          {status ? ` · ${getConsultationStatusLabel(status)}` : ""}
        </p>
        <p className="dashboard-activity-preview">{preview}</p>
      </div>

      <div className="dashboard-activity-progress">
        <div className="dashboard-activity-progress-head">
          <span>{t("dashActivity.progress")}</span>
          <span className="dashboard-activity-folio">{formatConsultationFolio(consultation)}</span>
        </div>
        <div
          className="dashboard-activity-progress-track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("dashActivity.progress")}
        >
          <span
            className="dashboard-activity-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="dashboard-activity-progress-foot">
          <span className="dashboard-activity-progress-pct">{progress}%</span>
        </div>
      </div>

      <div className="dashboard-activity-footer">
        <div className="dashboard-activity-avatars" aria-hidden>
          <span className="dashboard-activity-avatar dashboard-activity-avatar--species">
            {getConsultationSpeciesIcon(consultation)}
          </span>
          <button
            type="button"
            className="dashboard-activity-avatar dashboard-activity-avatar--add"
            onClick={() => onOpen?.(consultation.id)}
            aria-label={actionLabel}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
        <span className="dashboard-activity-time-badge">
          {relativeTimeLabel(consultation.created_at, t)}
        </span>
      </div>

      <div className="dashboard-activity-cta-row">
        <span className={`dashboard-activity-chip dashboard-activity-chip--${status}`}>
          {statusBadgeLabel(status, t)}
        </span>
        <Button
          type="button"
          variant="guiaaPrimarySm"
          size="compactGradient"
          className="dashboard-activity-action"
          onClick={() => onOpen?.(consultation.id)}
        >
          {actionLabel}
        </Button>
      </div>
    </article>
  );
}

function FollowUpItem({ consultation, onOpen }) {
  return (
    <button
      type="button"
      className="dashboard-followup-item"
      onClick={() => onOpen?.(consultation.id)}
    >
      <span className="dashboard-followup-dot" aria-hidden />
      <div className="dashboard-followup-text">
        <strong>{getConsultationPatientTitle(consultation)}</strong>
        <span>{getConsultationReasonPreview(consultation, 80)}</span>
      </div>
      <time className="dashboard-followup-date">
        {formatConsultationDateShort(consultation.created_at)}
      </time>
    </button>
  );
}

export function DashboardActivitySection({
  recentConsultations,
  followUpCases,
  dashboardLoading,
  embedded = false,
  isPremium = false,
  setView,
  openConsultation,
  onExpertConsultation,
}) {
  const { t } = useTranslation("clinic");

  const shortcuts = useMemo(
    () => [
      { key: "N", label: t("dashActivity.shortcuts.new"), icon: Plus, view: "new-consultation" },
      { key: "E", label: t("dashActivity.shortcuts.expert"), icon: Brain, view: "expert", premium: true },
      { key: "H", label: t("dashActivity.shortcuts.history"), icon: ClipboardList, view: "consultation-history" },
      { key: "M", label: t("dashActivity.shortcuts.membership"), icon: Crown, view: "membership" },
      { key: "P", label: t("dashActivity.shortcuts.profile"), icon: User, view: "profile" },
    ],
    [t],
  );

  const handleShortcut = (item) => {
    if (item.premium && !isPremium) {
      setView("membership");
      return;
    }
    if (item.view === "expert") {
      onExpertConsultation?.();
      return;
    }
    setView(item.view);
  };

  return (
    <section className={`dashboard-block dashboard-block-activity${embedded ? " clinic-settings-card" : ""}`}>
      {!embedded && (
        <div className="dashboard-block-head">
          <h2>{t("dashActivity.title")}</h2>
          <p>{t("dashActivity.lead")}</p>
        </div>
      )}

      <Tabs.Root className="tabs-root" defaultValue="activity">
        <Tabs.List className="tabs-list dashboard-activity-tabs" aria-label={t("dashActivity.tabsAria")}>
          <Tabs.Trigger className="tabs-trigger" value="activity">
            {t("dashActivity.tabRecent")}
            {recentConsultations.length > 0 && (
              <span className="dashboard-activity-tab-count">{recentConsultations.length}</span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger className="tabs-trigger" value="followup">
            {t("dashActivity.tabFollowup")}
            {followUpCases.length > 0 && (
              <span className="dashboard-activity-tab-count">{followUpCases.length}</span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger className="tabs-trigger" value="shortcuts">
            {t("dashActivity.tabShortcuts")}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="tabs-content" value="activity">
          <div className="dashboard-activity-panel">
            <div className="dashboard-activity-panel-head">
              <h3>{t("dashActivity.recentTitle")}</h3>
              {recentConsultations.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="dashboard-activity-view-all"
                  onClick={() => setView("consultation-history")}
                >
                  {t("dashActivity.viewHistory")}
                </Button>
              )}
            </div>

            {dashboardLoading ? (
              <div className="dashboard-activity-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="dashboard-activity-skeleton dashboard-activity-skeleton--project">
                    <div className="skeleton skeleton-text short" />
                    <div className="skeleton skeleton-text medium" />
                    <div className="skeleton skeleton-text long" />
                  </div>
                ))}
              </div>
            ) : recentConsultations.length > 0 ? (
              <div className="dashboard-activity-grid">
                {recentConsultations.map((consultation) => (
                  <ActivityCard
                    key={consultation.id}
                    consultation={consultation}
                    embedded={embedded}
                    onOpen={openConsultation}
                    continueLabel={t("dashActivity.continue")}
                    viewLabel={t("dashActivity.view")}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="dashboard-activity-empty">
                <h3>{t("dashActivity.emptyTitle")}</h3>
                <p>{t("dashActivity.emptyBody")}</p>
                <Button
                  type="button"
                  variant="guiaaPrimary"
                  size="consult"
                  onClick={() => setView("new-consultation")}
                >
                  {t("dashActivity.newConsultation")}
                </Button>
              </div>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content className="tabs-content" value="followup">
          <div className="dashboard-activity-panel">
            <div className="dashboard-activity-panel-head dashboard-activity-panel-head--stacked">
              <div>
                <h3>{t("dashActivity.followupTitle")}</h3>
                <p className="dashboard-activity-panel-note">
                  {t("dashActivity.followupNote")}
                </p>
              </div>
            </div>
            {followUpCases.length > 0 ? (
              <div className="dashboard-followup-list">
                {followUpCases.map((consultation) => (
                  <FollowUpItem
                    key={consultation.id}
                    consultation={consultation}
                    onOpen={openConsultation}
                  />
                ))}
              </div>
            ) : (
              <div className="dashboard-activity-empty dashboard-activity-empty--inline">
                <p>{t("dashActivity.followupEmpty")}</p>
              </div>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content className="tabs-content" value="shortcuts">
          <div className="dashboard-shortcuts-grid">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              const locked = item.premium && !isPremium;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`dashboard-shortcut-card${locked ? " dashboard-shortcut-card--locked" : ""}`}
                  onClick={() => handleShortcut(item)}
                  aria-label={
                    locked
                      ? `${item.label} (${t("dashActivity.premium")})`
                      : `${item.label}, ${item.key}`
                  }
                >
                  <span className="dashboard-shortcut-icon" aria-hidden>
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span className="dashboard-shortcut-label">{item.label}</span>
                  <kbd aria-hidden="true">{item.key}</kbd>
                  {locked && (
                    <span className="dashboard-shortcut-lock">{t("dashActivity.premium")}</span>
                  )}
                </button>
              );
            })}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
