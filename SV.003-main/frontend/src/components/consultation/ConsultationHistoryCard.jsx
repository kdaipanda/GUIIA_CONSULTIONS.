import React from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, FileDown, FlaskConical, PawPrint, User } from "lucide-react";
import { Button } from "../ui/button";
import { cleanClinicalDisplayText } from "../../lib/consultationPdf";
import {
  formatConsultationDateShort,
  formatConsultationFolio,
  getConsultationReasonPreview,
  getConsultationSpeciesLabel,
  getConsultationStatusLabel,
  normalizeConsultationRecord,
} from "../../lib/consultationDisplay";
import { ConsultationSpeciesIcon } from "./ConsultationSpeciesIcon";

export function ConsultationHistoryCard({
  consultation,
  pdfLoadingId,
  onView,
  onDownloadPdf,
  onContinue,
  onOpenPatientChart,
}) {
  const { t } = useTranslation("clinic");
  const record = normalizeConsultationRecord(consultation);
  const status = record.status || "completed";
  const ratingValue = record.rating || 0;
  const ownerName = record.nombre_dueno || t("history.card.ownerUnspecified");
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
            {getConsultationStatusLabel(status)}
          </span>
        </div>

        <div className="history-card-patient">
          <div className="history-avatar" aria-hidden>
            <ConsultationSpeciesIcon consultation={record} size={22} />
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
              <div
                className="history-rating"
                aria-label={t("history.card.ratingAria", { count: ratingValue })}
              >
                {Array.from({ length: ratingValue }).map((_, idx) => (
                  <PawPrint key={idx} size={14} className="paw-static filled" aria-hidden />
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
              <span className="history-info-label">{t("history.card.owner")}</span>
              <span className="history-info-value">{ownerName}</span>
            </div>
          </div>
          <div className="history-info-item">
            <span className="history-info-icon history-info-icon--lucide">
              <CalendarDays size={16} aria-hidden />
            </span>
            <div className="history-info-content">
              <span className="history-info-label">{t("history.card.date")}</span>
              <span className="history-info-value">
                {formatConsultationDateShort(record.created_at || record.fecha)}
              </span>
            </div>
          </div>
        </div>

        {(record.detalle_paciente || record.motivo_consulta || record.sintomas) && (
          <div className="history-motivo">
            <span className="history-motivo-label">{t("history.card.reason")}</span>
            <p className="history-motivo-text">
              {getConsultationReasonPreview(record, 280)}
            </p>
          </div>
        )}

        {analysisPreview && (
          <div className="history-extra-card highlight">
            <span className="history-extra-label">{t("history.card.analysis")}</span>
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
            {t("history.card.labStudies", { count: medicalImages.length })}
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
            {t("history.card.continue")}
          </Button>
        )}
        <Button
          type="button"
          variant={status === "completed" ? "guiaaPrimary" : "guiaaSoft"}
          size="consult"
          className="history-card-action-btn gap-2"
          onClick={() => onView(record.id)}
        >
          {t("history.card.viewRecord")}
        </Button>
        {onOpenPatientChart && record.patient_id && (
          <Button
            type="button"
            variant="guiaaSoft"
            size="consult"
            className="history-card-action-btn"
            onClick={() => onOpenPatientChart(record.patient_id)}
          >
            {t("history.card.chart")}
          </Button>
        )}
        <Button
          type="button"
          variant="guiaaSoft"
          size="consult"
          className="history-card-action-btn gap-2"
          disabled={pdfLoadingId === record.id}
          onClick={() => onDownloadPdf(record.id)}
        >
          <FileDown size={16} aria-hidden />
          <span>
            {pdfLoadingId === record.id
              ? t("history.card.pdfGenerating")
              : t("history.card.pdf")}
          </span>
        </Button>
      </div>
    </article>
  );
}
