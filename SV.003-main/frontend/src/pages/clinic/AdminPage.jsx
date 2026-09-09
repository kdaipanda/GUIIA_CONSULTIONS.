import React, { useCallback, useEffect, useRef, useState } from "react";
import { Shield, Trash2, CheckCircle, XCircle, RefreshCw, ExternalLink, Eye, ClipboardList, ChevronDown, ChevronUp, FileDown, MessageSquare, Users, Building2, Gem, PawPrint, Inbox, Star, Stethoscope, Circle, MessageCircle } from "lucide-react";
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
  fetchAdminWhatsappPromo,
  ensureAdminWhatsappPromoImage,
} from "../../lib/clinicApi";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { useTranslation } from "react-i18next";
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
import i18n from "../../i18n";

const PLAN_FILTER_IDS = ["all", "trial", "paid"];
const PRESENCE_FILTER_IDS = ["all", "online", "offline"];
const SUPPORT_FILTER_IDS = ["", "open", "in_progress", "resolved", "closed"];
const LEAD_FILTER_IDS = ["", "new", "contacted", "closed"];

function clinicT(key, options) {
  return i18n.t(key, { ns: "clinic", ...options });
}

function formatCedulaStatus(status) {
  const key = (status || "unsubmitted").toLowerCase();
  const map = {
    unsubmitted: "admin.cedulaUnsubmitted",
    pending: "admin.cedulaPending",
    verified: "admin.cedulaVerified",
    rejected: "admin.cedulaRejected",
  };
  return map[key] ? clinicT(map[key]) : key;
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
  const planMap = {
    basic: "admin.planBasic",
    professional: "admin.planProfessional",
    premium: "admin.planPremium",
    trial: "admin.planTrial",
  };
  if (type && planMap[type]) return clinicT(planMap[type]);
  if (!type) {
    const remaining = user.consultations_remaining ?? 0;
    return remaining > 0 ? clinicT("admin.planTrialNoPlan") : clinicT("admin.planNone");
  }
  return user.membership_type;
}

function formatOrgRole(role) {
  const map = {
    owner: "admin.roleOwner",
    admin: "admin.roleAdmin",
    veterinarian: "admin.roleVeterinarian",
    receptionist: "admin.roleReceptionist",
  };
  return map[role] ? clinicT(map[role]) : role || "—";
}

function supportStatusLabel(status) {
  const map = {
    open: "admin.ticketOpen",
    in_progress: "admin.ticketInProgress",
    resolved: "admin.ticketResolved",
    closed: "admin.ticketClosed",
  };
  return map[status] ? clinicT(map[status]) : status;
}

function leadStatusLabel(status) {
  const map = {
    new: "admin.leadNew",
    contacted: "admin.leadContacted",
    closed: "admin.leadClosed",
  };
  return map[status] ? clinicT(map[status]) : status;
}

function formatRegisteredAt(iso, locale = "es-MX") {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLastSeen(iso) {
  if (!iso) return i18n.t("admin.noActivity", { ns: "clinic" });
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return i18n.t("admin.noActivity", { ns: "clinic" });
  const locale = i18n.language?.startsWith("en") ? "en-US" : "es-MX";
  return dt.toLocaleString(locale, {
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

function formatConsultationStatus(status) {
  const key = (status || "registered").toLowerCase();
  const map = {
    completed: "consultationStatus.completed",
    in_progress: "consultationStatus.in_progress",
    draft: "consultationStatus.draft",
    registered: "admin.consultRegistered",
  };
  return i18n.t(map[key] || key, { ns: "clinic", defaultValue: key });
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
  const { t, i18n } = useTranslation("clinic");
  const locale = (i18n.language || "en").startsWith("es") ? "es-MX" : "en-US";
  const { veterinarian, loading: vetLoading, platformAdmin } = useVet();

  const PLAN_FILTERS = [
    { id: "all", label: t("admin.filterAll") },
    { id: "trial", label: t("admin.filterTrial") },
    { id: "paid", label: t("admin.filterPaid") },
  ];
  const PRESENCE_FILTERS = [
    { id: "all", label: t("admin.presenceAll") },
    { id: "online", label: t("admin.presenceOnline") },
    { id: "offline", label: t("admin.presenceOffline") },
  ];
  const SUPPORT_FILTERS = [
    { id: "", label: t("admin.filterAll") },
    { id: "open", label: t("admin.supportOpen") },
    { id: "in_progress", label: t("admin.supportInProgress") },
    { id: "resolved", label: t("admin.supportResolved") },
    { id: "closed", label: t("admin.supportClosed") },
  ];
  const LEAD_FILTERS = [
    { id: "", label: t("admin.leadsAll") },
    { id: "new", label: t("admin.leadsNew") },
    { id: "contacted", label: t("admin.leadsContacted") },
    { id: "closed", label: t("admin.leadsClosed") },
  ];
  const SUPPORT_STATUS_ENTRIES = [
    ["open", t("admin.ticketOpen")],
    ["in_progress", t("admin.ticketInProgress")],
    ["resolved", t("admin.ticketResolved")],
    ["closed", t("admin.ticketClosed")],
  ];
  const LEAD_STATUS_ENTRIES = [
    ["new", t("admin.leadNew")],
    ["contacted", t("admin.leadContacted")],
    ["closed", t("admin.leadClosed")],
  ];
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
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTruncated, setHistoryTruncated] = useState(false);
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
  const [waPromo, setWaPromo] = useState(null);
  const [waPromoLoading, setWaPromoLoading] = useState(false);
  const [waPromoActing, setWaPromoActing] = useState(false);
  const [waOpenedIds, setWaOpenedIds] = useState(() => new Set());
  const loadSeqRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

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
    const seq = ++loadSeqRef.current;
    const isStale = () => seq !== loadSeqRef.current;

    // Skeleton completo solo en la primera carga; luego loading indica “actualizando…”
    if (!soft) {
      setLoading(true);
      if (!hasLoadedOnceRef.current) setLoadError("");
    }
    try {
      let allowedUser = platformAdmin;
      if (!allowedUser) {
        const access = await fetchAdminAccess(veterinarian.id);
        if (isStale()) return;
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
      if (isStale()) return;

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
      setAllowed(true);
      hasLoadedOnceRef.current = true;

      if (soft) {
        return;
      }

      setSupportLoading(true);
      setGuiaLeadsLoading(true);
      setTrialSurveysLoading(true);
      setWaPromoLoading(true);

      const [supportResult, leadsResult, surveysResult, promoResult] = await Promise.allSettled([
        fetchAdminSupportTickets(veterinarian.id, supportFilter),
        fetchAdminGuiaConsultasLeads(veterinarian.id, guiaLeadFilter),
        fetchAdminTrialSurveys(veterinarian.id, trialSurveySearch),
        fetchAdminWhatsappPromo(veterinarian.id),
      ]);

      if (!isStale()) {
        if (supportResult.status === "fulfilled") {
          setSupportTickets(supportResult.value.tickets || []);
          setSupportOpenCount(supportResult.value.open_count ?? 0);
        } else {
          setSupportTickets([]);
          setSupportOpenCount(0);
        }

        if (leadsResult.status === "fulfilled") {
          setGuiaLeads(leadsResult.value.leads || []);
          setGuiaLeadsNewCount(leadsResult.value.new_count ?? 0);
        } else {
          setGuiaLeads([]);
          setGuiaLeadsNewCount(0);
        }

        if (surveysResult.status === "fulfilled") {
          setTrialSurveys(surveysResult.value.surveys || []);
          setTrialSurveysCount(
            surveysResult.value.count ?? surveysResult.value.surveys?.length ?? 0,
          );
        } else {
          setTrialSurveys([]);
          setTrialSurveysCount(0);
        }

        setWaPromo(promoResult.status === "fulfilled" ? promoResult.value : null);
        setSupportLoading(false);
        setGuiaLeadsLoading(false);
        setTrialSurveysLoading(false);
        setWaPromoLoading(false);
      }
    } catch (err) {
      if (isStale()) return;
      const message = err.message || t("admin.loadPanelError");
      // Soft refresh: no tumbar el panel ni spamear toasts cada 30s
      if (soft && hasLoadedOnceRef.current) {
        console.warn("[admin] soft refresh failed:", message);
        return;
      }
      setLoadError(message);
      notifyError(message);
      if (!hasLoadedOnceRef.current) {
        setAllowed(false);
      }
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [veterinarian?.id, search, planFilter, presenceFilter, supportFilter, guiaLeadFilter, trialSurveySearch, platformAdmin, t]);

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
      title: t("admin.deleteUserTitle"),
      description: t("admin.deleteUserDesc", { email: deleteEmail }),
      confirmLabel: t("admin.deleteUser"),
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
      notifySuccess((data.message || t("admin.deleteUserSuccess")) + summary);
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
        notifyError(t("admin.lookupExists", { name: data.nombre || data.email, id: data.id }));
      } else {
        notifySuccess(t("admin.lookupMissing", { email: deleteEmail.trim() }));
      }
    } catch (err) {
      notifyError(err.message);
    } finally {
      setActing(false);
    }
  };

  const handleVerifyCedula = async (user) => {
    const ok = await confirm({
      title: t("admin.sepTitle"),
      description: t("admin.sepDesc", { name: user.nombre }),
      confirmLabel: t("admin.sepConfirm"),
    });
    if (!ok) return;
    setCedulaActingId(user.id);
    try {
      const data = await adminVerifyUserCedula(veterinarian.id, user.id);
      notifySuccess(data.message || t("admin.sepSuccess"));
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCedulaActingId(null);
    }
  };

  const handleApproveCedula = async (user) => {
    const ok = await confirm({
      title: t("admin.approveTitle"),
      description: t("admin.approveDesc", { name: user.nombre }),
      confirmLabel: t("admin.approveConfirm"),
    });
    if (!ok) return;
    setCedulaActingId(user.id);
    try {
      const data = await adminReviewUserCedula(veterinarian.id, user.id, "approve");
      notifySuccess(data.message || t("admin.approveSuccess"));
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCedulaActingId(null);
    }
  };

  const handleRejectCedula = async (user) => {
    const note = window.prompt(t("admin.rejectPrompt", { name: user.nombre }), "");
    if (note === null) return;
    setCedulaActingId(user.id);
    try {
      const data = await adminReviewUserCedula(veterinarian.id, user.id, "reject", note);
      notifySuccess(data.message || t("admin.rejectSuccess"));
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCedulaActingId(null);
    }
  };

  const openWhatsappPromo = (recipient) => {
    const url = recipient?.whatsapp_url || recipient?.whatsapp_promo_url;
    if (!url) {
      notifyError(t("admin.whatsappInvalid"));
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    const id = recipient.id || recipient.email;
    if (id) {
      setWaOpenedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }
  };

  const copyWhatsappMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text || waPromo?.message_template || "");
      notifySuccess(t("admin.waCopied"));
    } catch {
      notifyError(t("admin.waCopyError"));
    }
  };

  const ensureWhatsappImage = async () => {
    if (!veterinarian?.id) return;
    setWaPromoActing(true);
    try {
      const data = await ensureAdminWhatsappPromoImage(veterinarian.id);
      setWaPromo((prev) => (prev ? { ...prev, image_url: data.image_url || prev.image_url } : prev));
      notifySuccess(t("admin.waImageReady"));
    } catch (err) {
      notifyError(err.message || t("admin.waImageError"));
    } finally {
      setWaPromoActing(false);
    }
  };

  const openConsultationHistory = async (user) => {
    setHistoryUser(user);
    setHistoryConsultations([]);
    setHistoryTotal(user.consultations_used ?? 0);
    setHistoryTruncated(false);
    setHistoryLoading(true);
    try {
      const data = await fetchAdminUserConsultations(veterinarian.id, user.id, 500);
      setHistoryConsultations(data.consultations || []);
      setHistoryTotal(
        data.total ?? data.count ?? data.consultations?.length ?? user.consultations_used ?? 0,
      );
      setHistoryTruncated(!!data.truncated);
      const nextUsed = typeof data.total === "number" ? data.total : user.consultations_used;
      const nextRemaining = data.user?.consultations_remaining ?? user.consultations_remaining;
      const nextUnlimited = data.user?.consultations_unlimited ?? user.consultations_unlimited;
      setUsers((prev) =>
        prev.map((row) =>
          row.id === user.id
            ? {
                ...row,
                consultations_used: nextUsed,
                consultations_remaining: nextRemaining,
                consultations_unlimited: nextUnlimited,
              }
            : row,
        ),
      );
      setHistoryUser((prev) =>
        prev && prev.id === user.id
          ? {
              ...prev,
              consultations_used: nextUsed,
              consultations_remaining: nextRemaining,
              consultations_unlimited: nextUnlimited,
            }
          : prev,
      );
    } catch (err) {
      notifyError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeConsultationHistory = () => {
    setHistoryUser(null);
    setHistoryConsultations([]);
    setHistoryTotal(0);
    setHistoryTruncated(false);
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
      notifyError(err.message || t("admin.pdfError"));
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
      notifySuccess(t("admin.ticketUpdated"));
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
      notifySuccess(t("admin.replySent"));
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
      notifySuccess(t("admin.statusUpdated"));
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
      notifySuccess(t("admin.notesSaved"));
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLeadActing(false);
    }
  };

  const showSkeleton =
    vetLoading ||
    (loading && !hasLoadedOnceRef.current) ||
    (allowed === null && !!veterinarian?.id && !hasLoadedOnceRef.current);

  if (showSkeleton) {
    return (
      <div className="clinic-page clinic-page-guiaa clinic-admin-page clinic-admin-page-guiaa">
        <div className="clinic-page-header">
          <div>
            <p className="clinic-page-eyebrow">{t("admin.eyebrow")}</p>
            <h1>
              <Shield size={22} aria-hidden />
              {t("admin.title")}
            </h1>
            <p>{t("admin.lead")}</p>
          </div>
        </div>
        {loadError ? (
          <ClinicEmptyState
            icon={Shield}
            title={t("admin.loadError")}
            description={loadError}
            actionLabel={t("admin.retry")}
            onAction={load}
          />
        ) : (
          <>
            <ClinicReportsSkeleton />
            <div className="clinic-admin-skeleton-block">
              <ClinicTableSkeleton rows={8} cols={5} />
            </div>
            <p className="clinic-muted clinic-admin-loading-hint">
              {t("admin.loadingHint")}
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
            <p className="clinic-page-eyebrow">{t("admin.eyebrow")}</p>
            <h1>
              <Shield size={22} aria-hidden />
              {t("admin.title")}
            </h1>
            <p>{t("admin.restrictedLead")}</p>
          </div>
        </div>
        <ClinicEmptyState
          icon={Shield}
          title={t("admin.noAccessTitle")}
          description={t("admin.noAccessDesc")}
        />
      </div>
    );
  }

  const stats = overview || {};

  return (
    <div className="clinic-page clinic-page-guiaa clinic-admin-page clinic-admin-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">{t("admin.eyebrow")}</p>
          <h1>
            <Shield size={22} aria-hidden />
            {t("admin.title")}
          </h1>
          <p>{t("admin.leadProfiles")}</p>
        </div>
      </div>

      <div className="clinic-report-kpi-grid">
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Users size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiUsers")}</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.users_total ?? 0}</div>
        </div>
        <div className="clinic-report-kpi clinic-admin-kpi-online">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Circle size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiOnline")}</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.users_online ?? 0}</div>
        </div>
        <div className="clinic-report-kpi clinic-admin-kpi-offline">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Circle size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiOffline")}</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.users_offline ?? 0}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Building2 size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiClinics")}</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.organizations_total ?? 0}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Gem size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiPremium")}</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.premium_users ?? 0}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><PawPrint size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiPets")}</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.patients_total ?? 0}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Stethoscope size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiCdsUsed")}</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.consultations_total ?? 0}</div>
          {stats.consultations_by_registered_users != null &&
            stats.consultations_by_registered_users !== stats.consultations_total && (
              <div className="clinic-muted clinic-admin-kpi-sub">
                {t("admin.kpiCdsFromCurrent", { count: stats.consultations_by_registered_users })}
              </div>
            )}
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><MessageSquare size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiSupportOpen")}</span>
          </div>
          <div className="clinic-report-kpi-value">{supportOpenCount}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Inbox size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiAdsGuiaa")}</span>
          </div>
          <div className="clinic-report-kpi-value">{guiaLeadsNewCount}</div>
        </div>
        <div className="clinic-report-kpi">
          <div className="clinic-report-kpi-head">
            <span className="clinic-report-kpi-icon"><Star size={18} aria-hidden /></span>
            <span className="clinic-report-kpi-label">{t("admin.kpiTrialSurveys")}</span>
          </div>
          <div className="clinic-report-kpi-value">{stats.trial_surveys_total ?? trialSurveysCount}</div>
        </div>
      </div>

      <section className="clinic-settings-card">
        <div className="clinic-admin-users-head">
          <h2>
            <Star size={18} aria-hidden />
            {t("admin.surveysTitle")}
          </h2>
          <span className="clinic-admin-users-count">{t("admin.surveysCount", { count: trialSurveysCount })}</span>
        </div>
        <p className="clinic-muted clinic-tools-desc">
          {t("admin.surveysLead")}
        </p>
        <div className="clinic-admin-users-toolbar">
          <div className="clinic-search clinic-admin-search">
            <Input
              placeholder={t("admin.surveysSearch")}
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
            title={t("admin.surveysEmptyTitle")}
            description={t("admin.surveysEmptyDesc")}
          />
        ) : (
          <div className="clinic-table-wrap">
            <table className="clinic-table clinic-admin-support-table">
              <thead>
                <tr>
                  <th>{t("admin.colDate")}</th>
                  <th>{t("admin.colUser")}</th>
                  <th>{t("admin.colRating")}</th>
                  <th>{t("admin.colComment")}</th>
                  <th>{t("admin.colCurrentPlan")}</th>
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
            {t("admin.adsTitle")}
          </h2>
          <span className="clinic-admin-users-count">{t("admin.adsCount", { count: guiaLeads.length })}</span>
        </div>
        <p className="clinic-muted clinic-tools-desc">
          {t("admin.adsLead")}
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
            title={t("admin.adsEmptyTitle")}
            description={t("admin.adsEmptyDesc")}
          />
        ) : (
          <div className="clinic-table-wrap">
            <table className="clinic-table clinic-admin-support-table">
              <thead>
                <tr>
                  <th>{t("admin.colDate")}</th>
                  <th>{t("admin.colName")}</th>
                  <th>{t("admin.colContact")}</th>
                  <th>{t("admin.colMessage")}</th>
                  <th>{t("admin.colStatus")}</th>
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
                        {leadStatusLabel(lead.status)}
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
            title={t("admin.supportEmptyTitle")}
            description={t("admin.supportEmptyDesc")}
          />
        ) : (
          <div className="clinic-table-wrap">
            <table className="clinic-table clinic-admin-support-table">
              <thead>
                <tr>
                  <th>{t("admin.colDate")}</th>
                  <th>{t("admin.colUser")}</th>
                  <th>{t("admin.colSubject")}</th>
                  <th>{t("admin.colStatus")}</th>
                  <th>{t("admin.colPriority")}</th>
                </tr>
              </thead>
              <tbody>
                {supportTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="clinic-admin-support-row"
                    onClick={() => openSupportTicket(ticket)}
                  >
                    <td className="clinic-admin-history-date">
                      {formatDateTime(ticket.created_at)}
                    </td>
                    <td>
                      <div>{ticket.user_name || "—"}</div>
                      <div className="clinic-muted clinic-admin-support-email">{ticket.user_email}</div>
                    </td>
                    <td>{ticket.subject}</td>
                    <td>
                      <span className={`clinic-admin-support-status status-${ticket.status}`}>
                        {supportStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td>{ticket.priority === "high" ? "Alta" : "Normal"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="clinic-settings-card clinic-admin-whatsapp-promo">
        <div className="clinic-admin-users-head">
          <h2>
            <MessageCircle size={18} aria-hidden />
            {" "}
            Oferta WhatsApp · FRIENDS40
          </h2>
          <span className="clinic-muted clinic-admin-users-count">
            {waPromoLoading
              ? t("admin.loadingShort")
              : `${waPromo?.with_whatsapp ?? 0} con WhatsApp · ${waPromo?.without_whatsapp ?? 0} sin número`}
          </span>
        </div>
        <p className="clinic-muted clinic-tools-desc">
          Abre un chat de WhatsApp con el recordatorio del cupón. Adjunta la imagen de la oferta
          en el chat (WhatsApp Web / móvil). No envía mensajes masivos automáticos.
        </p>
        <div className="clinic-admin-wa-layout">
          <div className="clinic-admin-wa-preview">
            <img
              src={waPromo?.image_url || "/email/oferta-friends40-whatsapp.png"}
              alt="Oferta GUIAA Plan Premium cupón FRIENDS40"
              width={280}
              height={280}
            />
            <div className="clinic-admin-wa-preview-actions">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => copyWhatsappMessage(waPromo?.message_template)}
                disabled={!waPromo?.message_template}
              >
                Copiar mensaje
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                asChild
              >
                <a
                  href={waPromo?.image_url || "/email/oferta-friends40-whatsapp.png"}
                  download="oferta-friends40-whatsapp.png"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileDown size={14} aria-hidden />
                  Descargar imagen
                </a>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={waPromoActing}
                onClick={ensureWhatsappImage}
              >
                Preparar imagen CDN
              </Button>
            </div>
          </div>
          <div className="clinic-table-wrap clinic-admin-wa-table-wrap">
            {waPromoLoading ? (
              <ClinicTableSkeleton rows={4} cols={4} />
            ) : !waPromo?.recipients?.length ? (
              <p className="clinic-muted">{t("admin.campaignEmpty")}</p>
            ) : (
              <table className="clinic-table">
                <thead>
                  <tr>
                    <th>{t("admin.colName")}</th>
                    <th>{t("admin.colWhatsapp")}</th>
                    <th>{t("admin.colEmail")}</th>
                    <th>{t("admin.colAction")}</th>
                  </tr>
                </thead>
                <tbody>
                  {waPromo.recipients.map((r) => {
                    const opened = waOpenedIds.has(r.id) || waOpenedIds.has(r.email);
                    return (
                      <tr key={r.id || r.email} className={opened ? "clinic-admin-wa-row-opened" : undefined}>
                        <td>{r.nombre}</td>
                        <td className="clinic-mono">
                          {r.has_whatsapp ? `+${r.whatsapp_number}` : (
                            <span className="clinic-muted">{r.telefono || t("admin.noPhone")}</span>
                          )}
                        </td>
                        <td>{r.email}</td>
                        <td>
                          <Button
                            type="button"
                            size="sm"
                            variant={opened ? "secondary" : "default"}
                            disabled={!r.has_whatsapp}
                            onClick={() => openWhatsappPromo(r)}
                            title={r.has_whatsapp ? t("admin.openWhatsapp") : t("admin.noValidNumber")}
                          >
                            <MessageCircle size={14} aria-hidden />
                            {opened ? "Reabrir" : "WhatsApp"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <section className="clinic-settings-card">
        <h2>{t("admin.actionsTitle")}</h2>
        <p className="clinic-muted clinic-tools-desc">
          {t("admin.actionsLead")}
        </p>
        <div className="clinic-admin-actions">
          <form onSubmit={handleDeleteUser} className="clinic-admin-delete-form">
            <div className="form-group">
              <Label htmlFor="delete-email">{t("admin.deleteByEmail")}</Label>
              <Input
                id="delete-email"
                type="email"
                placeholder={t("admin.deleteEmailPlaceholder")}
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
              />
            </div>
            <Button type="button" variant="secondary" disabled={acting || !deleteEmail.trim()} onClick={handleLookupUser}>
              {t("admin.verifyEmail")}
            </Button>
            <Button type="submit" variant="secondary" disabled={acting || !deleteEmail.trim()}>
              <Trash2 size={16} aria-hidden />
              {t("admin.deleteUser")}
            </Button>
          </form>
        </div>
      </section>

      <section className="clinic-settings-card">
        <div className="clinic-admin-users-head">
          <h2>{t("admin.usersTitle")}</h2>
          <span className="clinic-muted clinic-admin-users-count">
            {t(usersTotalMatching === 1 ? "admin.usersMatches" : "admin.usersMatches_plural", {
              count: usersTotalMatching,
            })}
            {" · "}
            {t("admin.usersRegisteredTotal", { count: usersTotalRegistered })}
            {userCount !== usersTotalMatching
              ? ` · ${t("admin.usersShowing", { count: userCount })}`
              : ""}
            {loading && hasLoadedOnceRef.current ? ` · ${t("admin.usersUpdating")}` : ""}
          </span>
        </div>
        <div className="clinic-admin-users-toolbar">
          <div className="clinic-search clinic-admin-search">
            <Input
              placeholder={t("admin.usersSearch")}
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
          <div className="clinic-admin-plan-filters" aria-label={t("admin.presenceFilterAria")}>
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
                <th>{t("admin.colPresence")}</th>
                <th>{t("admin.colName")}</th>
                <th>{t("admin.colEmail")}</th>
                <th>{t("admin.colRegistered")}</th>
                <th>{t("admin.colCountry")}</th>
                <th>{t("admin.colLicense")}</th>
                <th>{t("admin.colStatus")}</th>
                <th>{t("admin.colPlan")}</th>
                <th>{t("admin.colTeam")}</th>
                <th>{t("admin.colUsage")}</th>
                <th>{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="clinic-muted" style={{ textAlign: "center" }}>
                    {t("admin.usersEmptyFilter")}
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
                            <strong>{online ? t("admin.online") : t("admin.offline")}</strong>
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
                        {u.membership_source === "organization" ? (
                          <div className="clinic-muted clinic-admin-team-plan-note">
                            {t("admin.teamSharedPlan")}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {u.team_shared ? (
                          <div className="clinic-admin-team-cell">
                            <span className="clinic-admin-team-badge">{t("admin.teamShared")}</span>
                            <strong>{formatOrgRole(u.org_role)}</strong>
                            <span className="clinic-muted">
                              {u.organization_name || t("admin.teamOrgFallback")}
                            </span>
                            <span className="clinic-muted">
                              {t("admin.teamMembersCount", { count: u.team_member_count || 0 })}
                            </span>
                            {u.org_role !== "owner" && (u.membership_owner_nombre || u.membership_owner_email) ? (
                              <span className="clinic-muted">
                                {t("admin.teamQuotaOwner", {
                                  name: u.membership_owner_nombre || u.membership_owner_email,
                                })}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="clinic-muted">{t("admin.teamSolo")}</span>
                        )}
                      </td>
                      <td>
                        <div
                          className="clinic-admin-consultation-usage"
                          aria-label={`${u.consultations_used ?? 0} consultas usadas; ${
                            u.consultations_unlimited
                              ? "ilimitadas"
                              : `${u.consultations_remaining ?? 0} disponibles`
                          }`}
                        >
                          <strong>{u.consultations_used ?? 0} usadas</strong>
                          <span>
                            {u.consultations_unlimited
                              ? "Ilimitadas"
                              : `${u.consultations_remaining ?? 0} disponibles`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="clinic-admin-row-actions">
                          {u.whatsapp_promo_url && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openWhatsappPromo(u)}
                              title={t("admin.remindOffer")}
                            >
                              <MessageCircle size={14} aria-hidden />
                              WA
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => openConsultationHistory(u)}
                            title={t("admin.viewHistory")}
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
                              title={t("admin.viewLicenseDoc")}
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
                              title={t("admin.trySep")}
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
                              title={t("admin.approveManualTitle")}
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
        <h2>{t("admin.orgsTitle")}</h2>
        <div className="clinic-table-wrap">
          <table className="clinic-table">
            <thead>
              <tr>
                <th>{t("admin.colName")}</th>
                <th>{t("admin.colTeam")}</th>
                <th>{t("admin.colOwner")}</th>
                <th>{t("admin.colTimezone")}</th>
                <th>{t("admin.colJoined")}</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>
                    {o.team_shared ? (
                      <div className="clinic-admin-team-cell">
                        <span className="clinic-admin-team-badge">{t("admin.teamShared")}</span>
                        <span className="clinic-muted">
                          {t("admin.teamMembersCount", { count: o.member_count || 0 })}
                        </span>
                      </div>
                    ) : (
                      <span className="clinic-muted">
                        {t("admin.teamMembersCount", { count: o.member_count || 1 })}
                      </span>
                    )}
                  </td>
                  <td>
                    <div>{o.owner_nombre || "—"}</div>
                    <div className="clinic-muted">{o.owner_email || ""}</div>
                  </td>
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
                        ? ` · ${historyTotal} consulta${historyTotal === 1 ? "" : "s"} usada${historyTotal === 1 ? "" : "s"}`
                        : ""}
                      {!historyLoading && historyUser.consultations_unlimited
                        ? " · cupo ilimitado"
                        : !historyLoading && historyUser.consultations_remaining != null
                          ? ` · ${historyUser.consultations_remaining} disponible${historyUser.consultations_remaining === 1 ? "" : "s"}`
                          : ""}
                      {!historyLoading && historyTruncated
                        ? ` · mostrando ${historyConsultations.length}`
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
                      {historyPdfLoading ? t("admin.generatingPdf") : t("admin.downloadPdf")}
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
                        consultationField(c, "nombre_mascota") || t("admin.noName");
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
                          label: t("admin.petDetail"),
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
                                    ? t("admin.consultDoneNoAnalysis")
                                    : t("admin.consultNoAnalysis")}
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
                      {supportStatusLabel(ticketDetail.status)}
                    </span>
                    <select
                      className="clinic-admin-support-select"
                      value={ticketDetail.status}
                      disabled={ticketActing}
                      onChange={(e) => handleTicketStatusChange(e.target.value)}
                    >
                      {SUPPORT_STATUS_ENTRIES.map(([k, label]) => (
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
                            ? t("admin.supportGuiaa")
                            : msg.author_role === "assistant"
                              ? t("admin.assistant")
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
                      placeholder={t("admin.replyPlaceholder")}
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
                  {leadStatusLabel(selectedLead.status)}
                </span>
                <select
                  className="clinic-admin-support-select"
                  value={selectedLead.status}
                  disabled={leadActing}
                  onChange={(e) => handleLeadStatusChange(e.target.value)}
                >
                  {LEAD_STATUS_ENTRIES.map(([k, label]) => (
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
                  placeholder={t("admin.notesPlaceholder")}
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
