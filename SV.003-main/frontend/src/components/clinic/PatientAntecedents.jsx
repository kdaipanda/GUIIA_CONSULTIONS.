import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fetchPatient } from "../../lib/clinicApi";

const IMAGE_TYPE_LABELS = {
  blood_test: "Análisis de sangre",
  urinalysis: "Urianálisis",
  xray: "Radiografía",
  general: "Estudio general",
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

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
  const lastConsultation = consultations[0];

  if (!patientId || !patient) return null;

  const hasContent =
    patient.notes ||
    patient.microchip ||
    lastConsultation ||
    medicalImages.length > 0;

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
                  <p><strong>Nacimiento:</strong> {formatDate(patient.birth_date)}</p>
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

              {lastConsultation && (
                <div className="patient-antecedents-last">
                  <strong>Última consulta ({formatDate(lastConsultation.created_at)})</strong>
                  <p>
                    {lastConsultation.motivo_consulta ||
                      lastConsultation.detalle_paciente ||
                      lastConsultation.form_data?.motivo_consulta ||
                      "Sin motivo registrado"}
                  </p>
                  {lastConsultation.analysis && (
                    <p className="patient-antecedents-analysis">
                      {String(lastConsultation.analysis).slice(0, 220)}
                      {lastConsultation.analysis.length > 220 ? "…" : ""}
                    </p>
                  )}
                </div>
              )}

              {medicalImages.length > 0 && (
                <div className="patient-antecedents-studies">
                  <strong>Estudios recientes ({medicalImages.length})</strong>
                  <ul>
                    {medicalImages.slice(0, 3).map((img) => (
                      <li key={img.id}>
                        {IMAGE_TYPE_LABELS[img.image_type] || img.image_type || "Estudio"} —{" "}
                        {formatDate(img.created_at)}
                      </li>
                    ))}
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
