import React from "react";
import { BarChart3, ClipboardList, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PREVIEW_CATEGORIES, PREVIEW_CATEGORY_ICONS } from "./landingPreviewData";

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
  const visible = PREVIEW_CATEGORIES.slice(0, 6);
  const moreCount = Math.max(0, speciesCount - visible.length);

  return (
    <div className="form-section landing-preview-species">
      <p className="landing-preview-species-eyebrow">
        {t("preview.multiSpeciesBadge", { count: speciesCount })}
      </p>
      <div className="landing-preview-species-grid">
        {visible.map((key) => (
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
        {moreCount > 0 ? (
          <div className="landing-species-chip landing-preview-species-chip landing-preview-species-more">
            <span className="landing-species-label">+{moreCount}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConsultationSidebar({
  petName = "Max",
  progress = "33%",
  current = 1,
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
          {t("preview.sidebar.progress", { current, total: 3 })}
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
            <div className="page-title-icon" aria-hidden>
              {PREVIEW_CATEGORY_ICONS.perros}
            </div>
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
            <div className="page-title-icon" aria-hidden>
              <ClipboardList size={22} strokeWidth={1.75} />
            </div>
            <div className="page-title-text">
              <h1>{t("preview.reasonTitle")}</h1>
              <p>{t("preview.reasonLead")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="consultation-layout">
          <div className="consultation-main">
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
                      rows={4}
                      value={t("preview.petDetailSample")}
                    />
                  </div>
                </div>
                <div className="form-section landing-preview-vitals">
                  <h3>{t("preview.vitalsTitle")}</h3>
                  <div className="landing-preview-vitals-grid">
                    <div>
                      <span>{t("preview.vitals.temp")}</span>
                      <strong>39.2 °C</strong>
                    </div>
                    <div>
                      <span>{t("preview.vitals.hr")}</span>
                      <strong>118 bpm</strong>
                    </div>
                    <div>
                      <span>{t("preview.vitals.rr")}</span>
                      <strong>32 rpm</strong>
                    </div>
                    <div>
                      <span>{t("preview.vitals.weight")}</span>
                      <strong>18 kg</strong>
                    </div>
                  </div>
                </div>
                <div className="form-section landing-preview-cds">
                  <h3>{t("preview.cdsTitle")}</h3>
                  <ol className="landing-preview-cds-list">
                    <li>{t("preview.cds.h1")}</li>
                    <li>{t("preview.cds.h2")}</li>
                    <li>{t("preview.cds.h3")}</li>
                  </ol>
                </div>
              </form>
            </div>
          </div>
          <ConsultationSidebar progress="66%" current={2} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const { t } = useTranslation("landing");
  const recent = [
    { pet: "Max", species: t("preview.sidebar.dogs"), status: t("preview.recent.open") },
    { pet: "Luna", species: t("preview.recent.cats"), status: t("preview.recent.done") },
    { pet: "Kira", species: t("preview.sidebar.dogs"), status: t("preview.recent.open") },
  ];

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
                <span className="landing-preview-plan-label">
                  {t("preview.statMembership")} · Premium
                </span>
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
            <p className="landing-preview-stat-value">3</p>
            <p className="landing-preview-stat-label">{t("preview.statToday")}</p>
          </div>
        </div>
        <div className="landing-preview-recent">
          <p className="landing-preview-recent-title">{t("preview.recentTitle")}</p>
          <ul className="landing-preview-recent-list">
            {recent.map((row) => (
              <li key={row.pet}>
                <span className="landing-preview-recent-pet">{row.pet}</span>
                <span className="landing-preview-recent-meta">{row.species}</span>
                <span className="landing-preview-recent-status">{row.status}</span>
              </li>
            ))}
          </ul>
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
