import React from "react";
import { CalendarDays, FlaskConical, User } from "lucide-react";
import { cleanClinicalDisplayText } from "../../lib/consultationPdf";
import { formatConsultationDateShort } from "../../lib/consultationDisplay";
import { getLabStudyLabel } from "../../lib/clinicalTimeline";

export function LabStudyHistoryCard({ study }) {
  const analysisPreview = study.analysis ? cleanClinicalDisplayText(study.analysis) : "";
  const patientName = study.patient_name?.trim() || "Paciente no especificado";

  return (
    <article className="history-card history-card-guiaa history-card--lab">
      <div className="history-card-header completed">
        <div className="history-card-top">
          <span className="history-card-id">{getLabStudyLabel(study)}</span>
          <span className="history-status-badge completed">Interpretación</span>
        </div>

        <div className="history-card-patient">
          <div className="history-avatar" aria-hidden>
            <FlaskConical size={22} />
          </div>
          <div className="history-patient-info">
            <h3>{patientName}</h3>
            <div className="history-patient-meta">
              <span className="history-meta-item">Estudio de laboratorio</span>
            </div>
          </div>
        </div>
      </div>

      <div className="history-card-body">
        <div className="history-info-grid">
          <div className="history-info-item">
            <span className="history-info-icon history-info-icon--lucide">
              <User size={16} aria-hidden />
            </span>
            <div className="history-info-content">
              <span className="history-info-label">Mascota</span>
              <span className="history-info-value">{patientName}</span>
            </div>
          </div>
          <div className="history-info-item">
            <span className="history-info-icon history-info-icon--lucide">
              <CalendarDays size={16} aria-hidden />
            </span>
            <div className="history-info-content">
              <span className="history-info-label">Fecha</span>
              <span className="history-info-value">
                {formatConsultationDateShort(study.created_at)}
              </span>
            </div>
          </div>
        </div>

        {analysisPreview && (
          <div className="history-extra-card highlight">
            <span className="history-extra-label">Interpretación clínica</span>
            <p>
              {analysisPreview.length > 220
                ? `${analysisPreview.slice(0, 220).trim()}…`
                : analysisPreview}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
