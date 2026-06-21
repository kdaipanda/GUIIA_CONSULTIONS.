import React from "react";
import { FileDown } from "lucide-react";
import { Button } from "../ui/button";
import { cleanClinicalDisplayText } from "../../lib/consultationPdf";
import {
  formatConsultationDateShort,
  formatConsultationFolio,
  getConsultationSpeciesIcon,
  getConsultationSpeciesLabel,
  getConsultationStatusLabel,
} from "../../lib/consultationDisplay";

export function ConsultationDetailPanel({
  consultation,
  pdfLoadingId,
  onBack,
  onDownloadPdf,
  onContinue,
}) {
  const formData = consultation.form_data || {};
  const speciesIcon = getConsultationSpeciesIcon(consultation);
  const statusClass = consultation.status || "draft";
  const ratingValue = consultation.rating || 0;

  return (
    <div className="consultation-detail-page history-detail-guiaa">
      <div className="container">
        <div className="clinical-file-header">
          <div className="clinical-file-top">
            <button type="button" onClick={onBack} className="back-btn-clinical">
              <span>←</span> Volver al historial
            </button>
            <div className="clinical-file-id">{formatConsultationFolio(consultation)}</div>
          </div>

          <div className="clinical-file-main">
            <div className="clinical-file-patient">
              <div className="clinical-file-avatar">{speciesIcon}</div>
              <div className="clinical-file-info">
                <h1>{formData.nombre_mascota || "Mascota"}</h1>
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
                <div className="clinical-rating" aria-label="Calificación">
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
          <div className="clinical-section">
            <div className="clinical-section-header">
              <span className="clinical-section-icon">🩺</span>
              <h2>Datos clínicos</h2>
            </div>
            <div className="clinical-data-grid">
              <div className="clinical-data-card">
                <span className="data-label">Propietario</span>
                <span className="data-value">
                  {formData.nombre_dueño || formData.nombre_dueno || "—"}
                </span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">Sexo</span>
                <span className="data-value">{formData.sexo || "—"}</span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">Estado reproductivo</span>
                <span className="data-value">{formData.estado_reproductivo || "—"}</span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">Condición corporal</span>
                <span className="data-value">{formData.condicion_corporal || "—"}</span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">Vacunas</span>
                <span className="data-value">{formData.vacunas_vigentes || "—"}</span>
              </div>
              <div className="clinical-data-card">
                <span className="data-label">Síntomas</span>
                <span className="data-value">{formData.sintomas || "—"}</span>
              </div>
            </div>
          </div>

          <div className="clinical-section">
            <div className="clinical-section-header">
              <span className="clinical-section-icon">📝</span>
              <h2>Motivo de consulta</h2>
            </div>
            <div className="clinical-text-block">
              {consultation.detalle_paciente || formData.motivo_consulta || "Sin información adicional"}
            </div>
          </div>

          {consultation.analysis && (
            <div className="clinical-section analysis">
              <div className="clinical-section-header">
                <span className="clinical-section-icon">🧠</span>
                <h2>Análisis clínico</h2>
              </div>
              <div className="clinical-analysis-content">
                <pre className="clinical-analysis-text">
                  {cleanClinicalDisplayText(consultation.analysis || "")}
                </pre>
              </div>
            </div>
          )}

          <div className="clinical-actions clinical-actions-bar">
            <Button type="button" variant="guiaaSoft" className="clinical-action-btn" onClick={onBack}>
              Cerrar ficha
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
                {pdfLoadingId === consultation.id ? "Generando PDF..." : "Descargar PDF"}
              </span>
            </Button>
            {consultation.status !== "completed" && onContinue && (
              <Button
                type="button"
                variant="guiaaPrimary"
                className="clinical-action-btn"
                onClick={() => onContinue(consultation.id)}
              >
                Continuar consulta
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
