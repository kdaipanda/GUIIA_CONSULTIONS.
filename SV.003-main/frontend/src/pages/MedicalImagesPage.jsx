import React, { useState, useEffect } from "react";
import { Crown, FlaskConical } from "lucide-react";
import { useVet } from "../context/VetContext";
import { notifyError, notifySuccess } from "../lib/appToast";
import { BACKEND_URL } from "../lib/backendUrl";
import { getAuthHeaders } from "../lib/authHeaders";
import { cleanClinicalDisplayText } from "../lib/consultationPdf";
import { PatientSelector } from "../components/clinic/PatientSelector";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import "./medicalImagesPage.css";

export function MedicalImagesPage({ setView }) {
  const { veterinarian } = useVet();
  const [imageType, setImageType] = useState("blood_test");
  const [patientName, setPatientName] = useState("");
  const [imageClinicalContext, setImageClinicalContext] = useState(null);
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
    if (veterinarian?.membership_type?.toLowerCase() !== "premium") {
      notifyError("Esta función es exclusiva para miembros Premium");
    } else {
      loadHistory();
    }
  }, [veterinarian]);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      const maxSizeLabel = '10MB';
      
      if (file.size > maxSize) {
        notifyError(`El archivo es demasiado grande. Máximo ${maxSizeLabel}.`);
        return;
      }

      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      notifyError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pastedStudyData || !pastedStudyData.trim()) {
      notifyError("Por favor pega los datos del estudio");
      return;
    }

    setLoading(true);
    notifyError("");
    setResult(null);

    try {
      const requestData = {
        veterinarian_id: veterinarian.id,
        image_base64: null,  // Enviar explícitamente como null (campo opcional en backend)
        image_type: imageType,
        patient_name: imageClinicalContext?.patient?.name || patientName || null,
        patient_id: imageClinicalContext?.patientId || null,
        consultation_id: consultationId || null,
        additional_context: additionalContext || null,
        pasted_study_data: pastedStudyData || null,  // Datos de estudio pegados
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
          console.log("Error data recibido:", errorData);
          
          // Extraer el mensaje de error de diferentes formatos posibles
          if (errorData) {
            if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (typeof errorData === 'object') {
              // Intentar diferentes campos comunes para mensajes de error
              errorMessage = errorData.detail || 
                           errorData.message || 
                           errorData.error || 
                           (errorData.error?.message) ||
                           JSON.stringify(errorData);
            }
          }
        } catch (parseError) {
          console.log("Error al parsear respuesta de error:", parseError);
          // Si no se puede parsear como JSON, usar el texto de la respuesta
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            console.log("Error al obtener texto de respuesta:", textError);
            // Si todo falla, usar el mensaje por defecto
          }
        }
        // Asegurar que errorMessage sea siempre un string
        const finalErrorMessage = typeof errorMessage === 'string' 
          ? errorMessage 
          : JSON.stringify(errorMessage);
        throw new Error(finalErrorMessage);
      }

      const data = await response.json();
      console.log("Resultado recibido del backend:", data);
      console.log("Campo 'analysis' presente:", !!data.analysis);
      console.log("Longitud de 'analysis':", data.analysis ? data.analysis.length : 0);
      setResult(data);
      notifySuccess("Interpretación generada correctamente");
      // Recargar historial después de crear un nuevo análisis
      await loadHistory();

      // Clear form
      setPastedStudyData("");
      setPatientName("");
      setImageClinicalContext(null);
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

  if (veterinarian?.membership_type?.toLowerCase() !== "premium") {
    return (
      <div className="medical-images-page medical-images-page-guiaa">
        <div className="container">
          <div className="medical-images-premium-gate">
            <div className="medical-images-premium-icon">
              <Crown size={32} aria-hidden />
            </div>
            <h2>Función Premium</h2>
            <p>
              La interpretación de análisis clínicos (sangre, orina y estudios de laboratorio)
              está incluida en el plan Premium de GUIAA.
            </p>
            <Button type="button" onClick={() => setView("membership")}>
              Ver plan Premium
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <p>Pega resultados de laboratorio para obtener hallazgos y recomendaciones clínicas.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Nueva interpretación" : "Ver historial"}
          </Button>
        </header>

        {!showHistory ? (
          <div className="image-interpretation-layout">
            <div className="image-interpretation-form">
              <form onSubmit={handleSubmit}>
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

              <div className="form-section">
                <h3>Cargar Estudio</h3>
                
                {/* Alerta de ayuda para copiar PDFs */}
                <div style={{
                  marginBottom: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>ℹ️</span>
                      <span>¿Cómo copiar texto de un PDF?</span>
                    </span>
                    <span style={{ fontSize: '18px' }}>{showHelp ? '▼' : '▶'}</span>
                  </button>
                  
                  {showHelp && (
                    <div style={{
                      padding: '16px',
                      borderTop: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'var(--text-primary)'
                    }}>
                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}>
                          Caso 1: PDF normal (no escaneado ni bloqueado)
                        </strong>
                        <div style={{ marginLeft: '12px', marginBottom: '12px' }}>
                          <strong>En un lector como Adobe Acrobat Reader:</strong>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            <li>Abre el PDF.</li>
                            <li>Haz clic con el botón derecho y elige la herramienta de selección (o simplemente intenta arrastrar sobre el texto).</li>
                            <li>Arrastra el cursor sobre el texto que quieras copiar.</li>
                            <li>Clic derecho → Copiar, o usa Ctrl+C y luego Ctrl+V donde lo quieras pegar.</li>
                          </ul>
                        </div>
                        <div style={{ marginLeft: '12px' }}>
                          <strong>En el navegador (Chrome, Edge, etc.):</strong>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            <li>Abre el PDF en una pestaña.</li>
                            <li>Selecciona el texto con el mouse.</li>
                            <li>Ctrl+C y luego Ctrl+V en tu editor (Word, Bloc de notas, etc.).</li>
                          </ul>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}>
                          Caso 2: PDF escaneado (es una imagen)
                        </strong>
                        <div style={{ marginLeft: '12px' }}>
                          <p style={{ marginBottom: '8px' }}>
                            Si al arrastrar el mouse no se selecciona texto, el PDF probablemente es una imagen y necesitas OCR.
                          </p>
                          <strong>Opciones fáciles y gratis:</strong>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            <li>Usar una web de OCR (por ejemplo iLovePDF "OCR PDF", PDF Candy "Extraer texto" o similares). Entra al sitio, sube tu PDF, descarga el TXT/Word resultante y copia el texto.</li>
                            <li>Convertir el PDF a Word/TXT en webs tipo Smallpdf, PDFgear, etc., y luego copiar el texto desde el archivo convertido.</li>
                          </ul>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}>
                          Caso 3: PDF protegido contra copia
                        </strong>
                        <div style={{ marginLeft: '12px' }}>
                          <p style={{ marginBottom: '8px' }}>
                            Si sí se ve el texto pero no te deja copiarlo, está protegido:
                          </p>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            <li>Si conoces la contraseña, ábrelo en Adobe Acrobat y usa la opción de eliminar seguridad para quitar las restricciones, luego copia normalmente.</li>
                            <li>Si no tienes la contraseña, algunas herramientas online ("desbloquear PDF") convierten el archivo a Word o lo dejan sin protección, y de ahí ya puedes copiar, siempre respetando derechos de autor.</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}>
                          Alternativa rápida: abrir en Word o Google Docs
                        </strong>
                        <ul style={{ marginTop: '4px', paddingLeft: '20px', marginLeft: '12px' }}>
                          <li>Abrir PDF en Microsoft Word: Word lo convierte a documento editable y ya puedes copiar el texto.</li>
                          <li>Subir el PDF a Google Drive, clic derecho → "Abrir con" → Documentos de Google, y luego copiar desde ahí.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Área para pegar datos del estudio */}
                <div className="form-group">
                  <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    📋 Copia y pega los datos de tu estudio
                  </label>
                  <Textarea
                    value={pastedStudyData}
                    onChange={(e) => setPastedStudyData(e.target.value)}
                    placeholder={`Pega aquí los resultados del análisis, por ejemplo:

BIOMETRÍA HEMÁTICA
Eritrocitos: 6.5 x10^6/µL (Ref: 5.5-8.5)
Hemoglobina: 14.2 g/dL (Ref: 12-18)
Leucocitos: 12,500/µL (Ref: 6,000-17,000)

QUÍMICA SANGUÍNEA
Glucosa: 95 mg/dL (Ref: 74-143)
BUN: 18 mg/dL (Ref: 7-27)
Creatinina: 1.2 mg/dL (Ref: 0.5-1.8)
...`}
                    rows={6}
                    className="resize-y rounded-lg border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] font-mono text-[13px] leading-relaxed"
                  />
                  <small style={{
                    color: 'var(--text-secondary)', 
                    display: 'block', 
                    marginTop: '8px'
                  }}>
                    💡 Copia los resultados del laboratorio y pégalos aquí para su análisis.
                  </small>
                </div>
              </div>

              <PatientSelector
                value={imageClinicalContext?.patientId}
                onChange={(ctx) => {
                  setImageClinicalContext(ctx);
                  if (ctx?.patient?.name) {
                    setPatientName(ctx.patient.name);
                  }
                }}
              />

              <div className="form-row">
                {!imageClinicalContext?.patientId && (
                  <div className="form-group">
                    <label>Nombre de la mascota (Opcional)</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Ej: Max, Luna, Rocky"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>ID de Consulta Previa (Opcional)</label>
                  <input
                    type="text"
                    value={consultationId}
                    onChange={(e) => setConsultationId(e.target.value)}
                    placeholder="Para incluir historial de la mascota"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contexto Adicional (Opcional)</label>
                <Textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Información adicional relevante para la interpretación..."
                  rows={4}
                  className="min-h-[100px] resize-y"
                />
              </div>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setView("dashboard")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !pastedStudyData || !pastedStudyData.trim()}
                >
                  {loading ? "Analizando..." : "Interpretar Estudio"}
                </Button>
              </div>
            </form>

            {result && (
              <div className="interpretation-result">
                <h2>Resultado de la Interpretación</h2>

                <div className="result-section">
                  <h3>🔍 Hallazgos Principales</h3>
                  <div className="result-content">
                    {result.findings && Array.isArray(result.findings) && result.findings.length > 0
                      ? result.findings.map((finding, idx) => <div key={idx}>• {finding}</div>)
                      : result.findings && !Array.isArray(result.findings)
                        ? result.findings
                        : result.analysis
                          ? <div style={{color: '#64748b', fontStyle: 'italic'}}>Ver análisis detallado abajo para hallazgos completos</div>
                          : <div style={{color: '#64748b', fontStyle: 'italic'}}>No hay hallazgos disponibles</div>}
                  </div>
                </div>

                <div className="result-section">
                  <h3>💊 Recomendaciones</h3>
                  <div className="result-content">
                    {result.recommendations && Array.isArray(result.recommendations) && result.recommendations.length > 0
                      ? result.recommendations.map((rec, idx) => <div key={idx}>• {rec}</div>)
                      : result.recommendations && !Array.isArray(result.recommendations)
                        ? result.recommendations
                        : result.analysis
                          ? <div style={{color: '#64748b', fontStyle: 'italic'}}>Ver análisis detallado abajo para recomendaciones completas</div>
                          : <div style={{color: '#64748b', fontStyle: 'italic'}}>No hay recomendaciones disponibles</div>}
                  </div>
                </div>

                <div className="result-section detailed">
                  <h3>📊 Análisis Detallado</h3>
                  <div className="result-content detailed-analysis" style={{whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "600px", overflowY: "auto", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0"}}>
                    {result.analysis ? (
                      <pre style={{margin: 0, fontFamily: "inherit", fontSize: "14px", lineHeight: "1.6", color: "#1e293b"}}>{cleanClinicalDisplayText(result.analysis)}</pre>
                    ) : result.detailed_analysis ? (
                      <pre style={{margin: 0, fontFamily: "inherit", fontSize: "14px", lineHeight: "1.6", color: "#1e293b"}}>{cleanClinicalDisplayText(result.detailed_analysis)}</pre>
                    ) : (
                      <div style={{color: "#64748b", fontStyle: "italic"}}>No hay análisis disponible</div>
                    )}
                  </div>
                </div>

                <div className="result-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setResult(null)}
                  >
                    Nueva Interpretación
                  </Button>
                  <Button type="button" onClick={() => setShowHistory(true)}>
                    Ver Historial
                  </Button>
                </div>
              </div>
            )}
          </div>

          <aside className="image-side-panel">
            <div className="side-panel-header">
              <span className="side-panel-pill">Panel clínico</span>
              <h3>Resumen del estudio</h3>
              <p>
                Verifica que la información clave del caso esté completa antes de
                enviar el estudio a interpretación.
              </p>
            </div>

            <div className="side-panel-section">
              <div className="side-panel-label">Tipo de estudio</div>
              <div className="side-panel-main">
                <span className="side-panel-icon">{imageMeta.icon}</span>
                <span className="side-panel-text">{imageMeta.label}</span>
              </div>
              <p className="side-panel-hint">{imageMeta.hint}</p>
            </div>

            <div className="side-panel-section">
              <div className="side-panel-label">Mascota</div>
              <div className="side-panel-chip">
                {patientName || "Sin nombre asignado"}
              </div>
              {consultationId && (
                <div className="side-panel-sub">
                  Consulta asociada: <span>#{consultationId}</span>
                </div>
              )}
            </div>

            <div className="side-panel-section">
              <div className="side-panel-label">Estado</div>
              <div
                className={`side-panel-status ${loading ? "loading" : result ? "done" : "idle"}`}
              >
                {loading
                  ? "Analizando imagen..."
                  : result
                    ? "Resultado disponible"
                    : "Listo para enviar"}
              </div>
            </div>
          </aside>
        </div>
        ) : (
          <div className="interpretation-history">
            <h2>Historial de Interpretaciones</h2>
            {history.length > 0 ? (
              <div className="history-grid">
                {history.map((item) => (
                  <div key={item.id} className="history-card">
                    <div className="history-header">
                      <div className="history-type">
                        {item.image_type === "blood_test" &&
                          "🩸 Análisis de Sangre"}
                        {item.image_type === "urinalysis" && "🧪 Urianálisis"}
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
                        const preview = item.analysis
                          ? cleanClinicalDisplayText(item.analysis)
                          : item.findings && Array.isArray(item.findings)
                            ? item.findings.join(", ")
                            : item.findings
                              ? String(item.findings)
                              : item.detailed_analysis
                                ? cleanClinicalDisplayText(item.detailed_analysis)
                                : "Sin análisis disponible";
                        return preview.length > 150 ? `${preview.substring(0, 150)}...` : preview;
                      })()}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
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
