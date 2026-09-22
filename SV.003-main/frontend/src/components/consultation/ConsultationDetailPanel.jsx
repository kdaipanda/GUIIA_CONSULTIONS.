import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Brain, ClipboardList, FileDown, FlaskConical, Stethoscope } from "lucide-react";
import { Button } from "../ui/button";
import { cleanClinicalDisplayText } from "../../lib/consultationPdf";
import {
  formatConsultationDateShort,
  formatConsultationFolio,
  getConsultationSpeciesIcon,
  getConsultationSpeciesLabel,
  getConsultationStatusLabel,
} from "../../lib/consultationDisplay";
import { getLabStudyLabel } from "../../lib/clinicalTimeline";
import { ConsultationFormDataView } from "../clinical/ConsultationFormDataView";

export function ConsultationDetailPanel({
  consultation,
  pdfLoadingId,
  onBack,
  onDownloadPdf,
  onContinue,
  onOpenPatientChart,
}) {
  const { t } = useTranslation("clinic");
  const formData = consultation.form_data || {};
  const speciesIcon = getConsultationSpeciesIcon(consultation);
  const statusClass = consultation.status || "draft";
  const ratingValue = consultation.rating || 0;
  const linkedStudies = consultation.linked_studies || [];
  const petName =
    formData.nombre_mascota?.trim() ||
    getConsultationSpeciesLabel(consultation) ||
    t("history.detail.petFallback");

  return (
    <div className="consultation-detail-page history-detail-guiaa">
      <div className="container">
        <div className="clinical-file-header">
          <div className="clinical-file-top">
            <button type="button" onClick={onBack} className="back-btn-clinical">
              <ArrowLeft size={16} aria-hidden />
              {t("history.detail.back")}
            </button>
            <div className="clinical-file-id">{formatConsultationFolio(consultation)}</div>
          </div>

          <div className="clinical-file-main">
            <div className="clinical-file-patient">
              <div className="clinical-file-avatar" aria-hidden>
                {speciesIcon}
              </div>
              <div className="clinical-file-info">
                <h1>{petName}</h1>
                <div className="clinical-file-meta">
                  <span className="meta-pill species">
                    {getConsultationSpeciesLabel(consultation)}
                  </span>
                  {formData.raza && <span className="meta-pill breed">{formData.raza}</span>}
                  {formData.edad && <span className="meta-pill age">{formData.edad}</span>}
                  {formData.peso && <span className="meta-pill weight">{formData.peso}</span>}
                </div>
              </div>
            </div>
            <div className="clinical-file-status">
              <span className={`status-pill ${statusClass}`}>
                {getConsultationStatusLabel(statusClass)}
              </span>
              {ratingValue > 0 && (
                <div
                  className="clinical-rating"
                  aria-label={t("history.card.ratingAria", { count: ratingValue })}
                >
                  {Array.from({ length: ratingValue }).map((_, idx) => (
                    <span key={idx} className="paw-static filled">
                      🐾
                    </span>
                  ))}
                </div>
              )}
              <span className="clinical-file-date">
                {formatConsultationDateShort(consultation.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="clinical-file-content">
          {onOpenPatientChart && consultation.patient_id && (
            <div className="clinical-section clinical-section--chart-link">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-11"
                onClick={() => onOpenPatientChart(consultation.patient_id)}
              >
                {t("history.detail.openChart")}
              </Button>
            </div>
          )}

          <div className="clinical-section">
            <ConsultationFormDataView
              category={consultation.category || consultation.especie}
              formData={formData}
              defaultOpen
            />
          </div>

          <div className="clinical-section">
            <div className="clinical-section-header">
              <Stethoscope size={18} className="clinical-section-icon-lucide" aria-hidden />
              <h2>{t("history.detail.clinicalData")}</h2>
            </div>
            <div className="clinical-data-grid">
              <div className="clinical-data-card">
                <span className="data-label">{t("history.detail.owner")}</span>
                <span className="data-value">
                  {formData.nombre_dueño || formData.nombre_dueno || t("common.emDash")}
                </span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">{t("history.detail.sex")}</span>
                <span className="data-value">{formData.sexo || t("common.emDash")}</span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">{t("history.detail.reproductive")}</span>
                <span className="data-value">
                  {formData.estado_reproductivo || t("common.emDash")}
                </span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">{t("history.detail.bodyCondition")}</span>
                <span className="data-value">
                  {formData.condicion_corporal || t("common.emDash")}
                </span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">{t("history.detail.vaccines")}</span>
                <span className="data-value">
                  {formData.vacunas_vigentes || t("common.emDash")}
                </span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">{t("history.detail.symptoms")}</span>
                <span className="data-value">{formData.sintomas || t("common.emDash")}</span>
              </div>
            </div>
          </div>

          <div className="clinical-section">
            <div className="clinical-section-header">
              <ClipboardList size={18} className="clinical-section-icon-lucide" aria-hidden />
              <h2>{t("history.detail.reason")}</h2>
            </div>
            <div className="clinical-text-block">
              {consultation.detalle_paciente ||
                formData.motivo_consulta ||
                t("history.detail.noExtra")}
            </div>
          </div>

          {consultation.analysis && (
            <div className="clinical-section analysis">
              <div className="clinical-section-header">
                <Brain size={18} className="clinical-section-icon-lucide" aria-hidden />
                <h2>{t("history.detail.analysis")}</h2>
              </div>
              <div className="clinical-analysis-content">
                <pre className="clinical-analysis-text">
                  {cleanClinicalDisplayText(consultation.analysis || "")}
                </pre>
              </div>
            </div>
          )}

          {linkedStudies.length > 0 && (
            <div className="clinical-section clinical-section-lab">
              <div className="clinical-section-header">
                <FlaskConical size={18} className="clinical-section-icon-lucide" aria-hidden />
                <h2>{t("history.detail.linkedLab")}</h2>
              </div>
              <ul className="clinical-linked-studies">
                {linkedStudies.map((study) => (
                  <li key={study.id} className="clinical-linked-study">
                    <div className="clinical-linked-study-head">
                      <strong>{getLabStudyLabel(study)}</strong>
                      <span>{formatConsultationDateShort(study.created_at)}</span>
                    </div>
                    {study.analysis && (
                      <pre className="clinical-analysis-text clinical-linked-study-text">
                        {cleanClinicalDisplayText(study.analysis)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="clinical-actions clinical-actions-bar">
            <Button type="button" variant="guiaaSoft" className="clinical-action-btn" onClick={onBack}>
              {t("history.detail.close")}
            </Button>
            <Button
              type="button"
              variant="guiaaSoft"
              className="clinical-action-btn gap-2"
              disabled={pdfLoadingId === consultation.id}
              onClick={() => onDownloadPdf(consultation.id)}
            >
              <FileDown size={16} aria-hidden />
              <span>
                {pdfLoadingId === consultation.id
                  ? t("history.card.pdfGenerating")
                  : t("history.detail.downloadPdf")}
              </span>
            </Button>
            {consultation.status !== "completed" && onContinue && (
              <Button
                type="button"
                variant="guiaaPrimary"
                className="clinical-action-btn"
                onClick={() => onContinue(consultation.id)}
              >
                {t("history.card.continue")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
