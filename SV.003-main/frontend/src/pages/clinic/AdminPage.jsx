import React, { useCallback, useEffect, useState } from "react";
import { Shield, Trash2, CheckCircle, XCircle, RefreshCw, ExternalLink, Eye, ClipboardList, ChevronDown, ChevronUp, FileDown, MessageSquare, Users, Building2, Gem, PawPrint, Inbox, Star, Stethoscope, Circle } from "lucide-react";
import "./clinicPageShared.css";
import "./adminPage.css";
import { ConfirmActionDialog } from "../../components/clinic/ConfirmActionDialog";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import {
  ClinicReportsSkeleton,
  ClinicTableSkeleton,
  ClinicEmptyState,
  clinicDialogClass,
} from "../../components/clinic/ClinicPageUi";
import { useVet } from "../../context/VetContext";
import {
  fetchAdminAccess,
  fetchAdminOverview,
  fetchAdminUsers,
  fetchAdminOrganizations,
  adminDeleteUser,
  adminLookupUser,
  adminVerifyUserCedula,
  adminReviewUserCedula,
  fetchAdminUserConsultations,
  fetchAdminUserCedulaDocumentBlob,
  fetchAdminSupportTickets,
  fetchAdminSupportTicket,
  updateAdminSupportTicket,
  replyAdminSupportTicket,
  fetchAdminGuiaConsultasLeads,
  updateAdminGuiaConsultasLead,
  fetchAdminTrialSurveys,
} from "../../lib/clinicApi";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { cleanClinicalDisplayText, downloadUserConsultationsHistoryPdf } from "../../lib/consultationPdf";
import { countryLabel } from "../../lib/latamCountries";

const PLAN_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "trial", label: "Solo prueba" },
  { id: "paid", label: "Con plan de pago" },
];

const PRESENCE_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "online", label: "En línea" },
  { id: "offline", label: "Fuera de línea" },
];

const SUPPORT_FILTERS = [
  { id: "", label: "Todos" },
  { id: "open", label: "Abiertos" },
  { id: "in_progress", label: "En progreso" },
  { id: "resolved", label: "Resueltos" },
  { id: "closed", label: "Cerrados" },
];

const LEAD_FILTERS = [
  { id: "", label: "Todas" },
  { id: "new", label: "Nuevas" },
  { id: "contacted", label: "Contactadas" },
  { id: "closed", label: "Cerradas" },
];

const LEAD_STATUS_LABELS = {
  new: "Nueva",
  contacted: "Contactada",
  closed: "Cerrada",
};

const SUPPORT_STATUS_LABELS = {
  open: "Abierto",
  in_progress: "En progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const PLAN_LABELS = {
  basic: "Básica",
  professional: "Profesional",
  premium: "Premium",
  trial: "Prueba",
};

const CEDULA_STATUS_LABELS = {
  unsubmitted: "Sin enviar",
  pending: "En revisión",
  verified: "Verificada",
  rejected: "Rechazada",
};

function formatCedulaStatus(status) {
  const key = (status || "unsubmitted").toLowerCase();
  return CEDULA_STATUS_LABELS[key] || key;
}

function cedulaStatusClass(status) {
  const key = (status || "unsubmitted").toLowerCase();
  if (key === "verified") return "clinic-cedula-badge-verified";
  if (key === "pending") return "clinic-cedula-badge-pending";
  if (key === "rejected") return "clinic-cedula-badge-rejected";
  return "clinic-cedula-badge-unsubmitted";
}

function formatPlanLabel(user) {
  const type = (user.membership_type || "").toLowerCase();
  if (type && PLAN_LABELS[type]) return PLAN_LABELS[type];
  if (!type) {
    const remaining = user.consultations_remaining ?? 0;
    return remaining > 0 ? "Prueba (sin plan)" : "Sin plan";
  }
  return user.membership_type;
}

function formatRegisteredAt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLastSeen(iso) {
  if (!iso) return "Sin actividad";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "Sin actividad";
  return dt.toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cedulaDocKind(url, blobType = "") {
  const type = (blobType || "").toLowerCase();
  if (type.includes("pdf")) return "pdf";
  if (type.startsWith("image/")) return "image";
  if (!url) return null;
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|webp|gif)$/.test(path)) return "image";
  return "unknown";
}

const CONSULTATION_STATUS_LABELS = {
  completed: "Completada",
  in_progress: "En progreso",
  draft: "Borrador",
  registered: "Registrada",
};

function formatConsultationStatus(status) {
  const key = (status || "registered").toLowerCase();
  return CONSULTATION_STATUS_LABELS[key] || key;
}

function consultationStatusClass(status) {
  const key = (status || "registered").toLowerCase();
  if (key === "completed") return "clinic-admin-consult-status-completed";
  if (key === "in_progress") return "clinic-admin-consult-status-progress";
  if (key === "draft") return "clinic-admin-consult-status-draft";
  return "clinic-admin-consult-status-default";
}

function formatCategoryLabel(category) {
  if (!category) return "—";
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatConsultationId(consultation) {
  if (consultation.consultation_number) return consultation.consultation_number;
  if (consultation.id) return `CONS-${consultation.id.slice(0, 8).toUpperCase()}`;
  return "—";
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTrialSurveyRating(rating) {
  const value = Number(rating);
  if (!Number.isFinite(value) || value < 1) return "—";
  return `${value}/5`;
}

function renderTrialSurveyStars(rating) {
  const value = Math.min(5, Math.max(0, Number(rating) || 0));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function consultationField(consultation, key) {
  const value = consultation[key] ?? consultation.form_data?.[key];
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

export function AdminPage() {
  const { veterinarian, loading: vetLoading, platformAdmin } = useVet();
  const { confirm, dialogProps } = useConfirmAction();
  const [allowed, setAllowed] = useState(null);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [usersTotalMatching, setUsersTotalMatching] = useState(0);
  const [usersTotalRegistered, setUsersTotalRegistered] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [presenceFilter, setPresenceFilter] = useState("all");
  const [deleteEmail, setDeleteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [cedulaActingId, setCedulaActingId] = useState(null);
  const [cedulaPreview, setCedulaPreview] = useState(null);
  const [cedulaPreviewUrl, setCedulaPreviewUrl] = useState("");
  const [cedulaPreviewObjectUrl, setCedulaPreviewObjectUrl] = useState("");
  const [cedulaPreviewKind, setCedulaPreviewKind] = useState(null);
  const [cedulaPreviewLoading, setCedulaPreviewLoading] = useState(false);
  const [historyUser, setHistoryUser] = useState(null);
  const [historyConsultations, setHistoryConsultations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPdfLoading, setHistoryPdfLoading] = useState(false);
  const [expandedConsultationId, setExpandedConsultationId] = useState(null);
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportOpenCount, setSupportOpenCount] = useState(0);
  const [supportFilter, setSupportFilter] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketActing, setTicketActing] = useState(false);
  const [guiaLeads, setGuiaLeads] = useState([]);
  const [guiaLeadsNewCount, setGuiaLeadsNewCount] = useState(0);
  const [guiaLeadFilter, setGuiaLeadFilter] = useState("");
  const [guiaLeadsLoading, setGuiaLeadsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadNotes, setLeadNotes] = useState("");
  const [leadActing, setLeadActing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [trialSurveys, setTrialSurveys] = useState([]);
  const [trialSurveysCount, setTrialSurveysCount] = useState(0);
  const [trialSurveySearch, setTrialSurveySearch] = useState("");
  const [trialSurveysLoading, setTrialSurveysLoading] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  useEffect(() => {
    return () => {
      if (cedulaPreviewObjectUrl) {
        URL.revokeObjectURL(cedulaPreviewObjectUrl);
      }
    };
  }, [cedulaPreviewObjectUrl]);

  const load = useCallback(async (opts = {}) => {
    const soft = !!opts.soft;
    if (!veterinarian?.id) return;
    if (!soft) {
      setLoading(true);
      setLoadError("");
    }
    try {
      let allowedUser = platformAdmin;
      if (!allowedUser) {
        const access = await fetchAdminAccess(veterinarian.id);
        allowedUser = !!access.platform_admin;
      }
      if (!allowedUser) {
        setAllowed(false);
        return;
      }

      const [ov, usersData, orgsData] = await Promise.all([
        fetchAdminOverview(veterinarian.id),
        fetchAdminUsers(veterinarian.id, search, planFilter, 500, presenceFilter),
        fetchAdminOrganizations(veterinarian.id),
      ]);
      setOverview(ov.overview || null);
      setUsers(usersData.users || []);
      setUserCount(usersData.count ?? usersData.users?.length ?? 0);
      setUsersTotalMatching(
        usersData.total_matching ?? usersData.count ?? usersData.users?.length ?? 0,
      );
      setUsersTotalRegistered(
        usersData.total_registered ?? ov.overview?.users_total ?? usersData.users?.length ?? 0,
      );
      setOrganizations(orgsData.organizations || []);

      if (soft) {
        setAllowed(true);
        return;
      }

      setSupportLoading(true);
      try {
        const supportData = await fetchAdminSupportTickets(veterinarian.id, supportFilter);
        setSupportTickets(supportData.tickets || []);
        setSupportOpenCount(supportData.open_count ?? 0);
      } catch {
        setSupportTickets([]);
        setSupportOpenCount(0);
      } finally {
        setSupportLoading(false);
      }

      setGuiaLeadsLoading(true);
      try {
        const leadsData = await fetchAdminGuiaConsultasLeads(veterinarian.id, guiaLeadFilter);
        setGuiaLeads(leadsData.leads || []);
        setGuiaLeadsNewCount(leadsData.new_count ?? 0);
      } catch {
        setGuiaLeads([]);
        setGuiaLeadsNewCount(0);
      } finally {
        setGuiaLeadsLoading(false);
      }

      setTrialSurveysLoading(true);
      try {
        const surveysData = await fetchAdminTrialSurveys(veterinarian.id, trialSurveySearch);
        setTrialSurveys(surveysData.surveys || []);
        setTrialSurveysCount(surveysData.count ?? surveysData.surveys?.length ?? 0);
      } catch {
        setTrialSurveys([]);
        setTrialSurveysCount(0);
      } finally {
        setTrialSurveysLoading(false);
      }

      setAllowed(true);
    } catch (err) {
      const message = err.message || "No se pudo cargar el panel de administración";
      setLoadError(message);
      notifyError(message);
      setAllowed(platformAdmin ? null : false);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id, search, planFilter, presenceFilter, supportFilter, guiaLeadFilter, trialSurveySearch, platformAdmin]);

  useEffect(() => {
    if (vetLoading || !veterinarian?.id) return undefined;
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search, vetLoading, veterinarian?.id, planFilter, presenceFilter, supportFilter, guiaLeadFilter, trialSurveySearch]);

  useEffect(() => {
    if (!allowed || !veterinarian?.id) return undefined;
    const interval = setInterval(() => {
      load({ soft: true });
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [allowed, veterinarian?.id, load]);

  const handleDeleteUser = async (e) => {
    e.preventDefault();
    if (!deleteEmail.trim()) return;
    const ok = await confirm({
      title: "Eliminar usuario",
      description: `¿Eliminar permanentemente a ${deleteEmail}? Se borrarán perfil, consultas, imágenes, tickets y pagos asociados en Supabase.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setActing(true);
    try {
      const data = await adminDeleteUser(veterinarian.id, deleteEmail.trim());
      const removed = data.removed || {};
      const parts = Object.entries(removed)
        .filter(([, count]) => Number(count) > 0)
        .map(([key, count]) => `${key}: ${count}`);
      const summary = parts.length ? ` (${parts.join(", ")})` : "";
      notifySuccess((data.message || "Usuario eliminado.") + summary);
      setDeleteEmail("");
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setActing(false);
    }
  };

  const handleLookupUser = async () => {
    if (!deleteEmail.trim()) return;
    setActing(true);
    try {
      const data = await adminLookupUser(veterinarian.id, deleteEmail.trim());
      if (data.exists) {
        notifyError(`El email sigue registrado: ${data.nombre || data.email} (${data.id})`);
      } else {
        notifySuccess(`No hay usuario con el email ${deleteEmail.trim()} en Supabase.`);
      }
    } catch (err) {
      notifyError(err.message);
    } finally {
      setActing(false);
    }
  };

  const handleVerifyCedula = async (user) => {
    const ok = await confirm({
      title: "Validación SEP",
      description: `¿Intentar validación automática SEP para ${user.nombre} (México)?`,
      confirmLabel: "Validar",
    });
    if (!ok) return;
    setCedulaActingId(user.id);
    try {
      const data = await adminVerifyUserCedula(veterinarian.id, user.id);
      notifySuccess(data.message || "Verificación completada.");
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCedulaActingId(null);
    }
  };

  const handleApproveCedula = async (user) => {
    const ok = await confirm({
      title: "Aprobar registro",
      description: `¿Aprobar el documento profesional de ${user.nombre}?`,
      confirmLabel: "Aprobar",
    });
    if (!ok) return;
    setCedulaActingId(user.id);
    try {
      const data = await adminReviewUserCedula(veterinarian.id, user.id, "approve");
      notifySuccess(data.message || "Registro profesional aprobado.");
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCedulaActingId(null);
    }
  };

  const handleRejectCedula = async (user) => {
    const note = window.prompt(`Motivo de rechazo para ${user.nombre} (opcional):`, "");
    if (note === null) return;
    setCedulaActingId(user.id);
    try {
      const data = await adminReviewUserCedula(veterinarian.id, user.id, "reject", note);
      notifySuccess(data.message || "Registro profesional rechazado.");
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCedulaActingId(null);
    }
  };

  const openConsultationHistory = async (user) => {
    setHistoryUser(user);
    setHistoryConsultations([]);
    setHistoryLoading(true);
    try {
      const data = await fetchAdminUserConsultations(veterinarian.id, user.id, 50);
      setHistoryConsultations(data.consultations || []);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeConsultationHistory = () => {
    setHistoryUser(null);
    setHistoryConsultations([]);
    setHistoryLoading(false);
    setHistoryPdfLoading(false);
    setExpandedConsultationId(null);
  };

  const handleDownloadHistoryPdf = async () => {
    if (!historyUser || historyConsultations.length === 0) return;
    setHistoryPdfLoading(true);
    try {
      await downloadUserConsultationsHistoryPdf(historyUser, historyConsultations, {
        generatedBy: veterinarian,
      });
    } catch (err) {
      notifyError(err.message || "No se pudo generar el PDF");
    } finally {
      setHistoryPdfLoading(false);
    }
  };

  const closeCedulaPreview = () => {
    if (cedulaPreviewObjectUrl) {
      URL.revokeObjectURL(cedulaPreviewObjectUrl);
    }
    setCedulaPreview(null);
    setCedulaPreviewUrl("");
    setCedulaPreviewObjectUrl("");
    setCedulaPreviewKind(null);
    setCedulaPreviewLoading(false);
  };

  const openCedulaPreview = async (user) => {
    setCedulaPreview(user);
    setCedulaPreviewUrl("");
    setCedulaPreviewKind(null);
    if (cedulaPreviewObjectUrl) {
      URL.revokeObjectURL(cedulaPreviewObjectUrl);
    }
    setCedulaPreviewObjectUrl("");
    setCedulaPreviewLoading(true);
    try {
      // Siempre vía blob (API) para evitar bloqueo CSP/X-Frame de URLs externas (PDF e imagen).
      const blob = await fetchAdminUserCedulaDocumentBlob(veterinarian.id, user.id);
      const objectUrl = URL.createObjectURL(blob);
      setCedulaPreviewObjectUrl(objectUrl);
      setCedulaPreviewUrl(objectUrl);
      setCedulaPreviewKind(cedulaDocKind(user.cedula_document_url, blob.type));
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCedulaPreviewLoading(false);
    }
  };

  const openSupportTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setTicketDetail(null);
    setTicketReply("");
    setTicketActing(true);
    try {
      const data = await fetchAdminSupportTicket(veterinarian.id, ticket.id);
      setTicketDetail(data.ticket || null);
    } catch (err) {
      notifyError(err.message);
      setSelectedTicket(null);
    } finally {
      setTicketActing(false);
    }
  };

  const closeSupportTicket = () => {
    setSelectedTicket(null);
    setTicketDetail(null);
    setTicketReply("");
  };

  const handleTicketStatusChange = async (status) => {
    if (!ticketDetail?.id) return;
    setTicketActing(true);
    try {
      const data = await updateAdminSupportTicket(veterinarian.id, ticketDetail.id, { status });
      setTicketDetail(data.ticket ? { ...ticketDetail, ...data.ticket } : ticketDetail);
      const supportData = await fetchAdminSupportTickets(veterinarian.id, supportFilter);
      setSupportTickets(supportData.tickets || []);
      setSupportOpenCount(supportData.open_count ?? 0);
      notifySuccess("Estado del ticket actualizado.");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setTicketActing(false);
    }
  };

  const handleTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketDetail?.id || !ticketReply.trim()) return;
    setTicketActing(true);
    try {
      await replyAdminSupportTicket(veterinarian.id, ticketDetail.id, ticketReply.trim());
      const data = await fetchAdminSupportTicket(veterinarian.id, ticketDetail.id);
      setTicketDetail(data.ticket || null);
      setTicketReply("");
      const supportData = await fetchAdminSupportTickets(veterinarian.id, supportFilter);
      setSupportTickets(supportData.tickets || []);
      setSupportOpenCount(supportData.open_count ?? 0);
      notifySuccess("Respuesta enviada al usuario.");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setTicketActing(false);
    }
  };

  const openGuiaLead = (lead) => {
    setSelectedLead(lead);
    setLeadNotes(lead.admin_notes || "");
  };

  const closeGuiaLead = () => {
    setSelectedLead(null);
    setLeadNotes("");
  };

  const handleLeadStatusChange = async (status) => {
    if (!selectedLead?.id) return;
    setLeadActing(true);
    try {
      await updateAdminGuiaConsultasLead(veterinarian.id, selectedLead.id, { status });
      const leadsData = await fetchAdminGuiaConsultasLeads(veterinarian.id, guiaLeadFilter);
      setGuiaLeads(leadsData.leads || []);
      setGuiaLeadsNewCount(leadsData.new_count ?? 0);
      setSelectedLead((prev) => (prev ? { ...prev, status } : prev));
      notifySuccess("Estado actualizado.");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLeadActing(false);
    }
  };

  const handleLeadNotesSave = async (e) => {
    e.preventDefault();
    if (!selectedLead?.id) return;
    setLeadActing(true);
    try {
      const data = await updateAdminGuiaConsultasLead(veterinarian.id, selectedLead.id, {
        admin_notes: leadNotes.trim(),
      });
      const updated = data.lead || { ...selectedLead, admin_notes: leadNotes.trim() };
      setSelectedLead(updated);
      const leadsData = await fetchAdminGuiaConsultasLeads(veterinarian.id, guiaLeadFilter);
      setGuiaLeads(leadsData.leads || []);
      setGuiaLeadsNewCount(leadsData.new_count ?? 0);
      notifySuccess("Notas guardadas.");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLeadActing(false);
    }
  };

  const showSkeleton =
    vetLoading || loading || (allowed === null && !!veterinarian?.id);

  if (showSkeleton) {
    return (
      <div className="clinic-page clinic-page-guiaa clinic-admin-page clinic-admin-page-guiaa">
        <div className="clinic-page-header">
          <div>
            <p className="clinic-page-eyebrow">Plataforma</p>
            <h1>
              <Shield size={22} aria-hidden />
              Administración GUIAA
            </h1>
            <p>Usuarios, clínicas y operaciones de la plataforma.</p>
          </div>
        </div>
        {loadError ? (
          <ClinicEmptyState
            icon={Shield}
            title="No se pudo cargar el panel"
            description={loadError}
            actionLabel="Reintentar"
            onAction={load}
          />
        ) : (
          <>
            <ClinicReportsSkeleton />
            <div className="clinic-admin-skeleton-block">
              <ClinicTableSkeleton rows={8} cols={5} />
            </div>
            <p className="clinic-muted clinic-admin-loading-hint">
              Cargando datos de administración… esto puede tardar unos segundos.
            </p>
          </>
        )}
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="clinic-page clinic-page-guiaa clinic-admin-page clinic-admin-page-guiaa">
        <div className="clinic-page-header">
          <div>
            <p className="clinic-page-eyebrow">Plataforma</p>
            <h1>
              <Shield size={22} aria-hidden />
              Administración GUIAA
            </h1>
            <p>Acceso restringido a administradores de plataforma.</p>
          </div>
        </div>
        <ClinicEmptyState
          icon={Shield}
          title="Sin acceso de administrador"
          description="Tu cuenta no tiene permisos para gestionar la plataforma GUIAA."
        />
      </div>
    );
  }

  const stats = overview || {};

  return (
    <div className="clinic-page clinic-page-guiaa clinic-admin-page clinic-admin-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Plataforma</p>
          <h1>
            <Shield size={22} aria-hidden />
            Administración GUIAA
          </h1>
          <p>Usuarios registrados en Supabase (tabla profiles), clínicas y operaciones.</p>
        </div>
      </div>

      <div className="clinic-report-kpi-grid">
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Users size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">Usuarios</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.users_total ?? 0}</div>
        </div>
        <div className="clinic-report-kpi clinic-admin-kpi-online">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Circle size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">En línea</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.users_online ?? 0}</div>
        </div>
        <div className="clinic-report-kpi clinic-admin-kpi-offline">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Circle size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">Fuera de línea</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.users_offline ?? 0}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Building2 size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">Clínicas</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.organizations_total ?? 0}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Gem size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">Premium</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.premium_users ?? 0}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><PawPrint size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">Mascotas</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.patients_total ?? 0}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Stethoscope size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">Consultas CDS usadas</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.consultations_total ?? 0}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><MessageSquare size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">Soporte abierto</span>
          </div>
          <div className="clinic-report-kpi-value">{supportOpenCount}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Inbox size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">ADSGuiaa</span>
          </div>
          <div className="clinic-report-kpi-value">{guiaLeadsNewCount}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Star size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">Encuestas prueba</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.trial_surveys_total ?? trialSurveysCount}</div>
        </div>
      </div>

      <section className="clinic-settings-card">
        <div className="clinic-admin-users-head">
          <h2>
            <Star size={18} aria-hidden />
            Encuestas post-prueba
          </h2>
          <span className="clinic-admin-users-count">{trialSurveysCount} respuestas</span>
        </div>
        <p className="clinic-muted clinic-tools-desc">
          Opiniones de veterinarios que agotaron sus 3 consultas de prueba y completaron la
          encuesta obligatoria.
        </p>
        <div className="clinic-admin-users-toolbar">
          <div className="clinic-search clinic-admin-search">
            <Input
              placeholder="Buscar por nombre, email o comentario..."
              value={trialSurveySearch}
              onChange={(e) => setTrialSurveySearch(e.target.value)}
            />
          </div>
        </div>
        {trialSurveysLoading ? (
          <ClinicTableSkeleton rows={4} cols={5} />
        ) : trialSurveys.length === 0 ? (
          <ClinicEmptyState
            icon={Star}
            title="Sin encuestas todavía"
            description="Cuando un usuario complete la encuesta al terminar su prueba, aparecerá aquí."
          />
        ) : (
          <div className="clinic-table-wrap">
            <table className="clinic-table clinic-admin-support-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Calificación</th>
                  <th>Comentario</th>
                  <th>Plan actual</th>
                </tr>
              </thead>
              <tbody>
                {trialSurveys.map((survey) => (
                  <tr
                    key={survey.id}
                    className="clinic-admin-support-row"
                    onClick={() => setSelectedSurvey(survey)}
                  >
                    <td className="clinic-admin-history-date">{formatDateTime(survey.completed_at)}</td>
                    <td>
                      <div>{survey.nombre || "—"}</div>
                      <div className="clinic-muted clinic-admin-support-email">{survey.email || "—"}</div>
                    </td>
                    <td>
                      <span className="clinic-admin-trial-survey-stars" aria-hidden>
                        {renderTrialSurveyStars(survey.rating)}
                      </span>
                      <span className="clinic-muted"> {formatTrialSurveyRating(survey.rating)}</span>
                    </td>
                    <td className="clinic-admin-lead-message">
                      {(survey.comment || "—").slice(0, 100)}
                      {(survey.comment || "").length > 100 ? "…" : ""}
                    </td>
                    <td>{formatPlanLabel(survey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="clinic-settings-card">
        <div className="clinic-admin-users-head">
          <h2>
            <Inbox size={18} aria-hidden />
            ADSGuiaa — solicitudes de publicidad
          </h2>
          <span className="clinic-admin-users-count">{guiaLeads.length} solicitudes</span>
        </div>
        <p className="clinic-muted clinic-tools-desc">
          Marcas y laboratorios interesados en anunciarse en Guía Consultas (momento de decisión
          clínica) desde la landing pública.
        </p>
        <div className="clinic-admin-plan-filters">
          {LEAD_FILTERS.map((f) => (
            <Button
              key={f.id || "all"}
              type="button"
              size="sm"
              variant={guiaLeadFilter === f.id ? "default" : "secondary"}
              onClick={() => setGuiaLeadFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        {guiaLeadsLoading ? (
          <ClinicTableSkeleton rows={4} cols={5} />
        ) : guiaLeads.length === 0 ? (
          <ClinicEmptyState
            icon={Inbox}
            title="Sin solicitudes"
            description="Aún no hay solicitudes de ADSGuiaa con el filtro seleccionado."
          />
        ) : (
          <div className="clinic-table-wrap">
            <table className="clinic-table clinic-admin-support-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Mensaje</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {guiaLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="clinic-admin-support-row"
                    onClick={() => openGuiaLead(lead)}
                  >
                    <td className="clinic-admin-history-date">{formatDateTime(lead.created_at)}</td>
                    <td>{lead.name}</td>
                    <td>
                      <div>{lead.email}</div>
                      <div className="clinic-muted clinic-admin-support-email">{lead.phone || "—"}</div>
                    </td>
                    <td className="clinic-admin-lead-message">
                      {(lead.message || "—").slice(0, 80)}
                      {(lead.message || "").length > 80 ? "…" : ""}
                    </td>
                    <td>
                      <span className={`clinic-admin-support-status status-${lead.status}`}>
                        {LEAD_STATUS_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="clinic-settings-card">
        <div className="clinic-admin-users-head">
          <h2>
            <MessageSquare size={18} aria-hidden />
            Soporte / tickets
          </h2>
          <span className="clinic-admin-users-count">{supportTickets.length} tickets</span>
        </div>
        <div className="clinic-admin-plan-filters">
          {SUPPORT_FILTERS.map((f) => (
            <Button
              key={f.id || "all"}
              type="button"
              size="sm"
              variant={supportFilter === f.id ? "default" : "secondary"}
              onClick={() => setSupportFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        {supportLoading ? (
          <ClinicTableSkeleton rows={5} cols={5} />
        ) : supportTickets.length === 0 ? (
          <ClinicEmptyState
            icon={MessageSquare}
            title="Sin tickets"
            description="No hay tickets de soporte con el filtro seleccionado."
          />
        ) : (
          <div className="clinic-table-wrap">
            <table className="clinic-table clinic-admin-support-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Asunto</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {supportTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="clinic-admin-support-row"
                    onClick={() => openSupportTicket(t)}
                  >
                    <td className="clinic-admin-history-date">
                      {formatDateTime(t.created_at)}
                    </td>
                    <td>
                      <div>{t.user_name || "—"}</div>
                      <div className="clinic-muted clinic-admin-support-email">{t.user_email}</div>
                    </td>
                    <td>{t.subject}</td>
                    <td>
                      <span className={`clinic-admin-support-status status-${t.status}`}>
                        {SUPPORT_STATUS_LABELS[t.status] || t.status}
                      </span>
                    </td>
                    <td>{t.priority === "high" ? "Alta" : "Normal"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="clinic-settings-card">
        <h2>Acciones</h2>
        <p className="clinic-muted clinic-tools-desc">
          Elimina el perfil y datos asociados en Supabase (consultas, laboratorio, pagos,
          tickets de soporte). Tras borrar, usa «Verificar email» para confirmar que ya no existe.
        </p>
        <div className="clinic-admin-actions">
          <form onSubmit={handleDeleteUser} className="clinic-admin-delete-form">
            <div className="form-group">
              <Label htmlFor="delete-email">Eliminar usuario por email</Label>
              <Input
                id="delete-email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
              />
            </div>
            <Button type="button" variant="secondary" disabled={acting || !deleteEmail.trim()} onClick={handleLookupUser}>
              Verificar email
            </Button>
            <Button type="submit" variant="secondary" disabled={acting || !deleteEmail.trim()}>
              <Trash2 size={16} aria-hidden />
              Eliminar
            </Button>
          </form>
        </div>
      </section>

      <section className="clinic-settings-card">
        <div className="clinic-admin-users-head">
          <h2>Usuarios registrados</h2>
          <span className="clinic-muted clinic-admin-users-count">
            {usersTotalMatching} coincidencia{usersTotalMatching === 1 ? "" : "s"}
            {" · "}
            {usersTotalRegistered} registrados en total
            {userCount !== usersTotalMatching ? ` · mostrando ${userCount}` : ""}
          </span>
        </div>
        <div className="clinic-admin-users-toolbar">
          <div className="clinic-search clinic-admin-search">
            <Input
              placeholder="Buscar por nombre, email o plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="clinic-admin-plan-filters">
            {PLAN_FILTERS.map((opt) => (
              <Button
                key={opt.id}
                type="button"
                variant={planFilter === opt.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setPlanFilter(opt.id)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="clinic-admin-plan-filters" aria-label="Filtro de presencia">
            {PRESENCE_FILTERS.map((opt) => (
              <Button
                key={opt.id}
                type="button"
                variant={presenceFilter === opt.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setPresenceFilter(opt.id)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="clinic-table-wrap clinic-admin-users-table-wrap">
          <table className="clinic-table">
            <thead>
              <tr>
                <th>Presencia</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Registro</th>
                <th>País</th>
                <th>Nº profesional</th>
                <th>Estado</th>
                <th>Plan</th>
                <th>Uso de consultas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="clinic-muted" style={{ textAlign: "center" }}>
                    No hay usuarios con este filtro.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const busy = cedulaActingId === u.id;
                  const cedulaStatus = (u.cedula_verification_status || "unsubmitted").toLowerCase();
                  const online = !!u.is_online;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className={`clinic-admin-presence${online ? " is-online" : " is-offline"}`}>
                          <span className="clinic-admin-presence-dot" aria-hidden />
                          <div className="clinic-admin-presence-text">
                            <strong>{online ? "En línea" : "Fuera de línea"}</strong>
                            <span className="clinic-muted">{formatLastSeen(u.last_seen)}</span>
                          </div>
                        </div>
                      </td>
                      <td>{u.nombre || "—"}</td>
                      <td>{u.email || "—"}</td>
                      <td>{formatRegisteredAt(u.created_at)}</td>
                      <td>{countryLabel(u.profesional_pais || "MX")}</td>
                      <td className="clinic-mono">{u.cedula_profesional || "—"}</td>
                      <td>
                        <span className={`clinic-cedula-badge ${cedulaStatusClass(cedulaStatus)}`}>
                          {formatCedulaStatus(cedulaStatus)}
                        </span>
                        {u.cedula_sep_nombre && (
                          <div className="clinic-admin-cedula-sep clinic-muted">
                            SEP: {u.cedula_sep_nombre}
                          </div>
                        )}
                        {u.cedula_verification_error && cedulaStatus === "rejected" && (
                          <div className="clinic-admin-cedula-sep clinic-muted">
                            {u.cedula_verification_error}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`clinic-admin-plan-badge${
                            !u.membership_type ? " clinic-admin-plan-badge-trial" : ""
                          }`}
                        >
                          {formatPlanLabel(u)}
                        </span>
                      </td>
                      <td>
                        <div
                          className="clinic-admin-consultation-usage"
                          aria-label={`${u.consultations_used ?? 0} consultas usadas; ${
                            u.consultations_remaining ?? 0
                          } disponibles`}
                        >
                          <strong>{u.consultations_used ?? 0} usadas</strong>
                          <span>{u.consultations_remaining ?? 0} disponibles</span>
                        </div>
                      </td>
                      <td>
                        <div className="clinic-admin-row-actions">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => openConsultationHistory(u)}
                            title="Ver historial de consultas"
                          >
                            <ClipboardList size={14} aria-hidden />
                            Historial
                          </Button>
                          {u.cedula_document_url && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openCedulaPreview(u)}
                              title="Ver documento profesional"
                            >
                              <Eye size={14} aria-hidden />
                              Ver
                            </Button>
                          )}
                          {(u.profesional_pais || "MX").toUpperCase() === "MX" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={busy || !u.cedula_profesional}
                              onClick={() => handleVerifyCedula(u)}
                              title="Intentar validación automática SEP (México)"
                            >
                              <RefreshCw size={14} aria-hidden />
                              SEP
                            </Button>
                          )}
                          {cedulaStatus !== "verified" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => handleApproveCedula(u)}
                              title="Aprobar manualmente"
                            >
                              <CheckCircle size={14} aria-hidden />
                            </Button>
                          )}
                          {cedulaStatus !== "rejected" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => handleRejectCedula(u)}
                              title="Rechazar"
                            >
                              <XCircle size={14} aria-hidden />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="clinic-settings-card">
        <h2>Organizaciones / clínicas</h2>
        <div className="clinic-table-wrap">
          <table className="clinic-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Zona horaria</th>
                <th>Alta</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.timezone || "—"}</td>
                  <td>{formatRegisteredAt(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={!!cedulaPreview}
        onOpenChange={(open) => {
          if (!open) closeCedulaPreview();
        }}
      >
        <DialogContent className={clinicDialogClass("clinic-admin-cedula-preview-dialog", "max-w-4xl")}>
          {cedulaPreview && (
            <>
              <DialogHeader>
                <DialogTitle>Documento de registro profesional</DialogTitle>
                <DialogDescription className="clinic-admin-cedula-preview-meta">
                  <span className="clinic-admin-cedula-preview-meta-line">
                    {cedulaPreview.nombre || cedulaPreview.email}
                  </span>
                  {(cedulaPreview.cedula_profesional || cedulaPreview.profesional_pais) && (
                    <span className="clinic-admin-cedula-preview-meta-line clinic-muted">
                      {[
                        cedulaPreview.cedula_profesional
                          ? `Registro ${cedulaPreview.cedula_profesional}`
                          : null,
                        cedulaPreview.profesional_pais
                          ? countryLabel(cedulaPreview.profesional_pais)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="clinic-admin-cedula-preview-body">
                {cedulaPreviewLoading && (
                  <p className="clinic-muted">Cargando documento...</p>
                )}
                {!cedulaPreviewLoading && cedulaPreviewUrl && (
                  cedulaPreviewKind === "pdf" ||
                  (cedulaPreviewKind !== "image" &&
                    cedulaDocKind(cedulaPreview.cedula_document_url) === "pdf") ? (
                    <iframe
                      title={`Cédula de ${cedulaPreview.nombre || cedulaPreview.email}`}
                      src={cedulaPreviewUrl}
                      className="clinic-admin-cedula-preview-frame"
                    />
                  ) : (
                    <img
                      src={cedulaPreviewUrl}
                      alt={`Documento de cédula de ${cedulaPreview.nombre || cedulaPreview.email}`}
                      className="clinic-admin-cedula-preview-image"
                    />
                  )
                )}
              </div>
              {!cedulaPreviewLoading && cedulaPreviewUrl && (
                <div className="clinic-admin-cedula-preview-footer">
                  <a
                    href={cedulaPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="clinic-admin-link-btn"
                  >
                    <ExternalLink size={14} aria-hidden />
                    Abrir en pestaña nueva
                  </a>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!historyUser}
        onOpenChange={(open) => {
          if (!open) closeConsultationHistory();
        }}
      >
        <DialogContent className={clinicDialogClass("clinic-admin-history-dialog", "max-w-5xl")}>
          {historyUser && (
            <>
              <DialogHeader>
                <div className="clinic-admin-history-dialog-head">
                  <div>
                    <DialogTitle>Historial de consultas</DialogTitle>
                    <DialogDescription>
                      {historyUser.nombre || historyUser.email}
                      {historyUser.email && historyUser.nombre ? ` · ${historyUser.email}` : ""}
                      {!historyLoading
                        ? ` · ${historyConsultations.length} consulta${historyConsultations.length === 1 ? "" : "s"}`
                        : ""}
                    </DialogDescription>
                  </div>
                  {!historyLoading && historyConsultations.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={historyPdfLoading}
                      onClick={handleDownloadHistoryPdf}
                    >
                      <FileDown size={14} aria-hidden />
                      {historyPdfLoading ? "Generando PDF..." : "Descargar PDF completo"}
                    </Button>
                  )}
                </div>
              </DialogHeader>
              <div className="clinic-admin-history-body">
                {historyLoading && (
                  <p className="clinic-muted">Cargando historial...</p>
                )}
                {!historyLoading && historyConsultations.length === 0 && (
                  <p className="clinic-muted">Este usuario aún no tiene consultas registradas.</p>
                )}
                {!historyLoading && historyConsultations.length > 0 && (
                  <div className="clinic-admin-history-list">
                    {historyConsultations.map((c) => {
                      const patient =
                        consultationField(c, "nombre_mascota") || "Sin nombre";
                      const owner =
                        consultationField(c, "nombre_dueño") ||
                        consultationField(c, "nombre_dueno") ||
                        "—";
                      const reason = consultationField(c, "motivo_consulta") || "—";
                      const symptoms = consultationField(c, "sintomas");
                      const status = (c.status || "registered").toLowerCase();
                      const expanded = expandedConsultationId === c.id;
                      const analysis = cleanClinicalDisplayText(c.analysis || "");
                      const detailBlocks = [
                        { label: "Raza", value: consultationField(c, "raza") },
                        { label: "Edad", value: consultationField(c, "edad") },
                        { label: "Sexo", value: consultationField(c, "sexo") },
                        { label: "Peso", value: consultationField(c, "peso") },
                        { label: "Motivo", value: reason !== "—" ? reason : "" },
                        { label: "Síntomas", value: symptoms },
                        {
                          label: "Detalle de la mascota",
                          value: c.detalle_paciente || consultationField(c, "detalle_paciente"),
                        },
                        { label: "Notas", value: c.notas_adicionales },
                      ].filter((block) => block.value);

                      return (
                        <div
                          key={c.id}
                          className={`clinic-admin-history-item${expanded ? " is-expanded" : ""}`}
                        >
                          <button
                            type="button"
                            className="clinic-admin-history-item-head"
                            onClick={() =>
                              setExpandedConsultationId(expanded ? null : c.id)
                            }
                          >
                            <div className="clinic-admin-history-item-main">
                              <span className="clinic-mono clinic-admin-history-id">
                                {formatConsultationId(c)}
                              </span>
                              <strong>{patient}</strong>
                              <span className="clinic-muted">
                                {formatCategoryLabel(c.category || c.especie)}
                              </span>
                            </div>
                            <div className="clinic-admin-history-item-meta">
                              <span className="clinic-admin-history-date">
                                {formatDateTime(c.created_at)}
                              </span>
                              <span
                                className={`clinic-admin-consult-status ${consultationStatusClass(status)}`}
                              >
                                {formatConsultationStatus(status)}
                              </span>
                              {c.rating ? (
                                <span className="clinic-muted">{c.rating}/5</span>
                              ) : null}
                              {expanded ? (
                                <ChevronUp size={16} aria-hidden />
                              ) : (
                                <ChevronDown size={16} aria-hidden />
                              )}
                            </div>
                          </button>
                          {expanded && (
                            <div className="clinic-admin-history-item-detail">
                              <div className="clinic-admin-history-detail-grid">
                                <div>
                                  <span className="clinic-admin-history-detail-label">
                                    Propietario
                                  </span>
                                  <span>{owner}</span>
                                </div>
                                {detailBlocks.map((block) => (
                                  <div key={block.label}>
                                    <span className="clinic-admin-history-detail-label">
                                      {block.label}
                                    </span>
                                    <span>{block.value}</span>
                                  </div>
                                ))}
                              </div>
                              {analysis ? (
                                <div className="clinic-admin-history-analysis">
                                  <span className="clinic-admin-history-detail-label">
                                    Análisis clínico
                                  </span>
                                  <pre className="clinic-admin-history-analysis-text">
                                    {analysis}
                                  </pre>
                                </div>
                              ) : (
                                <p className="clinic-muted clinic-admin-history-no-analysis">
                                  {status === "completed"
                                    ? "Consulta completada sin análisis registrado."
                                    : "Consulta sin análisis clínico todavía."}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) closeSupportTicket();
        }}
      >
        <DialogContent className={clinicDialogClass("clinic-admin-support-dialog", "max-w-2xl")}>
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  {selectedTicket.user_name || selectedTicket.user_email}
                  {selectedTicket.user_email ? ` · ${selectedTicket.user_email}` : ""}
                  {selectedTicket.context_view ? ` · Vista: ${selectedTicket.context_view}` : ""}
                </DialogDescription>
              </DialogHeader>
              {ticketActing && !ticketDetail && (
                <p className="clinic-muted">Cargando conversación...</p>
              )}
              {ticketDetail && (
                <>
                  <div className="clinic-admin-support-actions">
                    <span className={`clinic-admin-support-status status-${ticketDetail.status}`}>
                      {SUPPORT_STATUS_LABELS[ticketDetail.status] || ticketDetail.status}
                    </span>
                    <select
                      className="clinic-admin-support-select"
                      value={ticketDetail.status}
                      disabled={ticketActing}
                      onChange={(e) => handleTicketStatusChange(e.target.value)}
                    >
                      {Object.entries(SUPPORT_STATUS_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="clinic-admin-support-thread">
                    {(ticketDetail.messages || []).map((msg) => (
                      <div
                        key={msg.id}
                        className={`clinic-admin-support-msg role-${msg.author_role}`}
                      >
                        <div className="clinic-admin-support-msg-meta">
                          {msg.author_role === "admin"
                            ? "Soporte GUIAA"
                            : msg.author_role === "assistant"
                              ? "Asistente"
                              : "Usuario"}
                          · {formatDateTime(msg.created_at)}
                        </div>
                        <pre className="clinic-admin-support-msg-body">{msg.body}</pre>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleTicketReply} className="clinic-admin-support-reply">
                    <Label htmlFor="ticket-reply">Responder al usuario</Label>
                    <textarea
                      id="ticket-reply"
                      className="clinic-admin-support-textarea"
                      rows={4}
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      maxLength={4000}
                    />
                    <Button type="submit" disabled={ticketActing || !ticketReply.trim()}>
                      Enviar respuesta
                    </Button>
                  </form>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedLead}
        onOpenChange={(open) => {
          if (!open) closeGuiaLead();
        }}
      >
        <DialogContent className={clinicDialogClass("clinic-admin-lead-dialog", "max-w-lg")}>
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedLead.name}</DialogTitle>
                <DialogDescription>
                  Solicitud ADSGuiaa · {formatDateTime(selectedLead.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="clinic-admin-support-actions">
                <span className={`clinic-admin-support-status status-${selectedLead.status}`}>
                  {LEAD_STATUS_LABELS[selectedLead.status] || selectedLead.status}
                </span>
                <select
                  className="clinic-admin-support-select"
                  value={selectedLead.status}
                  disabled={leadActing}
                  onChange={(e) => handleLeadStatusChange(e.target.value)}
                >
                  {Object.entries(LEAD_STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="clinic-admin-lead-detail">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a>
                </p>
                <p>
                  <strong>Teléfono:</strong> {selectedLead.phone || "—"}
                </p>
                <p>
                  <strong>Mensaje:</strong>
                </p>
                <pre className="clinic-admin-support-msg-body">
                  {selectedLead.message || "(sin mensaje adicional)"}
                </pre>
              </div>

              <form onSubmit={handleLeadNotesSave} className="clinic-admin-support-reply">
                <Label htmlFor="lead-notes">Notas internas (Admin GUIAA)</Label>
                <textarea
                  id="lead-notes"
                  className="clinic-admin-support-textarea"
                  rows={3}
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="Seguimiento, llamada programada, etc."
                  maxLength={2000}
                />
                <Button type="submit" disabled={leadActing}>
                  Guardar notas
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!selectedSurvey}
        onOpenChange={(open) => {
          if (!open) setSelectedSurvey(null);
        }}
      >
        <DialogContent className={clinicDialogClass("clinic-admin-lead-dialog", "max-w-lg")}>
          {selectedSurvey && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSurvey.nombre || selectedSurvey.email}</DialogTitle>
                <DialogDescription>
                  Encuesta post-prueba · {formatDateTime(selectedSurvey.completed_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="clinic-admin-lead-detail">
                <p>
                  <strong>Email:</strong>{" "}
                  {selectedSurvey.email ? (
                    <a href={`mailto:${selectedSurvey.email}`}>{selectedSurvey.email}</a>
                  ) : (
                    "—"
                  )}
                </p>
                <p>
                  <strong>Calificación:</strong>{" "}
                  <span className="clinic-admin-trial-survey-stars">
                    {renderTrialSurveyStars(selectedSurvey.rating)}
                  </span>{" "}
                  ({formatTrialSurveyRating(selectedSurvey.rating)})
                </p>
                <p>
                  <strong>Plan actual:</strong> {formatPlanLabel(selectedSurvey)}
                </p>
                <p>
                  <strong>Comentario:</strong>
                </p>
                <pre className="clinic-admin-support-msg-body">
                  {selectedSurvey.comment || "(sin comentario)"}
                </pre>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog {...dialogProps} />
    </div>
  );
}
