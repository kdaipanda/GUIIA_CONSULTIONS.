import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, FlaskConical, Plus, Search, Stethoscope, X } from "lucide-react";
import { useVet } from "../context/VetContext";
import { BACKEND_URL } from "../lib/backendUrl";
import { getAuthHeaders } from "../lib/authHeaders";
import { downloadConsultationPdf } from "../lib/consultationPdf";
import { getConsultationSearchHaystack } from "../lib/consultationDisplay";
import {
  buildClinicalTimeline,
  countStandaloneLabStudies,
  getLabStudySearchHaystack,
} from "../lib/clinicalTimeline";
import { Button } from "../components/ui/button";
import { ConsultationHistoryCard } from "../components/consultation/ConsultationHistoryCard";
import { ConsultationDetailPanel } from "../components/consultation/ConsultationDetailPanel";
import { LabStudyHistoryCard } from "../components/clinical/LabStudyHistoryCard";
import { notifyError } from "../lib/appToast";
import "./consultationHistoryPage.css";

const STATUS_FILTERS = [
  { id: "all", label: "Todo" },
  { id: "completed", label: "Completadas" },
  { id: "in_progress", label: "En progreso" },
  { id: "draft", label: "Borradores" },
];

function HistorySkeleton() {
  return (
    <div className="history-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="history-card-skeleton">
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text long" />
          <div className="skeleton skeleton-text medium" />
        </div>
      ))}
    </div>
  );
}

export function ConsultationHistoryPage({ setView, openConsultation }) {
  const { veterinarian } = useVet();
  const [consultations, setConsultations] = useState([]);
  const [medicalImages, setMedicalImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [pdfError, setPdfError] = useState("");

  const loadHistory = async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    try {
      const headers = getAuthHeaders(veterinarian.id);
      const [consultationsRes, imagesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/consultations/${veterinarian.id}/history?limit=100`, { headers }),
        fetch(`${BACKEND_URL}/api/medical-images/history?limit=100`, { headers }),
      ]);

      if (consultationsRes.ok) {
        const data = await consultationsRes.json();
        setConsultations(data.consultations || []);
      } else {
        notifyError("No se pudo cargar el historial clínico. Intenta de nuevo.");
      }

      if (imagesRes.ok) {
        const data = await imagesRes.json();
        setMedicalImages(data.images || []);
      } else if (consultationsRes.ok) {
        setMedicalImages([]);
      } else {
        notifyError("No se pudo cargar el historial clínico completo.");
      }
    } catch (error) {
      notifyError("No se pudo cargar el historial. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [veterinarian?.id]);

  const timeline = useMemo(
    () => buildClinicalTimeline(consultations, medicalImages),
    [consultations, medicalImages],
  );

  const stats = useMemo(() => {
    const counts = {
      all: timeline.length,
      completed: 0,
      in_progress: 0,
      draft: 0,
      lab_studies: medicalImages.length,
    };
    consultations.forEach((c) => {
      const status = c.status || "completed";
      if (counts[status] != null) counts[status] += 1;
    });
    return counts;
  }, [timeline.length, consultations, medicalImages.length]);

  const filteredTimeline = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return timeline.filter((item) => {
      if (item.kind === "consultation") {
        const status = item.consultation.status || "completed";
        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (!query) return true;
        const consultationHaystack = getConsultationSearchHaystack(item.consultation);
        const labHaystack = item.linkedStudies.map((study) => getLabStudySearchHaystack(study)).join(" ");
        return `${consultationHaystack} ${labHaystack}`.includes(query);
      }

      if (statusFilter !== "all") return false;
      if (!query) return true;
      return getLabStudySearchHaystack(item.study).includes(query);
    });
  }, [timeline, searchQuery, statusFilter]);

  const handleDownloadPdf = async (consultationId) => {
    setPdfError("");
    setPdfLoadingId(consultationId);
    try {
      const response = await fetch(`${BACKEND_URL}/api/consultation/${consultationId}`, {
        headers: getAuthHeaders(veterinarian.id),
      });
      if (!response.ok) throw new Error("No se pudo cargar la consulta para exportar");
      const consultation = await response.json();
      await downloadConsultationPdf(consultation, { veterinarian });
    } catch (error) {
      const message = error.message || "Error al generar el PDF";
      setPdfError(message);
      notifyError(message);
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleViewConsultation = async (consultationId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/consultation/${consultationId}`, {
        headers: getAuthHeaders(veterinarian.id),
      });
      if (response.ok) {
        setSelectedConsultation(await response.json());
      }
    } catch (error) {
      console.error("Error loading consultation details:", error);
    }
  };

  const standaloneLabCount = countStandaloneLabStudies(medicalImages, consultations);

  if (selectedConsultation) {
    return (
      <ConsultationDetailPanel
        consultation={selectedConsultation}
        pdfLoadingId={pdfLoadingId}
        onBack={() => setSelectedConsultation(null)}
        onDownloadPdf={handleDownloadPdf}
        onContinue={openConsultation}
      />
    );
  }

  return (
    <div className="history-page history-page-guiaa">
      <div className="container">
        <header className="history-page-header">
          <div>
            <p className="history-page-eyebrow">Expediente clínico</p>
            <h1>Historial clínico</h1>
            <p>
              Consultas CDS e interpretaciones de laboratorio en un solo lugar, con folio, estado y
              exportación PDF.
            </p>
          </div>
          <Button type="button" onClick={() => setView("new-consultation")}>
            <Plus size={16} aria-hidden />
            Nueva consulta
          </Button>
        </header>

        <div className="history-stats-row" role="group" aria-label="Resumen del historial">
          {STATUS_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`history-stat-pill${statusFilter === id ? " is-active" : ""}`}
              onClick={() => setStatusFilter(id)}
              aria-pressed={statusFilter === id}
            >
              <span className="history-stat-value">{stats[id] ?? 0}</span>
              <span className="history-stat-label">{label}</span>
            </button>
          ))}
          <div className="history-stat-pill history-stat-pill--info" aria-label="Interpretaciones de laboratorio">
            <span className="history-stat-value">{stats.lab_studies}</span>
            <span className="history-stat-label">Laboratorio</span>
          </div>
        </div>

        <div className="history-toolbar">
          <div className="history-search-wrap">
            <Search size={18} className="history-search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Buscar por folio, mascota, propietario, raza o estudio…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="history-search-input"
              aria-label="Buscar en historial clínico"
            />
            {searchQuery && (
              <button
                type="button"
                className="history-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="history-filter-tabs" role="tablist" aria-label="Filtrar por estado">
            {STATUS_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={statusFilter === id}
                className={`history-filter-tab${statusFilter === id ? " is-active" : ""}`}
                onClick={() => setStatusFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {pdfError && (
          <p className="history-error-banner" role="alert">
            {pdfError}
          </p>
        )}

        {loading ? (
          <HistorySkeleton />
        ) : filteredTimeline.length > 0 ? (
          <>
            <p className="history-results-count">
              {filteredTimeline.length} registro
              {filteredTimeline.length !== 1 ? "s" : ""}
              {searchQuery || statusFilter !== "all" ? " encontrados" : " en total"}
              {standaloneLabCount > 0 && statusFilter === "all" && (
                <span className="history-results-subcount">
                  {" "}
                  · {standaloneLabCount} interpretación{standaloneLabCount !== 1 ? "es" : ""} de
                  laboratorio
                </span>
              )}
            </p>
            <div className="history-grid">
              {filteredTimeline.map((item) => {
                if (item.kind === "consultation") {
                  const consultation = {
                    ...item.consultation,
                    medical_images: item.linkedStudies,
                  };
                  return (
                    <ConsultationHistoryCard
                      key={`consultation-${item.id}`}
                      consultation={consultation}
                      pdfLoadingId={pdfLoadingId}
                      onView={handleViewConsultation}
                      onDownloadPdf={handleDownloadPdf}
                      onContinue={openConsultation}
                    />
                  );
                }
                return <LabStudyHistoryCard key={`lab-${item.id}`} study={item.study} />;
              })}
            </div>
          </>
        ) : (
          <div className="history-empty-state">
            <div className="history-empty-icon">
              {searchQuery || statusFilter !== "all" ? (
                <Search size={36} aria-hidden />
              ) : (
                <ClipboardList size={36} aria-hidden />
              )}
            </div>
            <h3>
              {searchQuery || statusFilter !== "all"
                ? "No se encontraron registros"
                : "Sin historial clínico aún"}
            </h3>
            <p>
              {searchQuery || statusFilter !== "all"
                ? "Prueba otro término o cambia el filtro de estado."
                : "Inicia una consulta CDS o interpreta un estudio de laboratorio."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <div className="history-empty-actions">
                <Button type="button" variant="guiaaPrimary" onClick={() => setView("new-consultation")}>
                  <Stethoscope size={16} aria-hidden />
                  Nueva consulta
                </Button>
                <Button type="button" variant="guiaaSoft" onClick={() => setView("medical-images")}>
                  <FlaskConical size={16} aria-hidden />
                  Interpretar estudio
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
