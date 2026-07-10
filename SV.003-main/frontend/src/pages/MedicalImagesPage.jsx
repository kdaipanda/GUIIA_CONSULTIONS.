import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, FileUp, FlaskConical, ImageIcon, Link2 } from "lucide-react";
import { useVet } from "../context/VetContext";
import { notifyError, notifySuccess } from "../lib/appToast";
import { BACKEND_URL } from "../lib/backendUrl";
import { getAuthHeaders } from "../lib/authHeaders";
import { cleanClinicalDisplayText, clinicalTextPreview } from "../lib/consultationPdf";
import {
  fileToBase64Payload,
  labFileLabel,
  validateLabUploadFile,
} from "../lib/labFileUtils";
import { PatientSelector } from "../components/clinic/PatientSelector";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import "./clinic/clinicPageShared.css";
import "./medicalImagesPage.css";

const EXTRACTION_LABELS = {
  markitdown: "Texto extraído del PDF con MarkItDown",
  vision: "PDF escaneado — análisis visual de páginas",
  image: "Imagen del estudio analizada",
  text: "Resultados pegados como texto",
};

export function MedicalImagesPage({
  setView,
  clinicalContext = null,
  onClinicalContextChange,
}) {
  const { veterinarian } = useVet();
  const [imageType, setImageType] = useState("blood_test");
  const [inputMode, setInputMode] = useState("pdf");
  const [patientName, setPatientName] = useState("");
  const [imageClinicalContext, setImageClinicalContext] = useState(clinicalContext);
  const [additionalContext, setAdditionalContext] = useState("");
  const [consultationId, setConsultationId] = useState("");
  const [pastedStudyData, setPastedStudyData] = useState("");  // Datos de estudio pegados
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  const typeMeta = {
    blood_test: {
      label: "Análisis de Sangre",
      icon: "🩸",
      hint: "Especifica tipo de estudio (hemograma, bioquímica, etc.) y valores relevantes.",
    },
    urinalysis: {
      label: "Urianálisis",
      icon: "🧪",
      hint: "Indica método de recolección y hallazgos previos en tira reactiva o sedimento.",
    },
  };

  const imageMeta = typeMeta[imageType] || typeMeta.blood_test;

  useEffect(() => {
    loadHistory();
  }, [veterinarian?.id]);

  useEffect(() => {
    if (!clinicalContext?.patientId) return;
    setImageClinicalContext(clinicalContext);
    if (clinicalContext.patient?.name) {
      setPatientName(clinicalContext.patient.name);
    }
  }, [clinicalContext?.patientId, clinicalContext?.patient?.name]);

  const handlePatientContextChange = (ctx) => {
    setImageClinicalContext(ctx);
    if (ctx?.patient?.name) {
      setPatientName(ctx.patient.name);
    } else if (!ctx) {
      setPatientName("");
    }
    onClinicalContextChange?.(ctx);
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/medical-images/history?limit=50`,
        { headers: getAuthHeaders(veterinarian.id) },
      );
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          errText ? errText.slice(0, 200) : `Error del servidor: ${response.status}`,
        );
      }
      const json = await response.json();
      const rows = Array.isArray(json.images) ? json.images : [];
      setHistory(rows || []);
    } catch (error) {
      console.error("Error loading history:", error);
      setHistory([]); // Asegurar que history sea un array vacío en caso de error
    }
  };

  const handleLabFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateLabUploadFile(file);
    if (validationError) {
      notifyError(validationError);
      return;
    }
    const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");
    setInputMode(isPdf ? "pdf" : "image");
    setImageFile(file);
    setPastedStudyData("");

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const canSubmit =
    (inputMode === "text" && pastedStudyData.trim()) ||
    ((inputMode === "pdf" || inputMode === "image") && imageFile);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      notifyError(
        inputMode === "text"
          ? "Pega los resultados del estudio"
          : "Sube un PDF o imagen del laboratorio",
      );
      return;
    }

    setLoading(true);
    notifyError("");
    setResult(null);

    try {
      let imageBase64 = null;
      let requestImageType = imageType;

      if (imageFile && inputMode !== "text") {
        imageBase64 = await fileToBase64Payload(imageFile);
        const isPdf =
          imageFile.type === "application/pdf" ||
          imageFile.name?.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          requestImageType = "pdf_report";
        }
      }

      const requestData = {
        veterinarian_id: veterinarian.id,
        image_base64: imageBase64,
        image_type: requestImageType,
        patient_name: imageClinicalContext?.patient?.name || patientName || null,
        patient_id: imageClinicalContext?.patientId || null,
        consultation_id: consultationId || null,
        additional_context: additionalContext || null,
        pasted_study_data:
          inputMode === "text" && pastedStudyData.trim() ? pastedStudyData : null,
      };

      const response = await fetch(
        `${BACKEND_URL}/api/medical-images/interpret`,
        {
          method: "POST",
          headers: getAuthHeaders(veterinarian.id, {
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        let errorMessage = `Error del servidor: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData) {
            if (typeof errorData === "string") {
              errorMessage = errorData;
            } else if (typeof errorData === "object") {
              errorMessage =
                errorData.detail ||
                errorData.message ||
                errorData.error ||
                errorData.error?.message ||
                JSON.stringify(errorData);
            }
          }
        } catch {
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch {
            /* mensaje por defecto */
          }
        }
        // Asegurar que errorMessage sea siempre un string
        const finalErrorMessage = typeof errorMessage === 'string' 
          ? errorMessage 
          : JSON.stringify(errorMessage);
        throw new Error(finalErrorMessage);
      }

      const data = await response.json();
      setResult(data);
      notifySuccess("Interpretación generada correctamente");
      // Recargar historial después de crear un nuevo análisis
      await loadHistory();

      // Clear form
      setPastedStudyData("");
      setImageFile(null);
      setImagePreview(null);
      if (!imageClinicalContext?.patientId) {
        setPatientName("");
      }
      setAdditionalContext("");
      setConsultationId("");
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      // Asegurar que el error siempre sea un string
      let errorMessage = "Error al procesar el estudio";
      
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        // Si es un objeto, intentar extraer el mensaje
        errorMessage = err.message || err.detail || err.error || JSON.stringify(err);
      }
      
      // Asegurar que sea string y no esté vacío
      errorMessage = String(errorMessage || "Error desconocido");
      notifyError(errorMessage);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-images-page medical-images-page-guiaa">
      <div className="container">
        <header className="medical-images-header">
          <div>
            <p className="medical-images-eyebrow">Premium · CDS</p>
            <h1>
              <FlaskConical size={28} aria-hidden />
              Interpretación de análisis
            </h1>
            <p>Sube el PDF del laboratorio o pega resultados para obtener el análisis clínico detallado.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="medical-lab-header-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Nueva interpretación" : "Ver historial"}
          </Button>
        </header>

        {!showHistory ? (
          <div className="image-interpretation-layout medical-lab-layout">
            <aside className="image-side-panel medical-lab-summary" aria-label="Resumen del estudio">
              <div className="side-panel-header">
                <span className="side-panel-pill">Panel clínico</span>
                <h3>Resumen del estudio</h3>
                <p className="medical-lab-summary-lead">
                  Verifica que la información clave del caso esté completa antes de enviar.
                </p>
              </div>

              <div className="medical-lab-summary-grid">
                <div className="side-panel-section medical-lab-summary-item">
                  <div className="side-panel-label">Tipo</div>
                  <div className="side-panel-main">
                    <span className="side-panel-icon">{imageMeta.icon}</span>
                    <span className="side-panel-text">{imageMeta.label}</span>
                  </div>
                </div>

                <div className="side-panel-section medical-lab-summary-item">
                  <div className="side-panel-label">Mascota</div>
                  <div className="side-panel-chip">
                    {imageClinicalContext?.patient?.name || patientName || "Sin asignar"}
                  </div>
                </div>

                <div className="side-panel-section medical-lab-summary-item">
                  <div className="side-panel-label">Estado</div>
                  <div
                    className={`side-panel-status ${loading ? "loading" : result ? "done" : "idle"}`}
                  >
                    {loading
                      ? "Analizando..."
                      : result
                        ? "Listo"
                        : canSubmit
                          ? "Listo para enviar"
                          : "Falta estudio"}
                  </div>
                </div>
              </div>

              <p className="side-panel-hint medical-lab-summary-hint">{imageMeta.hint}</p>
              {consultationId && (
                <div className="side-panel-sub medical-lab-summary-consult">
                  Consulta: <span>#{consultationId}</span>
                </div>
              )}
            </aside>

            <div className="image-interpretation-form medical-lab-form">
              <form onSubmit={handleSubmit} className="medical-lab-form-inner">
              <div className="form-section">
                <h3>Tipo de Estudio</h3>
                <div className="image-type-selector">
                  <label
                    className={`type-option ${imageType === "blood_test" ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      value="blood_test"
                      checked={imageType === "blood_test"}
                      onChange={(e) => setImageType(e.target.value)}
                    />
                    <div className="type-content">
                      <div className="type-icon">🩸</div>
                      <span>Análisis de Sangre</span>
                    </div>
                  </label>
                  <label
                    className={`type-option ${imageType === "urinalysis" ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      value="urinalysis"
                      checked={imageType === "urinalysis"}
                      onChange={(e) => setImageType(e.target.value)}
                    />
                    <div className="type-content">
                      <div className="type-icon">🧪</div>
                      <span>Urianálisis</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-section medical-lab-patient-section">
                <h3>Mascota del estudio</h3>
                <p className="medical-lab-patient-hint">
                  Vincula el análisis al paciente registrado para que aparezca en su historial clínico.
                </p>
                <PatientSelector
                  value={imageClinicalContext?.patientId}
                  onChange={handlePatientContextChange}
                />
                {imageClinicalContext?.patientId ? (
                  <p className="medical-lab-patient-linked">
                    <Link2 size={14} aria-hidden />
                    Vinculado a {imageClinicalContext.patient?.name || "paciente registrado"}
                  </p>
                ) : (
                  <p className="medical-lab-patient-unlinked">
                    Sin vincular — el estudio no aparecerá en la ficha del paciente.
                  </p>
                )}
              </div>

              <div className="form-section">
                <h3>Cargar estudio</h3>

                <div className="clinic-sale-mode-toggle medical-lab-input-tabs">
                  <button
                    type="button"
                    className={`clinic-quick-chip${inputMode === "pdf" ? " is-active" : ""}`}
                    onClick={() => setInputMode("pdf")}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    className={`clinic-quick-chip${inputMode === "image" ? " is-active" : ""}`}
                    onClick={() => setInputMode("image")}
                  >
                    Imagen
                  </button>
                  <button
                    type="button"
                    className={`clinic-quick-chip${inputMode === "text" ? " is-active" : ""}`}
                    onClick={() => setInputMode("text")}
                  >
                    Pegar texto
                  </button>
                </div>

                {(inputMode === "pdf" || inputMode === "image") && (
                  <div className="form-group">
                    <label htmlFor="lab-file-upload">
                      {inputMode === "pdf" ? "Archivo PDF del laboratorio" : "Foto o captura del estudio"}
                    </label>
                    <input
                      ref={fileInputRef}
                      id="lab-file-upload"
                      type="file"
                      accept={inputMode === "pdf" ? "application/pdf,.pdf" : "image/*"}
                      capture={inputMode === "image" ? "environment" : undefined}
                      onChange={handleLabFileChange}
                      className="medical-lab-file-input-hidden"
                    />
                    <button
                      type="button"
                      className="medical-lab-upload-zone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="medical-lab-upload-icon" aria-hidden>
                        {inputMode === "pdf" ? <FileUp size={22} /> : <ImageIcon size={22} />}
                      </span>
                      <span className="medical-lab-upload-text">
                        {imageFile
                          ? labFileLabel(imageFile)
                          : inputMode === "pdf"
                            ? "Toca para seleccionar PDF"
                            : "Toca para tomar o elegir imagen"}
                      </span>
                      <span className="medical-lab-upload-hint">
                        {inputMode === "pdf"
                          ? "Se convierte a Markdown con MarkItDown y luego se interpreta"
                          : "JPG o PNG del reporte"}
                      </span>
                    </button>
                    {imagePreview && inputMode === "image" && (
                      <img
                        src={imagePreview}
                        alt="Vista previa del estudio"
                        className="medical-lab-preview"
                      />
                    )}
                  </div>
                )}

                {inputMode === "text" && (
                <>
                <div className="medical-lab-help">
                  <button
                    type="button"
                    className="medical-lab-help-toggle"
                    onClick={() => setShowHelp(!showHelp)}
                    aria-expanded={showHelp}
                  >
                    <span className="medical-lab-help-toggle-label">
                      <span aria-hidden>ℹ️</span>
                      ¿Cómo copiar texto de un PDF?
                    </span>
                    <ChevronDown
                      size={18}
                      className={`medical-lab-help-chevron${showHelp ? " is-open" : ""}`}
                      aria-hidden
                    />
                  </button>

                  {showHelp && (
                    <div className="medical-lab-help-body">
                      <div className="medical-lab-help-block">
                        <strong>Caso 1: PDF normal (no escaneado ni bloqueado)</strong>
                        <p><strong>Adobe Acrobat Reader:</strong> selecciona el texto y usa Copiar o Ctrl+C.</p>
                        <p><strong>Navegador:</strong> abre el PDF, selecciona texto y pégalo aquí.</p>
                      </div>
                      <div className="medical-lab-help-block">
                        <strong>Caso 2: PDF escaneado (imagen)</strong>
                        <p>Usa OCR en iLovePDF, PDF Candy o convierte a Word/Docs y copia el texto.</p>
                      </div>
                      <div className="medical-lab-help-block">
                        <strong>Caso 3: PDF protegido</strong>
                        <p>Quita la protección con la contraseña o convierte el archivo a un formato editable.</p>
                      </div>
                      <div className="medical-lab-help-block">
                        <strong>Alternativa rápida</strong>
                        <p>Abre el PDF en Word o en Google Docs y copia desde ahí.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lab-paste-data">Copia y pega los datos del estudio</label>
                  <Textarea
                    id="lab-paste-data"
                    value={pastedStudyData}
                    onChange={(e) => setPastedStudyData(e.target.value)}
                    placeholder={`Pega aquí los resultados del análisis, por ejemplo:

BIOMETRÍA HEMÁTICA
Eritrocitos: 6.5 x10^6/µL (Ref: 5.5-8.5)
Hemoglobina: 14.2 g/dL (Ref: 12-18)
...
`}
                    rows={6}
                    className="medical-lab-paste-area"
                  />
                  <small className="medical-lab-paste-hint">
                    Copia los resultados del laboratorio y pégalos aquí para su análisis.
                  </small>
                </div>
                </>
                )}
              </div>

              <div className={`medical-lab-optional${showAdvanced ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="medical-lab-optional-toggle"
                  onClick={() => setShowAdvanced((open) => !open)}
                  aria-expanded={showAdvanced}
                >
                  {showAdvanced ? "Ocultar opciones" : "Más opciones (consulta, contexto)"}
                  <ChevronDown
                    size={16}
                    className={`medical-lab-help-chevron${showAdvanced ? " is-open" : ""}`}
                    aria-hidden
                  />
                </button>

                <div className="medical-lab-optional-body">
                  {!imageClinicalContext?.patientId && (
                    <div className="form-group">
                      <label htmlFor="lab-patient-name">Nombre de la mascota (solo texto libre)</label>
                      <input
                        id="lab-patient-name"
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Ej: Max, Luna, Rocky"
                      />
                      <small className="medical-lab-paste-hint">
                        Si no eliges una mascota registrada arriba, el sistema intentará vincular por nombre exacto.
                      </small>
                    </div>
                  )}

                  <div className="form-row medical-lab-form-row">
                    <div className="form-group medical-lab-consultation-field">
                      <label htmlFor="lab-consultation-id">ID de consulta previa (opcional)</label>
                      <input
                        id="lab-consultation-id"
                        type="text"
                        value={consultationId}
                        onChange={(e) => setConsultationId(e.target.value)}
                        placeholder="Para incluir historial"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="lab-additional-context">Contexto adicional (opcional)</label>
                    <Textarea
                      id="lab-additional-context"
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="Información relevante para la interpretación..."
                      rows={3}
                      className="medical-lab-context-area"
                    />
                  </div>
                </div>
              </div>

              {!result && (
              <div className="form-actions medical-lab-form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setView("dashboard")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="medical-lab-submit-btn"
                >
                  {loading
                    ? inputMode === "pdf"
                      ? "Extrayendo y analizando PDF..."
                      : "Analizando..."
                    : "Interpretar estudio"}
                </Button>
              </div>
              )}
            </form>

            {result && (
              <div className="interpretation-result medical-lab-result">
                <h2>Análisis detallado</h2>
                {result.extraction_method && EXTRACTION_LABELS[result.extraction_method] && (
                  <p className="medical-lab-extract-badge">
                    {EXTRACTION_LABELS[result.extraction_method]}
                  </p>
                )}
                {result.prompt_source && (
                  <p className="medical-lab-prompt-badge">
                    Motor CDS: {result.prompt_source}
                    {result.instructions_chars
                      ? ` (${Math.round(result.instructions_chars / 1000)}k instrucciones)`
                      : ""}
                  </p>
                )}

                <div className="result-section detailed medical-lab-result-only">
                  <div className="result-content detailed-analysis medical-lab-detailed-analysis">
                    {result.analysis ? (
                      <pre>{cleanClinicalDisplayText(result.analysis)}</pre>
                    ) : result.detailed_analysis ? (
                      <pre>{cleanClinicalDisplayText(result.detailed_analysis)}</pre>
                    ) : (
                      <div className="medical-lab-result-fallback">No hay análisis disponible</div>
                    )}
                  </div>
                </div>

                <div className="result-actions medical-lab-result-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setResult(null)}
                  >
                    Nueva interpretación
                  </Button>
                  <Button type="button" onClick={() => setShowHistory(true)}>
                    Ver historial
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        ) : (
          <div className="interpretation-history medical-lab-history">
            <h2>Historial de interpretaciones</h2>
            {history.length > 0 ? (
              <div className="history-grid">
                {history.map((item) => (
                  <div key={item.id} className="history-card">
                    <div className="history-header">
                      <div className="history-type">
                        {item.image_type === "blood_test" &&
                          "🩸 Análisis de Sangre"}
                        {item.image_type === "urinalysis" && "🧪 Urianálisis"}
                        {item.image_type === "pdf_report" && "📄 PDF laboratorio"}
                        {item.image_type === "xray" && "📷 Imagen médica"}
                      </div>
                      <div className="history-date">
                        {new Date(item.created_at).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    {item.patient_name && (
                      <div className="history-patient">
                        <strong>Mascota:</strong> {item.patient_name}
                      </div>
                    )}
                    <div className="history-preview">
                      {(() => {
                        const raw = item.analysis
                          ? item.analysis
                          : item.detailed_analysis
                            ? item.detailed_analysis
                            : "";
                        return raw
                          ? clinicalTextPreview(raw, 150)
                          : "Sin análisis disponible";
                      })()}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="history-card-action"
                      onClick={() => {
                        setResult(item);
                        setShowHistory(false);
                      }}
                    >
                      Ver Completo
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔬</div>
                <h3>No hay interpretaciones aún</h3>
                <p>Comienza pegando los datos de tu primer estudio</p>
                <Button type="button" onClick={() => setShowHistory(false)}>
                  Nueva Interpretación
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
