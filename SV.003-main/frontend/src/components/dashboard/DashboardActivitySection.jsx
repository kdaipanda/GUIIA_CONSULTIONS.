import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Brain,
  CalendarDays,
  ClipboardList,
  Crown,
  FlaskConical,
  Plus,
  Stethoscope,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  formatConsultationDateShort,
  formatConsultationFolio,
  getConsultationPatientTitle,
  getConsultationReasonPreview,
  getConsultationSpeciesIcon,
  getConsultationStatusLabel,
} from "../../lib/consultationDisplay";
import "./dashboardActivity.css";

const SHORTCUTS = [
  { key: "N", label: "Nueva consulta", icon: Plus, view: "new-consultation" },
  { key: "E", label: "Manejo Experto", icon: Brain, view: "expert", premium: true },
  { key: "H", label: "Historial clínico", icon: ClipboardList, view: "consultation-history" },
  { key: "M", label: "Membresía", icon: Crown, view: "membership" },
  { key: "P", label: "Perfil MVZ", icon: User, view: "profile" },
];

function ActivityCard({ consultation, embedded, onOpen }) {
  const status = consultation.status;
  const actionLabel = status === "draft" ? "Continuar" : "Ver";

  return (
    <article
      className={`dashboard-activity-card${embedded ? " dashboard-activity-card--embedded" : ""}`}
      onClick={() => onOpen?.(consultation.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(consultation.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="dashboard-activity-card-top">
        <span className="dashboard-activity-folio">{formatConsultationFolio(consultation)}</span>
        <span className={`dashboard-activity-status dashboard-activity-status--${status || "draft"}`}>
          {getConsultationStatusLabel(status)}
        </span>
      </div>

      <div className="dashboard-activity-main">
        <span className="dashboard-activity-species" aria-hidden>
          {getConsultationSpeciesIcon(consultation)}
        </span>
        <div className="dashboard-activity-body">
          <h3>{getConsultationPatientTitle(consultation)}</h3>
          <p>{getConsultationReasonPreview(consultation)}</p>
          <div className="dashboard-activity-meta">
            <span className="dashboard-activity-date">
              <CalendarDays size={14} aria-hidden />
              {formatConsultationDateShort(consultation.created_at)}
            </span>
            <Button
              type="button"
              variant="guiaaPrimarySm"
              size="compactGradient"
              className="dashboard-activity-action"
              onClick={(e) => {
                e.stopPropagation();
                onOpen?.(consultation.id);
              }}
            >
              {actionLabel}
            </Button>
          </div>
        </div>
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
      <div className="dashboard-block-head">
        <h2>Actividad clínica</h2>
        <p>Consultas recientes, casos en curso y accesos rápidos del flujo CDS.</p>
      </div>

      <Tabs.Root className="tabs-root" defaultValue="activity">
        <Tabs.List className="tabs-list dashboard-activity-tabs" aria-label="Secciones del dashboard">
          <Tabs.Trigger className="tabs-trigger" value="activity">
            Recientes
            {recentConsultations.length > 0 && (
              <span className="dashboard-activity-tab-count">{recentConsultations.length}</span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger className="tabs-trigger" value="followup">
            Seguimiento
            {followUpCases.length > 0 && (
              <span className="dashboard-activity-tab-count">{followUpCases.length}</span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger className="tabs-trigger" value="shortcuts">
            Atajos
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="tabs-content" value="activity">
          <div className="dashboard-activity-panel">
            <div className="dashboard-activity-panel-head">
              <h3>
                <ClipboardList size={18} aria-hidden />
                Últimas consultas CDS
              </h3>
              {recentConsultations.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="dashboard-activity-view-all"
                  onClick={() => setView("consultation-history")}
                >
                  Ver historial
                </Button>
              )}
            </div>

            {dashboardLoading ? (
              <div className="dashboard-activity-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="dashboard-activity-skeleton">
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
                  />
                ))}
              </div>
            ) : (
              <div className="dashboard-activity-empty">
                <div className="dashboard-activity-empty-icon">
                  <Stethoscope size={40} aria-hidden />
                </div>
                <h3>Sin consultas aún</h3>
                <p>Inicia tu primera consulta CDS con anamnesis estructurada multiespecie.</p>
                <Button
                  type="button"
                  variant="guiaaPrimary"
                  size="consult"
                  onClick={() => setView("new-consultation")}
                >
                  Nueva consulta
                </Button>
              </div>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content className="tabs-content" value="followup">
          <div className="dashboard-activity-panel">
            <div className="dashboard-activity-panel-head dashboard-activity-panel-head--stacked">
              <div>
                <h3>Casos en seguimiento</h3>
                <p className="dashboard-activity-panel-note">
                  Consultas en progreso que requieren continuidad clínica.
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
                <div className="dashboard-activity-empty-icon" aria-hidden>
                  <ClipboardList size={28} />
                </div>
                <p>No hay casos abiertos. Las consultas en progreso aparecerán aquí.</p>
              </div>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content className="tabs-content" value="shortcuts">
          <div className="dashboard-shortcuts-grid">
            {SHORTCUTS.map((item) => {
              const Icon = item.icon;
              const locked = item.premium && !isPremium;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`dashboard-shortcut-card${locked ? " dashboard-shortcut-card--locked" : ""}`}
                  onClick={() => handleShortcut(item)}
                >
                  <span className="dashboard-shortcut-icon">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className="dashboard-shortcut-label">{item.label}</span>
                  <kbd>{item.key}</kbd>
                  {locked && <span className="dashboard-shortcut-lock">Premium</span>}
                </button>
              );
            })}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
