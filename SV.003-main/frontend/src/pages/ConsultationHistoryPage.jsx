import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Search, Stethoscope, X } from "lucide-react";
import { useVet } from "../context/VetContext";
import { BACKEND_URL } from "../lib/backendUrl";
import { getAuthHeaders } from "../lib/authHeaders";
import { downloadConsultationPdf } from "../lib/consultationPdf";
import { getConsultationSearchHaystack } from "../lib/consultationDisplay";
import { Button } from "../components/ui/button";
import { ConsultationHistoryCard } from "../components/consultation/ConsultationHistoryCard";
import { ConsultationDetailPanel } from "../components/consultation/ConsultationDetailPanel";
import "./consultationHistoryPage.css";

const STATUS_FILTERS = [
  { id: "all", label: "Todas" },
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
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [pdfError, setPdfError] = useState("");

  const loadConsultations = async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/consultations/${veterinarian.id}/history`,
        { headers: getAuthHeaders(veterinarian.id) },
      );
      if (response.ok) {
        const data = await response.json();
        setConsultations(data.consultations || []);
      }
    } catch (error) {
      console.error("Error loading consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, [veterinarian?.id]);

  const stats = useMemo(() => {
    const counts = { all: consultations.length, completed: 0, in_progress: 0, draft: 0 };
    consultations.forEach((c) => {
      const status = c.status || "completed";
      if (counts[status] != null) counts[status] += 1;
    });
    return counts;
  }, [consultations]);

  const filteredConsultations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return consultations.filter((consultation) => {
      const status = consultation.status || "completed";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!query) return true;
      return getConsultationSearchHaystack(consultation).includes(query);
    });
  }, [consultations, searchQuery, statusFilter]);

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
      console.error("Error generating consultation PDF:", error);
      setPdfError(error.message || "Error al generar el PDF");
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
            <p className="history-page-eyebrow">Expediente CDS</p>
            <h1>Historial de consultas</h1>
            <p>Todas tus consultas veterinarias con folio, estado y exportación PDF.</p>
          </div>
          <Button type="button" onClick={() => setView("new-consultation")}>
            <Plus size={16} aria-hidden />
            Nueva consulta
          </Button>
        </header>

        <div className="history-stats-row">
          {STATUS_FILTERS.map(({ id, label }) => (
            <div key={id} className="history-stat-pill">
              <span className="history-stat-value">{stats[id] ?? 0}</span>
              <span className="history-stat-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="history-toolbar">
          <div className="history-search-wrap">
            <Search size={18} className="history-search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Buscar por folio, mascota, propietario o raza…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="history-search-input"
              aria-label="Buscar consultas"
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

        {pdfError && <p className="history-error-banner">{pdfError}</p>}

        {loading ? (
          <HistorySkeleton />
        ) : filteredConsultations.length > 0 ? (
          <>
            <p className="history-results-count">
              {filteredConsultations.length} consulta
              {filteredConsultations.length !== 1 ? "s" : ""}
              {searchQuery || statusFilter !== "all" ? " encontradas" : " en total"}
            </p>
            <div className="history-grid">
              {filteredConsultations.map((consultation) => (
                <ConsultationHistoryCard
                  key={consultation.id}
                  consultation={consultation}
                  pdfLoadingId={pdfLoadingId}
                  onView={handleViewConsultation}
                  onDownloadPdf={handleDownloadPdf}
                  onContinue={openConsultation}
                />
              ))}
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
                ? "No se encontraron consultas"
                : "Sin consultas aún"}
            </h3>
            <p>
              {searchQuery || statusFilter !== "all"
                ? "Prueba otro término o cambia el filtro de estado."
                : "Inicia tu primera consulta CDS con anamnesis estructurada."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button type="button" variant="guiaaPrimary" onClick={() => setView("new-consultation")}>
                <Stethoscope size={16} aria-hidden />
                Nueva consulta
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
