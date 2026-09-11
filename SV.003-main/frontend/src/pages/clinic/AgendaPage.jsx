import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Link2,
  List,
  Plus,
  Stethoscope,
  Check,
  X,
} from "lucide-react";
import { useVet } from "../../context/VetContext";
import { useClinic } from "../../context/ClinicContext";
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  fetchAppointmentRequests,
  updateAppointmentRequest,
} from "../../lib/clinicApi";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import "./agendaPage.css";
import "./clinicPageShared.css";
import { clinicDialogClass } from "../../components/clinic/ClinicPageUi";
import { ConfirmActionDialog } from "../../components/clinic/ConfirmActionDialog";
import { ModuleHelpTip } from "../../components/clinic/ModuleHelpTip";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import { useTranslation } from "react-i18next";
import {
  loadClinicRegistry,
  readClinicRegistryCache,
} from "../../lib/clinicRegistryCache";
import { clinicCacheKey, loadClinicData, readClinicDataCache } from "../../lib/clinicDataCache";
import "./helpCenterPage.css";

const APPOINTMENT_STATUS_KEYS = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

function AgendaAppointmentCard({ appointment, onEdit, statusLabel, locale, defaultPetLabel }) {
  return (
    <button
      type="button"
      className={`clinic-agenda-card status-${appointment.status}`}
      onClick={() => onEdit(appointment)}
    >
      <span className="clinic-agenda-time">
        {new Date(appointment.starts_at).toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span className="clinic-agenda-patient">
        {appointment.patients?.name || defaultPetLabel}
      </span>
      {appointment.clients?.name && (
        <span className="clinic-agenda-client">{appointment.clients.name}</span>
      )}
      {appointment.reason && (
        <span className="clinic-agenda-reason">{appointment.reason}</span>
      )}
      <span className="clinic-agenda-status">
        {statusLabel || appointment.status}
      </span>
    </button>
  );
}

function AgendaSkeleton() {
  return (
    <div className="agenda-skeleton-grid">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="agenda-skeleton-day">
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-text medium" />
          <div className="skeleton skeleton-card" />
        </div>
      ))}
    </div>
  );
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AgendaPage({ onStartConsultation }) {
  const { t, i18n } = useTranslation("clinic");
  const locale = (i18n.language || "en").startsWith("es") ? "es-MX" : "en-US";
  const statusLabel = (status) =>
    t(`appointmentStatus.${status}`, { defaultValue: status });
  const { veterinarian } = useVet();
  const { organization } = useClinic();
  const { confirm, dialogProps } = useConfirmAction();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState(() => readClinicRegistryCache(veterinarian?.id)?.patients || []);
  const [clients, setClients] = useState(() => readClinicRegistryCache(veterinarian?.id)?.clients || []);
  const [loading, setLoading] = useState(() => !readClinicRegistryCache(veterinarian?.id));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    patient_id: "",
    client_id: "",
    starts_at: "",
    ends_at: "",
    status: "scheduled",
    reason: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [approveForm, setApproveForm] = useState({ starts_at: "", ends_at: "" });
  const [approving, setApproving] = useState(false);
  const [viewMode, setViewMode] = useState("week");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setViewMode(mq.matches ? "list" : "week");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const range = useMemo(() => {
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    return { from, to };
  }, [weekStart]);

  const load = useCallback(async () => {
    if (!veterinarian?.id) {
      setLoading(false);
      return;
    }
    const cachedRegistry = readClinicRegistryCache(veterinarian.id);
    if (!cachedRegistry) setLoading(true);
    try {
      const requestsKey = clinicCacheKey(veterinarian.id, "appointment-requests", "pending");
      const [apptData, registryData, requestsData] = await Promise.all([
        fetchAppointments(veterinarian.id, range.from, range.to),
        loadClinicRegistry(veterinarian.id),
        loadClinicData(
          requestsKey,
          () => fetchAppointmentRequests(veterinarian.id, "pending"),
          { ttlMs: 45_000 },
        ).catch(() => ({ requests: [] })),
      ]);
      setAppointments(apptData.appointments || []);
      setPatients(registryData.patients || []);
      setClients(registryData.clients || []);
      setRequests(requestsData.requests || []);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id, range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const apptsByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((d) => {
      map[d.toDateString()] = [];
    });
    appointments.forEach((a) => {
      const key = new Date(a.starts_at).toDateString();
      if (map[key]) map[key].push(a);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)),
    );
    return map;
  }, [appointments, weekDays]);

  const openCreate = (day, hour = 9) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(30);
    const firstPatient = patients[0];
    setEditing(null);
    setForm({
      patient_id: firstPatient?.id || "",
      client_id: firstPatient?.client_id || "",
      starts_at: toLocalInputValue(start.toISOString()),
      ends_at: toLocalInputValue(end.toISOString()),
      status: "scheduled",
      reason: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (appt) => {
    setEditing(appt);
    setForm({
      patient_id: appt.patient_id,
      client_id: appt.client_id,
      starts_at: toLocalInputValue(appt.starts_at),
      ends_at: toLocalInputValue(appt.ends_at),
      status: appt.status,
      reason: appt.reason || "",
      notes: appt.notes || "",
    });
    setDialogOpen(true);
  };

  const onPatientChange = (patientId) => {
    const p = patients.find((x) => x.id === patientId);
    setForm((f) => ({
      ...f,
      patient_id: patientId,
      client_id: p?.client_id || f.client_id,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
    };
    try {
      if (editing) {
        await updateAppointment(veterinarian.id, editing.id, payload);
        notifySuccess(t("agenda.updated"));
      } else {
        await createAppointment(veterinarian.id, payload);
        notifySuccess(t("agenda.created"));
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const ok = await confirm({
      title: t("agenda.deleteTitle"),
      description: t("agenda.deleteDesc"),
      confirmLabel: t("agenda.deleteConfirm"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteAppointment(veterinarian.id, editing.id);
      notifySuccess(t("agenda.deleted"));
      setDialogOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleRequestAction = async (requestId, status, extra = {}) => {
    try {
      await updateAppointmentRequest(veterinarian.id, requestId, { status, ...extra });
      if (status === "approved") {
        notifySuccess(t("agenda.requestApproved"));
      } else if (status === "rejected") {
        notifySuccess(t("agenda.requestRejected"));
      }
      setApproveOpen(false);
      setApprovingRequest(null);
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const openApproveDialog = (req) => {
    let start = new Date();
    if (req.preferred_starts_at) {
      start = new Date(req.preferred_starts_at);
    } else {
      start.setDate(start.getDate() + 1);
      start.setHours(10, 0, 0, 0);
    }
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    setApprovingRequest(req);
    setApproveForm({
      starts_at: toLocalInputValue(start.toISOString()),
      ends_at: toLocalInputValue(end.toISOString()),
    });
    setApproveOpen(true);
  };

  const confirmApprove = async (e) => {
    e.preventDefault();
    if (!approvingRequest) return;
    setApproving(true);
    try {
      await handleRequestAction(approvingRequest.id, "approved", {
        starts_at: new Date(approveForm.starts_at).toISOString(),
        ends_at: new Date(approveForm.ends_at).toISOString(),
      });
    } finally {
      setApproving(false);
    }
  };

  const stats = useMemo(() => {
    const todayKey = new Date().toDateString();
    return {
      weekTotal: appointments.length,
      todayTotal: (apptsByDay[todayKey] || []).length,
      pendingRequests: requests.length,
    };
  }, [appointments.length, apptsByDay, requests.length]);

  const copyPortalLink = async () => {
    if (!organization?.id) return;
    const url = `${window.location.origin}/solicitar-cita/${organization.id}`;
    try {
      await navigator.clipboard.writeText(url);
      notifySuccess(t("agenda.portalCopied"));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      window.prompt(t("agenda.copyPrompt"), url);
    }
  };

  return (
    <div className="clinic-page clinic-page-guiaa agenda-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">{t("shell.eyebrow")}</p>
          <div className="clinic-page-title-row">
            <h1>{t("agenda.title")}</h1>
            <ModuleHelpTip topicId="agenda" />
          </div>
          <p>{t("agenda.lead")}</p>
        </div>
        <div className="clinic-agenda-nav">
          <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            {t("agenda.today")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft size={16} />
          </Button>
          <span className="clinic-agenda-range">
            {weekDays[0].toLocaleDateString(locale, { day: "numeric", month: "short" })}
            {" – "}
            {weekDays[6].toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight size={16} />
          </Button>
          <Button type="button" size="sm" onClick={() => openCreate(new Date())}>
            <Plus size={16} className="mr-1" /> {t("agenda.newAppointment")}
          </Button>
          {organization?.id && (
            <Button type="button" variant="secondary" size="sm" onClick={copyPortalLink}>
              <Link2 size={14} className="mr-1" /> {linkCopied ? t("agenda.linkCopiedShort") : t("agenda.portalOwners")}
            </Button>
          )}
        </div>
      </div>

      <div className="agenda-stats-row">
        <div className="agenda-stat-pill">
          <span className="agenda-stat-value">{stats.weekTotal}</span>
          <span className="agenda-stat-label">{t("agenda.statWeek")}</span>
        </div>
        <div className="agenda-stat-pill">
          <span className="agenda-stat-value">{stats.todayTotal}</span>
          <span className="agenda-stat-label">{t("agenda.statToday")}</span>
        </div>
        <div className="agenda-stat-pill">
          <span className="agenda-stat-value">{stats.pendingRequests}</span>
          <span className="agenda-stat-label">{t("agenda.statPendingRequests")}</span>
        </div>
      </div>

      <div className="agenda-toolbar">
        <div className="agenda-view-toggle">
          <button
            type="button"
            className={`agenda-view-btn${viewMode === "week" ? " is-active" : ""}`}
            onClick={() => setViewMode("week")}
          >
            <LayoutGrid size={15} aria-hidden />
            {t("agenda.viewWeek")}
          </button>
          <button
            type="button"
            className={`agenda-view-btn${viewMode === "list" ? " is-active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <List size={15} aria-hidden />
            {t("agenda.viewList")}
          </button>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="clinic-requests-panel">
          <h3>{t("agenda.pendingRequestsTitle", { count: requests.length })}</h3>
          <ul className="clinic-requests-list">
            {requests.map((req) => (
              <li key={req.id} className="clinic-requests-item">
                <div>
                  <strong>{req.client_name}</strong> — {req.patient_name}
                  {req.reason && <p className="clinic-muted">{req.reason}</p>}
                  {req.preferred_starts_at && (
                    <p className="clinic-muted">
                      {t("agenda.preferred")} {new Date(req.preferred_starts_at).toLocaleString(locale)}
                    </p>
                  )}
                </div>
                <div className="clinic-requests-actions">
                  <Button type="button" size="sm" onClick={() => openApproveDialog(req)}>
                    <Check size={14} className="mr-1" /> {t("agenda.approve")}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => handleRequestAction(req.id, "rejected")}>
                    <X size={14} className="mr-1" /> {t("agenda.reject")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <AgendaSkeleton />
      ) : viewMode === "list" ? (
        <div className="agenda-list-view">
          {weekDays.map((day) => {
            const key = day.toDateString();
            const dayAppts = apptsByDay[key] || [];
            const isToday = key === new Date().toDateString();
            return (
              <section
                key={key}
                className={`agenda-list-section${isToday ? " is-today" : ""}`}
              >
                <div className="agenda-list-section-head">
                  <div>
                    <strong>
                      {day.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })}
                    </strong>
                    {isToday && <span> · Hoy</span>}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => openCreate(day)}>
                    <Plus size={14} /> Añadir
                  </Button>
                </div>
                <div className="agenda-list-section-body">
                  {dayAppts.length === 0 ? (
                    <p className="clinic-agenda-empty">{t("agenda.emptyDay")}</p>
                  ) : (
                    dayAppts.map((a) => (
                      <AgendaAppointmentCard
                        key={a.id}
                        appointment={a}
                        onEdit={openEdit}
                        statusLabel={statusLabel(a.status)}
                        locale={locale}
                        defaultPetLabel={t("agenda.defaultPet")}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
      <div className="clinic-agenda-grid">
        {weekDays.map((day) => {
          const key = day.toDateString();
          const dayAppts = apptsByDay[key] || [];
          const isToday = key === new Date().toDateString();
          return (
            <div key={key} className={`clinic-agenda-day${isToday ? " today" : ""}`}>
              <div className="clinic-agenda-day-head">
                <span>{day.toLocaleDateString("es-MX", { weekday: "short" })}</span>
                <strong>{day.getDate()}</strong>
                <Button type="button" variant="ghost" size="sm" onClick={() => openCreate(day)}>
                  +
                </Button>
              </div>
              <div className="clinic-agenda-day-body">
                {dayAppts.length === 0 ? (
                  <p className="clinic-agenda-empty">{t("agenda.emptySlot")}</p>
                ) : (
                  dayAppts.map((a) => (
                    <AgendaAppointmentCard
                      key={a.id}
                      appointment={a}
                      onEdit={openEdit}
                      statusLabel={statusLabel(a.status)}
                      locale={locale}
                      defaultPetLabel={t("agenda.defaultPet")}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clinicDialogClass("max-w-md", "clinic-dialog", "clinic-agenda-dialog")}>
          <DialogHeader className="clinic-dialog-header">
            <DialogTitle>
              {editing ? t("agenda.editAppointment") : t("agenda.newAppointment")}
            </DialogTitle>
            <p className="clinic-dialog-subtitle">
              {editing ? t("agenda.dialogEditLead") : t("agenda.dialogCreateLead")}
            </p>
          </DialogHeader>
          <form onSubmit={handleSave} className="clinic-form clinic-form-product">
            <div className="clinic-form-scroll">
              <div className="form-group">
                <Label htmlFor="agenda-patient">{t("agenda.patientRequired")}</Label>
                <Select value={form.patient_id} onValueChange={onPatientChange}>
                  <SelectTrigger id="agenda-patient" className="clinic-field-control">
                    <SelectValue placeholder={t("agenda.selectPet")} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.clients?.name || t("agenda.ownerFallback")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="clinic-form-grid-2">
                <div className="form-group">
                  <Label htmlFor="agenda-starts">{t("agenda.startsAt")}</Label>
                  <Input
                    id="agenda-starts"
                    className="clinic-field-control"
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="agenda-ends">{t("agenda.endsAt")}</Label>
                  <Input
                    id="agenda-ends"
                    className="clinic-field-control"
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <Label htmlFor="agenda-status">{t("agenda.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger id="agenda-status" className="clinic-field-control">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_STATUS_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{statusLabel(k)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label htmlFor="agenda-reason">{t("agenda.reason")}</Label>
                <Input
                  id="agenda-reason"
                  className="clinic-field-control"
                  placeholder={t("agenda.reasonPlaceholder")}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <div className="form-group">
                <Label htmlFor="agenda-notes">{t("agenda.notes")}</Label>
                <Textarea
                  id="agenda-notes"
                  className="clinic-field-control clinic-field-control--textarea"
                  placeholder={t("agenda.notesPlaceholder")}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="clinic-dialog-footer gap-2 flex-wrap">
              {editing && (
                <Button type="button" variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
              )}
              {editing && onStartConsultation && form.patient_id && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const p = patients.find((x) => x.id === form.patient_id);
                    setDialogOpen(false);
                    onStartConsultation({
                      patientId: form.patient_id,
                      clientId: form.client_id,
                      appointmentId: editing.id,
                      patient: p,
                    });
                  }}
                >
                  <Stethoscope size={14} className="mr-1" /> {t("agenda.consultation")}
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className={clinicDialogClass("max-w-sm", "clinic-dialog", "clinic-agenda-dialog")}>
          <DialogHeader className="clinic-dialog-header">
            <DialogTitle>{t("agenda.confirmTitle")}</DialogTitle>
            <p className="clinic-dialog-subtitle">
              {t("agenda.confirmLead")}
            </p>
          </DialogHeader>
          {approvingRequest && (
            <form onSubmit={confirmApprove} className="clinic-form clinic-form-product">
              <div className="clinic-form-scroll clinic-form-scroll-compact">
                <p className="clinic-agenda-approve-summary">
                  <strong>{approvingRequest.client_name}</strong> — {approvingRequest.patient_name}
                </p>
                {approvingRequest.reason && (
                  <p className="clinic-agenda-approve-reason">{approvingRequest.reason}</p>
                )}
                <div className="form-group">
                  <Label htmlFor="approve-starts">{t("agenda.approveStarts")}</Label>
                  <Input
                    id="approve-starts"
                    className="clinic-field-control"
                    type="datetime-local"
                    value={approveForm.starts_at}
                    onChange={(e) => setApproveForm({ ...approveForm, starts_at: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="approve-ends">{t("agenda.approveEnds")}</Label>
                  <Input
                    id="approve-ends"
                    className="clinic-field-control"
                    type="datetime-local"
                    value={approveForm.ends_at}
                    onChange={(e) => setApproveForm({ ...approveForm, ends_at: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="clinic-dialog-footer gap-2">
                <Button type="button" variant="secondary" onClick={() => setApproveOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={approving}>
                  {approving ? t("agenda.approving") : t("agenda.approveAndCreate")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog {...dialogProps} />
    </div>
  );
}
