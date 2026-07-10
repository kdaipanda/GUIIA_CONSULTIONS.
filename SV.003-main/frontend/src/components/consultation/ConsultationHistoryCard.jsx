import React from "react";
import { CalendarDays, FileDown, FlaskConical, User } from "lucide-react";
import { Button } from "../ui/button";
import { cleanClinicalDisplayText } from "../../lib/consultationPdf";
import {
  formatConsultationDateShort,
  formatConsultationFolio,
  getConsultationReasonPreview,
  getConsultationSpeciesIcon,
  getConsultationSpeciesLabel,
  getConsultationStatusLabel,
  normalizeConsultationRecord,
} from "../../lib/consultationDisplay";

export function ConsultationHistoryCard({
  consultation,
  pdfLoadingId,
  onView,
  onDownloadPdf,
  onContinue,
}) {
  const record = normalizeConsultationRecord(consultation);
  const status = record.status || "completed";
  const ratingValue = record.rating || 0;
  const ownerName = record.nombre_dueno || "No especificado";
  const medicalImages = record.medical_images || [];
  const analysisPreview = record.analysis
    ? cleanClinicalDisplayText(record.analysis)
    : "";

  return (
    <article className={`history-card history-card-guiaa history-card--${status}`}>
      <div className={`history-card-header ${status}`}>
        <div className="history-card-top">
          <span className="history-card-id" title={formatConsultationFolio(record)}>
            {formatConsultationFolio(record)}
          </span>
          <span className={`history-status-badge ${status}`}>
            {status === "completed" && "✓ "}
            {getConsultationStatusLabel(status)}
          </span>
        </div>

        <div className="history-card-patient">
          <div className="history-avatar" aria-hidden>
            {getConsultationSpeciesIcon(record)}
          </div>
          <div className="history-patient-info">
            <h3>{record.nombre_mascota?.trim() || getConsultationSpeciesLabel(record)}</h3>
            <div className="history-patient-meta">
              <span className="history-meta-item history-meta-species">
                {getConsultationSpeciesLabel(record)}
              </span>
              {record.raza && <span className="history-meta-item">{record.raza}</span>}
              {record.edad && <span className="history-meta-item">{record.edad}</span>}
            </div>
            {ratingValue > 0 && (
              <div className="history-rating" aria-label={`Calificación ${ratingValue} de 5`}>
                {Array.from({ length: ratingValue }).map((_, idx) => (
                  <span key={idx} className="paw-static filled">
                    🐾
                  </span>
                ))}
              </div>
            )}
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
              <span className="history-info-label">Propietario</span>
              <span className="history-info-value">{ownerName}</span>
            </div>
          </div>
          <div className="history-info-item">
            <span className="history-info-icon history-info-icon--lucide">
              <CalendarDays size={16} aria-hidden />
            </span>
            <div className="history-info-content">
              <span className="history-info-label">Fecha</span>
              <span className="history-info-value">
                {formatConsultationDateShort(record.created_at || record.fecha)}
              </span>
            </div>
          </div>
        </div>

        {(record.detalle_paciente || record.motivo_consulta || record.sintomas) && (
          <div className="history-motivo">
            <span className="history-motivo-label">Motivo de consulta</span>
            <p className="history-motivo-text">
              {getConsultationReasonPreview(record, 280)}
            </p>
          </div>
        )}

        {analysisPreview && (
          <div className="history-extra-card highlight">
            <span className="history-extra-label">Análisis clínico</span>
            <p>
              {analysisPreview.length > 220
                ? `${analysisPreview.slice(0, 220).trim()}…`
                : analysisPreview}
            </p>
          </div>
        )}

        {medicalImages.length > 0 && (
          <div className="history-attachment-pill">
            <FlaskConical size={14} aria-hidden />
            {medicalImages.length} estudio{medicalImages.length > 1 ? "s" : ""} de laboratorio
            {" "}vinculado{medicalImages.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="history-card-footer history-card-footer-actions">
        {status !== "completed" && onContinue && (
          <Button
            type="button"
            variant="guiaaPrimary"
            size="consult"
            className="history-card-action-btn"
            onClick={() => onContinue(record.id)}
          >
            Continuar consulta
          </Button>
        )}
        <Button
          type="button"
          variant={status === "completed" ? "guiaaPrimary" : "guiaaSoft"}
          size="consult"
          className="history-card-action-btn group gap-2.5"
          onClick={() => onView(record.id)}
        >
          <span>Ver ficha</span>
          <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
        </Button>
        <Button
          type="button"
          variant="guiaaSoft"
          size="consult"
          className="history-card-action-btn gap-2"
          disabled={pdfLoadingId === record.id}
          onClick={() => onDownloadPdf(record.id)}
        >
          <FileDown size={16} aria-hidden />
          <span>{pdfLoadingId === record.id ? "Generando PDF..." : "PDF"}</span>
        </Button>
      </div>
    </article>
  );
}
