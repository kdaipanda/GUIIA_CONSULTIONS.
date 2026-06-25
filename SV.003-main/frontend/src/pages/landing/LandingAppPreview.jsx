import React from "react";
import { BarChart3, Sun } from "lucide-react";
import {
  PREVIEW_CATEGORIES,
  PREVIEW_CATEGORY_ICONS,
  PREVIEW_CATEGORY_LABELS,
} from "./landingPreviewData";

function PreviewStepper({ currentStep }) {
  const steps = [
    { number: 1, label: "Datos", icon: "🐾" },
    { number: 2, label: "Motivo", icon: "📝" },
    { number: 3, label: "Diagnóstico", icon: "🔬" },
  ];

  return (
    <div className="step-indicator">
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
              step.icon
            )}
          </div>
          <div className="step-label">{step.label}</div>
        </div>
      ))}
    </div>
  );
}

function CategoryGrid({ selected = "perros" }) {
  const speciesCount = PREVIEW_CATEGORIES.length;
  return (
    <div className="form-section category-selector-glass-wrap">
      <div className="category-selector-glass-head">
        <span className="category-selector-glass-badge">
          Multiespecie veterinaria · {speciesCount} formularios clínicos
        </span>
      </div>
      <div className="category-selector-glass-panel">
        <div className="category-grid category-grid--liquid">
          {PREVIEW_CATEGORIES.map((key) => (
            <div
              key={key}
              className={`category-card category-card--liquid ${selected === key ? "selected" : ""}`}
            >
              <span className="category-icon">{PREVIEW_CATEGORY_ICONS[key]}</span>
              <span className="category-label">{PREVIEW_CATEGORY_LABELS[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConsultationSidebar({
  petName = "Max",
  species = "Perros",
  progress = "33%",
  stepLabel = "Progreso (1/3)",
}) {
  return (
    <aside className="consultation-sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">Mascota</div>
        <div className="sidebar-value">{petName}</div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">Especie</div>
        <div className="sidebar-value">{species}</div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">{stepLabel}</div>
        <div className="sidebar-progress-container">
          <div className="sidebar-progress-bar" style={{ width: progress }} />
        </div>
      </div>
    </aside>
  );
}

export function ConsultationSpeciesPreview() {
  return (
    <div className="consultation-page landing-app-preview-page">
      <div className="page-title-header">
        <div className="container">
          <div className="page-title-content">
            <div className="page-title-icon">🐾</div>
            <div className="page-title-text">
              <h1>Nueva Consulta Veterinaria</h1>
              <p>Complete la información de la mascota para iniciar el diagnóstico clínico</p>
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
                  <h3>Información básica</h3>
                  <div className="form-group">
                    <label>Nombre de la mascota</label>
                    <input type="text" value="Max" readOnly tabIndex={-1} />
                  </div>
                  <div className="form-group">
                    <label>Raza</label>
                    <input type="text" value="Mestizo" readOnly tabIndex={-1} />
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
  return (
    <div className="consultation-page landing-app-preview-page">
      <div className="page-title-header">
        <div className="container">
          <div className="page-title-content">
            <div className="page-title-icon">📝</div>
            <div className="page-title-text">
              <h1>Motivo de Consulta</h1>
              <p>Describa detalladamente los síntomas y observaciones de la mascota</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="consultation-form-container">
          <PreviewStepper currentStep={2} />
          <form className="consultation-form">
            <div className="form-section">
              <h3>Detalle de la mascota</h3>
              <div className="form-group">
                <label>ANOTA CON EL MAYOR DETALLE LOS DATOS SOBRE LA MASCOTA.</label>
                <textarea
                  readOnly
                  tabIndex={-1}
                  rows={8}
                  value={
                    "Paciente canino, 4 años, 18 kg. Vómito intermitente desde hace 48 h, sin diarrea. Apetito disminuido. Última comida ayer por la noche.\n\nAl examen: T° 39.2 °C, deshidratación leve (5%), mucosas pálidas, dolor abdominal leve en epigastrio."
                  }
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
  return (
    <div className="dashboard-page dashboard-morning landing-app-preview-page">
      <div className="container">
        <div className="dashboard-header">
          <div className="dashboard-header-row">
            <div className="hero-welcome">
              <div className="hero-greeting">
                <h1>Buenos días, Dra. García</h1>
                <span className="greeting-icon">
                  <Sun size={18} aria-hidden />
                </span>
              </div>
              <div className="hero-divider" />
              <div className="hero-summary">
                <span className="hero-summary-item">
                  <BarChart3 className="icon" size={16} aria-hidden />
                  24 consultas
                </span>
                <span className="hero-summary-divider">•</span>
                <span className="hero-badge premium">⭐ Premium</span>
              </div>
            </div>
          </div>
        </div>
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>24</h3>
              <p>Consultas Totales</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>8</h3>
              <p>Este Mes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Premium</h3>
              <p>Membresía</p>
            </div>
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
