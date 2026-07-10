import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fetchPatient } from "../../lib/clinicApi";
import { cleanClinicalDisplayText } from "../../lib/consultationPdf";
import { buildClinicalTimeline, getLabStudyLabel } from "../../lib/clinicalTimeline";
import { formatConsultationDateShort } from "../../lib/consultationDisplay";

export function PatientAntecedents({ veterinarianId, patientId, patient: initialPatient }) {
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

  if (!patientId || !patient) return null;

  const hasContent =
    patient.notes ||
    patient.microchip ||
    recentTimeline.length > 0;

  if (!hasContent && !loading) return null;

  return (
    <div className="patient-antecedents">
      <button
        type="button"
        className="patient-antecedents-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>Antecedentes de la mascota</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div className="patient-antecedents-body">
          {loading && <p className="clinic-muted">Cargando antecedentes...</p>}

          {!loading && (
            <>
              <div className="patient-antecedents-grid">
                {patient.microchip && (
                  <p><strong>Microchip:</strong> {patient.microchip}</p>
                )}
                {patient.birth_date && (
                  <p><strong>Nacimiento:</strong> {formatConsultationDateShort(patient.birth_date)}</p>
                )}
                {patient.weight_kg != null && (
                  <p><strong>Peso registrado:</strong> {patient.weight_kg} kg</p>
                )}
              </div>

              {patient.notes && (
                <p className="patient-antecedents-notes">
                  <strong>Notas:</strong> {patient.notes}
                </p>
              )}

              {recentTimeline.length > 0 && (
                <div className="patient-antecedents-last">
                  <strong>Historial reciente</strong>
                  <ul>
                    {recentTimeline.map((item) => {
                      if (item.kind === "consultation") {
                        const consultation = item.consultation;
                        return (
                          <li key={`consultation-${item.id}`}>
                            Consulta CDS — {formatConsultationDateShort(consultation.created_at)}
                            {consultation.analysis && (
                              <p className="patient-antecedents-analysis">
                                {(() => {
                                  const preview = cleanClinicalDisplayText(consultation.analysis);
                                  return preview.length > 160 ? `${preview.slice(0, 160).trim()}…` : preview;
                                })()}
                              </p>
                            )}
                          </li>
                        );
                      }
                      const study = item.study;
                      return (
                        <li key={`lab-${item.id}`}>
                          {getLabStudyLabel(study)} — {formatConsultationDateShort(study.created_at)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
