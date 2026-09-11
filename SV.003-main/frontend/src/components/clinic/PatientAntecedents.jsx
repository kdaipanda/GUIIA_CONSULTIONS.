import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchPatient } from "../../lib/clinicApi";
import { cleanClinicalDisplayText } from "../../lib/consultationPdf";
import { buildClinicalTimeline, getLabStudyLabel } from "../../lib/clinicalTimeline";
import { formatConsultationDateShort } from "../../lib/consultationDisplay";
import {
  normalizeClinicalChart,
  openProblems,
  latestByDate,
} from "../../lib/clinicalChartSync";
import { Button } from "../ui/button";

export function PatientAntecedents({
  veterinarianId,
  patientId,
  patient: initialPatient,
  onOpenPatientChart,
}) {
  const { t } = useTranslation("clinic");
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!veterinarianId || !patientId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetchPatient(veterinarianId, patientId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [veterinarianId, patientId]);

  const patient = data?.patient || initialPatient;
  const consultations = data?.consultations || [];
  const medicalImages = data?.medical_images || [];
  const recentTimeline = buildClinicalTimeline(consultations, medicalImages).slice(0, 3);
  const chart = normalizeClinicalChart(patient?.clinical_chart);
  const problems = openProblems(chart);
  const lastVaccine = latestByDate(chart.vaccines);

  if (!patientId || !patient) return null;

  const hasContent =
    patient.notes ||
    patient.microchip ||
    recentTimeline.length > 0 ||
    (chart.allergies || []).length > 0 ||
    problems.length > 0 ||
    lastVaccine;

  if (!hasContent && !loading) return null;

  return (
    <div className="patient-antecedents">
      <button
        type="button"
        className="patient-antecedents-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{t("antecedents.title")}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div className="patient-antecedents-body">
          {loading && <p className="clinic-muted">{t("antecedents.loading")}</p>}

          {!loading && (
            <>
              <div className="patient-antecedents-grid">
                {patient.microchip && (
                  <p>
                    <strong>{t("antecedents.microchip")}</strong> {patient.microchip}
                  </p>
                )}
                {patient.birth_date && (
                  <p>
                    <strong>{t("antecedents.birth")}</strong>{" "}
                    {formatConsultationDateShort(patient.birth_date)}
                  </p>
                )}
                {patient.weight_kg != null && (
                  <p>
                    <strong>{t("antecedents.weight")}</strong> {patient.weight_kg} kg
                  </p>
                )}
                {problems.length > 0 && (
                  <p>
                    <strong>{t("antecedents.openProblems")}</strong>{" "}
                    {problems.map((p) => p.title).filter(Boolean).join("; ")}
                  </p>
                )}
                {(chart.allergies || []).length > 0 && (
                  <p>
                    <strong>{t("antecedents.allergies")}</strong>{" "}
                    {chart.allergies.map((a) => a.label).filter(Boolean).join("; ")}
                  </p>
                )}
                {lastVaccine && (
                  <p>
                    <strong>{t("antecedents.lastVaccine")}</strong> {lastVaccine.label}
                    {lastVaccine.date ? ` (${lastVaccine.date})` : ""}
                  </p>
                )}
              </div>

              {patient.notes && (
                <p className="patient-antecedents-notes">
                  <strong>{t("antecedents.notes")}</strong> {patient.notes}
                </p>
              )}

              {recentTimeline.length > 0 && (
                <div className="patient-antecedents-last">
                  <strong>{t("antecedents.recentHistory")}</strong>
                  <ul>
                    {recentTimeline.map((item) => {
                      if (item.kind === "consultation") {
                        const consultation = item.consultation;
                        return (
                          <li key={`consultation-${item.id}`}>
                            {t("antecedents.cdsConsult")} —{" "}
                            {formatConsultationDateShort(consultation.created_at)}
                            {consultation.analysis && (
                              <p className="patient-antecedents-analysis">
                                {(() => {
                                  const preview = cleanClinicalDisplayText(consultation.analysis);
                                  return preview.length > 160
                                    ? `${preview.slice(0, 160).trim()}…`
                                    : preview;
                                })()}
                              </p>
                            )}
                          </li>
                        );
                      }
                      const study = item.study;
                      return (
                        <li key={`lab-${item.id}`}>
                          {getLabStudyLabel(study)} —{" "}
                          {formatConsultationDateShort(study.created_at)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {onOpenPatientChart && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => onOpenPatientChart(patientId)}
                >
                  <FolderOpen size={14} className="mr-1" /> {t("antecedents.openFullChart")}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
