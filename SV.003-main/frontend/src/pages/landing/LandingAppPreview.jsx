import React from "react";
import { BarChart3, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  PREVIEW_CATEGORIES,
  PREVIEW_CATEGORY_ICONS,
} from "./landingPreviewData";

function PreviewStepper({ currentStep }) {
  const { t } = useTranslation("landing");
  const steps = [
    { number: 1, label: t("preview.steps.data") },
    { number: 2, label: t("preview.steps.reason") },
    { number: 3, label: t("preview.steps.diagnosis") },
  ];

  return (
    <div className="step-indicator landing-preview-stepper">
      <div
        className="step-progress-line"
        style={{ width: `${(currentStep - 1) * 50}%` }}
      />
      {steps.map((step) => (
        <div
          key={step.number}
          className={`step ${currentStep === step.number ? "active" : ""} ${
            currentStep > step.number ? "completed" : ""
          }`}
        >
          <div className="step-icon-wrapper">
            {currentStep > step.number ? (
              <span className="check-icon">✓</span>
            ) : (
              <span className="landing-preview-step-num">{step.number}</span>
            )}
          </div>
          <div className="step-label">{step.label}</div>
        </div>
      ))}
    </div>
  );
}

function CategoryGrid({ selected = "perros" }) {
  const { t } = useTranslation("landing");
  const speciesCount = PREVIEW_CATEGORIES.length;
  return (
    <div className="form-section landing-preview-species">
      <p className="landing-preview-species-eyebrow">
        {t("preview.multiSpeciesBadge", { count: speciesCount })}
      </p>
      <div className="landing-preview-species-grid">
        {PREVIEW_CATEGORIES.map((key) => (
          <div
            key={key}
            className={`landing-species-chip landing-preview-species-chip${
              selected === key ? " is-selected" : ""
            }`}
          >
            <span className="landing-species-icon" aria-hidden>
              {PREVIEW_CATEGORY_ICONS[key]}
            </span>
            <span className="landing-species-label">
              {t(`speciesMarquee.categories.${key}`, { defaultValue: key })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsultationSidebar({
  petName = "Max",
  progress = "33%",
}) {
  const { t } = useTranslation("landing");
  return (
    <aside className="consultation-sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">{t("preview.sidebar.pet")}</div>
        <div className="sidebar-value">{petName}</div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">{t("preview.sidebar.species")}</div>
        <div className="sidebar-value">{t("preview.sidebar.dogs")}</div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">
          {t("preview.sidebar.progress", { current: 1, total: 3 })}
        </div>
        <div className="sidebar-progress-container">
          <div className="sidebar-progress-bar" style={{ width: progress }} />
        </div>
      </div>
    </aside>
  );
}

export function ConsultationSpeciesPreview() {
  const { t } = useTranslation("landing");
  return (
    <div className="consultation-page landing-app-preview-page">
      <div className="page-title-header">
        <div className="container">
          <div className="page-title-content">
            <div className="page-title-icon">🐾</div>
            <div className="page-title-text">
              <h1>{t("preview.speciesTitle")}</h1>
              <p>{t("preview.speciesLead")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="consultation-layout">
          <div className="consultation-main">
            <div className="consultation-form-container">
              <PreviewStepper currentStep={1} />
              <form className="consultation-form">
                <CategoryGrid selected="perros" />
                <div className="form-section">
                  <h3>{t("preview.basicInfo")}</h3>
                  <div className="form-group">
                    <label>{t("preview.petName")}</label>
                    <input type="text" value="Max" readOnly tabIndex={-1} />
                  </div>
                  <div className="form-group">
                    <label>{t("preview.breed")}</label>
                    <input
                      type="text"
                      value={t("preview.breedValue")}
                      readOnly
                      tabIndex={-1}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
          <ConsultationSidebar />
        </div>
      </div>
    </div>
  );
}

export function ConsultationFormPreview() {
  const { t } = useTranslation("landing");
  return (
    <div className="consultation-page landing-app-preview-page">
      <div className="page-title-header">
        <div className="container">
          <div className="page-title-content">
            <div className="page-title-icon">📝</div>
            <div className="page-title-text">
              <h1>{t("preview.reasonTitle")}</h1>
              <p>{t("preview.reasonLead")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="consultation-form-container">
          <PreviewStepper currentStep={2} />
          <form className="consultation-form">
            <div className="form-section">
              <h3>{t("preview.petDetail")}</h3>
              <div className="form-group">
                <label>{t("preview.petDetailLabel")}</label>
                <textarea
                  readOnly
                  tabIndex={-1}
                  rows={8}
                  value={t("preview.petDetailSample")}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const { t } = useTranslation("landing");
  return (
    <div className="dashboard-page dashboard-morning landing-app-preview-page">
      <div className="container">
        <div className="dashboard-header">
          <div className="dashboard-header-row">
            <div className="hero-welcome">
              <div className="hero-greeting">
                <h1>{t("preview.dashboardGreeting")}</h1>
                <span className="greeting-icon">
                  <Sun size={18} aria-hidden />
                </span>
              </div>
              <div className="hero-divider" />
              <div className="hero-summary">
                <span className="hero-summary-item">
                  <BarChart3 className="icon" size={16} aria-hidden />
                  {t("preview.dashboardConsultations", { count: 24 })}
                </span>
                <span className="hero-summary-divider">·</span>
                <span className="landing-preview-plan-badge">Premium</span>
              </div>
            </div>
          </div>
        </div>
        <div className="landing-preview-stats">
          <div className="landing-preview-stat">
            <p className="landing-preview-stat-value">24</p>
            <p className="landing-preview-stat-label">{t("preview.statTotal")}</p>
          </div>
          <div className="landing-preview-stat">
            <p className="landing-preview-stat-value">8</p>
            <p className="landing-preview-stat-label">{t("preview.statMonth")}</p>
          </div>
          <div className="landing-preview-stat">
            <p className="landing-preview-stat-value">Premium</p>
            <p className="landing-preview-stat-label">{t("preview.statMembership")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const LANDING_PREVIEW_MAP = {
  species: ConsultationSpeciesPreview,
  consultation: ConsultationFormPreview,
  dashboard: DashboardPreview,
};
