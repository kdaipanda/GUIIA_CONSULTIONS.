import React from "react";
import { FileDown, ExternalLink, FlaskConical, Stethoscope } from "lucide-react";
import { Button } from "../ui/button";
import { cleanClinicalDisplayText } from "../../lib/consultationPdf";
import {
  formatConsultationDateShort,
  formatConsultationFolio,
  getConsultationStatusLabel,
} from "../../lib/consultationDisplay";
import { buildClinicalTimeline, getLabStudyLabel } from "../../lib/clinicalTimeline";

function truncateText(text, max = 180) {
  if (!text) return "";
  const cleaned = cleanClinicalDisplayText(text);
  return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
}

function consultationMotivo(consultation) {
  return (
    consultation?.detalle_paciente ||
    consultation?.motivo_consulta ||
    consultation?.form_data?.motivo_consulta ||
    "Sin motivo registrado"
  );
}

export function ClinicalTimelineList({
  consultations = [],
  medicalImages = [],
  emptyMessage = "Aún no hay registros clínicos para esta mascota.",
  onViewConsultation,
  onDownloadConsultationPdf,
  pdfLoadingId,
  onCloseBeforeNavigate,
}) {
  const timeline = buildClinicalTimeline(consultations, medicalImages);

  if (!timeline.length) {
    return <p className="clinic-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="clinic-timeline-list clinic-timeline-list-unified">
      {timeline.map((item) => {
        if (item.kind === "consultation") {
          const consultation = item.consultation;
          return (
            <li key={`consultation-${item.id}`} className="clinic-timeline-item">
              <div className="clinic-timeline-head">
                <span className="clinic-timeline-type">
                  <Stethoscope size={14} aria-hidden />
                  Consulta CDS
                </span>
                <span className="clinic-timeline-folio">{formatConsultationFolio(consultation)}</span>
                <span className={`clinic-timeline-status status-${consultation.status || "draft"}`}>
                  {getConsultationStatusLabel(consultation.status)}
                </span>
              </div>
              <p className="clinic-timeline-date">{formatConsultationDateShort(consultation.created_at)}</p>
              <p className="clinic-timeline-motivo">{consultationMotivo(consultation)}</p>
              {consultation.analysis && (
                <p className="clinic-timeline-analysis">{truncateText(consultation.analysis, 180)}</p>
              )}
              {item.linkedStudies.length > 0 && (
                <ul className="clinic-timeline-linked-studies">
                  {item.linkedStudies.map((study) => (
                    <li key={study.id} className="clinic-timeline-linked-study">
                      <span className="clinic-timeline-linked-label">
                        <FlaskConical size={12} aria-hidden />
                        {getLabStudyLabel(study)}
                      </span>
                      <span className="clinic-timeline-linked-date">
                        {formatConsultationDateShort(study.created_at)}
                      </span>
                      {study.analysis && (
                        <p className="clinic-timeline-linked-analysis">
                          {truncateText(study.analysis, 160)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="clinic-timeline-actions">
                {onViewConsultation && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onCloseBeforeNavigate?.();
                      onViewConsultation(consultation.id);
                    }}
                  >
                    <ExternalLink size={14} className="mr-1" /> Ver consulta
                  </Button>
                )}
                {onDownloadConsultationPdf && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pdfLoadingId === consultation.id}
                    onClick={() => onDownloadConsultationPdf(consultation)}
                  >
                    <FileDown size={14} className="mr-1" />
                    {pdfLoadingId === consultation.id ? "Generando..." : "PDF"}
                  </Button>
                )}
              </div>
            </li>
          );
        }

        const study = item.study;
        return (
          <li key={`lab-${item.id}`} className="clinic-timeline-item clinic-timeline-item-study">
            <div className="clinic-timeline-head">
              <span className="clinic-timeline-type">
                <FlaskConical size={14} aria-hidden />
                Interpretación de laboratorio
              </span>
              <span className="clinic-timeline-folio">{getLabStudyLabel(study)}</span>
            </div>
            <p className="clinic-timeline-date">{formatConsultationDateShort(study.created_at)}</p>
            {study.analysis && (
              <p className="clinic-timeline-analysis">{truncateText(study.analysis, 200)}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
