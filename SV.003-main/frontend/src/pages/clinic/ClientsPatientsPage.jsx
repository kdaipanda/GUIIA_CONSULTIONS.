import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Pencil,
  Trash2,
  Stethoscope,
  FileDown,
  PawPrint,
  Zap,
  FlaskConical,
  FolderOpen,
  Copy,
  CalendarDays,
  Check,
} from "lucide-react";
import "./clinicPageShared.css";
import "./helpCenterPage.css";
import { ConfirmActionDialog } from "../../components/clinic/ConfirmActionDialog";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import {
  ClinicTableSkeleton,
  ClinicEmptyState,
  ClinicStatPill,
  clinicDialogClass,
} from "../../components/clinic/ClinicPageUi";
import { ModuleHelpTip } from "../../components/clinic/ModuleHelpTip";
import { useVet } from "../../context/VetContext";
import {
  fetchPatient,
  createPatient,
  updatePatient,
  deletePatient,
  createClient,
  updateClient,
  deleteClient,
} from "../../lib/clinicApi";
import {
  loadClinicRegistry,
  invalidateClinicRegistryCache,
  readClinicRegistryCache,
  writeClinicRegistryCache,
} from "../../lib/clinicRegistryCache";
import { fetchClinicRegistry } from "../../lib/clinicApi";
import { downloadConsultationPdf, downloadPatientHistoryPdf } from "../../lib/consultationPdf";
import { ClinicalTimelineList } from "../../components/clinical/ClinicalTimelineList";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { CONSULTATION_CATEGORY_ICONS } from "../../lib/consultationCategories";
import { formatConsultationDateShort } from "../../lib/consultationDisplay";
import { normalizePetSex } from "../../lib/petSex";
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
import { QuickClientPatientDialog } from "../../components/clinic/QuickClientPatientDialog";
import { DoctorPlumitas } from "../../components/brand/DoctorPlumitas";
import { SpeciesChipPicker } from "../../components/clinic/SpeciesChipPicker";

const SPECIES = ["perros", "gatos", "conejos", "aves", "hamsters", "cuyos", "hurones", "erizos", "tortugas", "iguanas", "patos_pollos", "otros"];

const EMPTY_CLIENT = { name: "", email: "", phone: "", address: "", notes: "" };

const EMPTY_PATIENT = {
  client_id: "",
  name: "",
  species: "",
  breed: "",
  sex: "",
  birth_date: "",
  microchip: "",
  color: "",
  weight_kg: "",
  notes: "",
};

function matchesQuery(value, q) {
  return (value || "").toLowerCase().includes(q);
}

export function ClientsPatientsPage({
  onStartConsultation,
  onStartLabAnalysis,
  onViewConsultation,
  onOpenPatientChart,
}) {
  const { t } = useTranslation("clinic");
  const { t: tSpecies } = useTranslation("speciesForms");
  const speciesLabel = (value) =>
    value ? tSpecies(`categories.${value}`, { defaultValue: value }) : t("common.emDash");
  const { veterinarian } = useVet();
  const { confirm, dialogProps } = useConfirmAction();
  const [clients, setClients] = useState(() => readClinicRegistryCache(veterinarian?.id)?.clients || []);
  const [patients, setPatients] = useState(() => readClinicRegistryCache(veterinarian?.id)?.patients || []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(() => !readClinicRegistryCache(veterinarian?.id));
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);

  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientEditing, setClientEditing] = useState(null);
  const [clientForm, setClientForm] = useState(EMPTY_CLIENT);
  const [showFullClientForm, setShowFullClientForm] = useState(false);

  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [patientEditing, setPatientEditing] = useState(null);
  const [patientForm, setPatientForm] = useState(EMPTY_PATIENT);
  const [showFullPetForm, setShowFullPetForm] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [historyPdfLoading, setHistoryPdfLoading] = useState(false);
  const [copiedPatientId, setCopiedPatientId] = useState(false);

  const applyRegistry = useCallback((data) => {
    setClients(data?.clients || []);
    setPatients(data?.patients || []);
  }, []);

  const load = useCallback(async ({ force = false, silent = false } = {}) => {
    if (!veterinarian?.id) {
      setLoading(false);
      return;
    }

    const cached = !force ? readClinicRegistryCache(veterinarian.id) : null;
    if (cached) {
      applyRegistry(cached);
      setLoading(false);
      try {
        const fresh = await fetchClinicRegistry(veterinarian.id);
        writeClinicRegistryCache(veterinarian.id, fresh);
        applyRegistry(fresh);
      } catch (err) {
        if (!cached?.clients?.length && !cached?.patients?.length) {
          notifyError(err.message);
        }
      }
      return;
    }

    if (!silent) setLoading(true);
    try {
      const data = await loadClinicRegistry(veterinarian.id, { force: true });
      applyRegistry(data);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }, [applyRegistry, veterinarian?.id]);

  const reloadRegistry = useCallback(async () => {
    if (!veterinarian?.id) return;
    invalidateClinicRegistryCache(veterinarian.id);
    await load({ force: true, silent: true });
  }, [load, veterinarian?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const patientsByClient = useMemo(() => {
    const map = {};
    patients.forEach((p) => {
      if (!p.client_id) return;
      if (!map[p.client_id]) map[p.client_id] = [];
      map[p.client_id].push(p);
    });
    return map;
  }, [patients]);

  const query = search.trim().toLowerCase();

  const clientMatches = useCallback(
    (client) =>
      !query ||
      matchesQuery(client.name, query) ||
      matchesQuery(client.phone, query) ||
      matchesQuery(client.email, query),
    [query],
  );

  const patientMatches = useCallback(
    (patient) =>
      !query ||
      matchesQuery(patient.name, query) ||
      matchesQuery(patient.species, query) ||
      matchesQuery(patient.breed, query),
    [query],
  );

  const visibleClients = useMemo(() => {
    if (!query) return clients;
    return clients.filter((client) => {
      if (clientMatches(client)) return true;
      return (patientsByClient[client.id] || []).some(patientMatches);
    });
  }, [clients, query, clientMatches, patientMatches, patientsByClient]);

  const petsForClient = useCallback(
    (clientId) => {
      const pets = patientsByClient[clientId] || [];
      if (!query) return pets;
      const client = clients.find((c) => c.id === clientId);
      if (client && clientMatches(client)) return pets;
      return pets.filter(patientMatches);
    },
    [clients, query, clientMatches, patientMatches, patientsByClient],
  );

  const stats = useMemo(() => {
    const species = new Set(patients.map((p) => p.species).filter(Boolean));
    return { owners: clients.length, pets: patients.length, species: species.size };
  }, [clients, patients]);

  const openCreateClient = () => {
    setClientEditing(null);
    setClientForm(EMPTY_CLIENT);
    setShowFullClientForm(false);
    setClientDialogOpen(true);
  };

  const openEditClient = (client) => {
    setClientEditing(client);
    setShowFullClientForm(true);
    setClientForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setClientDialogOpen(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;
    setSaving(true);
    try {
      if (clientEditing) {
        await updateClient(veterinarian.id, clientEditing.id, clientForm);
        notifySuccess(t("clients.ownerUpdated"));
      } else {
        await createClient(veterinarian.id, clientForm);
        notifySuccess(t("clients.ownerCreated"));
      }
      setClientDialogOpen(false);
      reloadRegistry();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (client) => {
    const ok = await confirm({
      title: t("clients.deleteOwnerTitle"),
      description: t("clients.deleteOwnerDesc", { name: client.name }),
      confirmLabel: t("clients.deleteConfirm"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteClient(veterinarian.id, client.id);
      notifySuccess(t("clients.ownerDeleted"));
      reloadRegistry();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const openCreatePatient = (clientId) => {
    setPatientEditing(null);
    setShowFullPetForm(false);
    setPatientForm({
      ...EMPTY_PATIENT,
      client_id: clientId || clients[0]?.id || "",
      species: "perros",
    });
    setPatientDialogOpen(true);
  };

  const openEditPatient = (patient) => {
    setPatientEditing(patient);
    setShowFullPetForm(true);
    setPatientForm({
      client_id: patient.client_id || "",
      name: patient.name || "",
      species: patient.species || "",
      breed: patient.breed || "",
      sex: patient.sex || "",
      birth_date: patient.birth_date || "",
      microchip: patient.microchip || "",
      color: patient.color || "",
      weight_kg: patient.weight_kg ?? "",
      notes: patient.notes || "",
    });
    setPatientDialogOpen(true);
  };

  const openDetail = async (patient) => {
    try {
      const data = await fetchPatient(veterinarian.id, patient.id);
      setDetail(data);
      setDetailOpen(true);
    } catch (err) {
      notifyError(err.message);
    }
  };

  const onPetRowKeyDown = (e, patient) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetail(patient);
    }
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    if (!patientForm.name.trim() || !patientForm.client_id) return;
    setSaving(true);
    const payload = {
      ...patientForm,
      weight_kg: patientForm.weight_kg === "" ? null : Number(patientForm.weight_kg),
      birth_date: patientForm.birth_date?.trim() ? patientForm.birth_date.trim() : null,
    };
    try {
      if (patientEditing) {
        await updatePatient(veterinarian.id, patientEditing.id, payload);
        notifySuccess(t("clients.petUpdated"));
      } else {
        await createPatient(veterinarian.id, payload);
        notifySuccess(t("clients.petCreated"));
      }
      setPatientDialogOpen(false);
      reloadRegistry();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async (patient) => {
    const ok = await confirm({
      title: t("clients.deletePetTitle"),
      description: t("clients.deletePetDesc", { name: patient.name }),
      confirmLabel: t("clients.deleteConfirm"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deletePatient(veterinarian.id, patient.id);
      notifySuccess(t("clients.petDeleted"));
      reloadRegistry();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleDownloadConsultationPdf = async (consultation) => {
    setPdfLoadingId(consultation.id);
    try {
      await downloadConsultationPdf(consultation, { veterinarian });
    } catch (err) {
      notifyError(err.message || t("common.pdfError"));
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleDownloadHistoryPdf = async () => {
    if (!detail?.patient) return;
    setHistoryPdfLoading(true);
    try {
      await downloadPatientHistoryPdf(detail.patient, detail.consultations, {
        veterinarian,
        medicalImages: detail.medical_images || [],
      });
    } catch (err) {
      notifyError(err.message || t("common.historyPdfError"));
    } finally {
      setHistoryPdfLoading(false);
    }
  };

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <div className="clinic-page-title-row">
            <h1>{t("clients.title")}</h1>
            <ModuleHelpTip topicId="clients" />
          </div>
          <p>{t("clients.lead")}</p>
        </div>
        <div className="clinic-header-actions">
          <Button type="button" onClick={() => setQuickDialogOpen(true)}>
            <Zap size={16} className="mr-1" aria-hidden /> {t("clients.newRecord")}
          </Button>
        </div>
      </div>

      <div className="clinic-toolbar">
        <div className="clinic-search">
          <Search size={16} aria-hidden />
          <Input
            type="search"
            aria-label={t("clients.searchAria")}
            placeholder={t("clients.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!loading && clients.length > 0 && (
        <div className="clinic-stats-row" role="group" aria-label={t("clients.statsAria")}>
          <ClinicStatPill
            value={stats.owners}
            label={t("clients.statOwners")}
            ariaLabel={t("clients.statOwnersAria", { count: stats.owners })}
          />
          <ClinicStatPill
            value={stats.pets}
            label={t("clients.statPets")}
            ariaLabel={t("clients.statPetsAria", { count: stats.pets })}
          />
          <ClinicStatPill
            value={stats.species}
            label={t("clients.statSpecies")}
            ariaLabel={t("clients.statSpeciesAria", { count: stats.species })}
          />
        </div>
      )}

      {loading ? (
        <ClinicTableSkeleton rows={6} cols={4} />
      ) : clients.length === 0 ? (
        <ClinicEmptyState
          mascot={<DoctorPlumitas size="sm" badge />}
          title={t("clients.emptyTitle")}
          description={t("clients.emptyDesc")}
          actionLabel={t("clients.newRecord")}
          onAction={() => setQuickDialogOpen(true)}
        />
      ) : visibleClients.length === 0 ? (
        <ClinicEmptyState
          title={t("common.noResults")}
          description={t("clients.noResultsDesc")}
        />
      ) : (
        <div className="clinic-owner-list">
          {visibleClients.map((client) => {
            const pets = petsForClient(client.id);
            return (
              <section key={client.id} className="clinic-owner-card" aria-label={client.name}>
                <header className="clinic-owner-card-head">
                  <div className="clinic-owner-card-info">
                    <strong>{client.name}</strong>
                    <span>
                      {[client.phone, client.email].filter(Boolean).join(" · ") || t("clients.noContact")}
                    </span>
                  </div>
                  <div className="clinic-table-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title={t("clients.addPet")}
                      aria-label={t("clients.addPetAria", { name: client.name })}
                      onClick={() => openCreatePatient(client.id)}
                    >
                      <PawPrint size={14} aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t("clients.editOwnerAria", { name: client.name })}
                      onClick={() => openEditClient(client)}
                    >
                      <Pencil size={14} aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t("clients.deleteOwnerAria", { name: client.name })}
                      onClick={() => handleDeleteClient(client)}
                    >
                      <Trash2 size={14} aria-hidden />
                    </Button>
                  </div>
                </header>

                {pets.length === 0 ? (
                  <p className="clinic-owner-empty">
                    {t("clients.noPets")}{" "}
                    <button type="button" className="clinic-link-btn" onClick={() => openCreatePatient(client.id)}>
                      {t("clients.addPet")}
                    </button>
                  </p>
                ) : (
                  <div className="clinic-table-wrap clinic-owner-pets-table">
                    <table className="clinic-table">
                      <thead>
                        <tr>
                          <th>{t("clients.colPet")}</th>
                          <th>{t("clients.colSpecies")}</th>
                          <th>{t("clients.colBreed")}</th>
                          <th aria-label={t("common.actionsAria")} />
                        </tr>
                      </thead>
                      <tbody>
                        {pets.map((p) => (
                          <tr
                            key={p.id}
                            className="clinic-table-row-click"
                            tabIndex={0}
                            aria-label={t("clients.openPetDetailAria", { name: p.name })}
                            onClick={() => openDetail(p)}
                            onKeyDown={(e) => onPetRowKeyDown(e, p)}
                          >
                            <td>
                              <strong>{p.name}</strong>
                              {p.is_hospitalized ? (
                                <span className="clinic-pet-hosp-badge" style={{ marginLeft: 8 }}>
                                  {t("clients.hospitalizedBadge")}
                                </span>
                              ) : null}
                            </td>
                            <td>{speciesLabel(p.species)}</td>
                            <td>{p.breed || t("common.emDash")}</td>
                            <td className="clinic-table-actions" onClick={(e) => e.stopPropagation()}>
                              {onStartConsultation && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  title={t("clients.startConsultation")}
                                  aria-label={t("clients.startConsultationAria", { name: p.name })}
                                  onClick={() =>
                                    onStartConsultation({
                                      patientId: p.id,
                                      clientId: p.client_id,
                                      patient: p,
                                    })
                                  }
                                >
                                  <Stethoscope size={14} aria-hidden />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-label={t("clients.editPetAria", { name: p.name })}
                                onClick={() => openEditPatient(p)}
                              >
                                <Pencil size={14} aria-hidden />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-label={t("clients.deletePetAria", { name: p.name })}
                                onClick={() => handleDeletePatient(p)}
                              >
                                <Trash2 size={14} aria-hidden />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className={clinicDialogClass("max-w-md")}>
          <DialogHeader>
            <DialogTitle>{clientEditing ? t("clients.editOwner") : t("clients.newOwner")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveClient} className="clinic-form">
            <div className="clinic-form-grid-2">
              <div className="form-group">
                <Label htmlFor="client-name">{t("clients.nameRequired")}</Label>
                <Input
                  id="client-name"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <Label htmlFor="client-phone">{t("clients.phone")}</Label>
                <Input
                  id="client-phone"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                />
              </div>
            </div>
            {!clientEditing && !showFullClientForm && (
              <button
                type="button"
                className="clinic-link-btn"
                onClick={() => setShowFullClientForm(true)}
              >
                {t("clients.expandOwnerFields")}
              </button>
            )}
            {(clientEditing || showFullClientForm) && (
              <>
                <div className="form-group">
                  <Label htmlFor="client-email">{t("clients.email")}</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="client-address">{t("clients.address")}</Label>
                  <Input
                    id="client-address"
                    value={clientForm.address}
                    onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="client-notes">{t("clients.notes")}</Label>
                  <Textarea
                    id="client-notes"
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setClientDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={patientDialogOpen} onOpenChange={setPatientDialogOpen}>
        <DialogContent className={clinicDialogClass("max-w-md")}>
          <DialogHeader>
            <DialogTitle>{patientEditing ? t("clients.editPet") : t("clients.newPet")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePatient} className="clinic-form">
            <div className="form-group">
              <Label>{t("clients.ownerRequired")}</Label>
              <Select
                value={patientForm.client_id}
                onValueChange={(v) => setPatientForm({ ...patientForm, client_id: v })}
              >
                <SelectTrigger><SelectValue placeholder={t("clients.selectOwner")} /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>{t("clients.nameRequired")}</Label>
              <Input
                value={patientForm.name}
                onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <SpeciesChipPicker
              value={patientForm.species || "perros"}
              onChange={(species) => setPatientForm({ ...patientForm, species })}
              label={t("clients.colSpecies")}
            />
            {!patientEditing && !showFullPetForm && (
              <button
                type="button"
                className="clinic-link-btn"
                onClick={() => setShowFullPetForm(true)}
              >
                {t("clients.expandPetFields")}
              </button>
            )}
            {(patientEditing || showFullPetForm) && (
              <>
                <div className="form-group">
                  <Label>{t("clients.breed")}</Label>
                  <Input
                    value={patientForm.breed}
                    onChange={(e) => setPatientForm({ ...patientForm, breed: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <Label>{t("clients.speciesFull")}</Label>
                  <Select
                    value={patientForm.species}
                    onValueChange={(v) => setPatientForm({ ...patientForm, species: v })}
                  >
                    <SelectTrigger><SelectValue placeholder={t("clients.speciesPlaceholder")} /></SelectTrigger>
                    <SelectContent>
                      {SPECIES.map((s) => (
                        <SelectItem key={s} value={s}>{speciesLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <Label>{t("clients.notes")}</Label>
                  <Textarea
                    value={patientForm.notes}
                    onChange={(e) => setPatientForm({ ...patientForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setPatientDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <QuickClientPatientDialog
        open={quickDialogOpen}
        onOpenChange={setQuickDialogOpen}
        veterinarianId={veterinarian?.id}
        onSuccess={reloadRegistry}
        onOwnerOnly={() => {
          setQuickDialogOpen(false);
          openCreateClient();
        }}
      />

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setCopiedPatientId(false);
        }}
      >
        <DialogContent
          className={clinicDialogClass(
            "clinic-dialog",
            "clinic-dialog-compact",
            "clinic-patient-detail-dialog",
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{detail?.patient?.name || t("clients.petDetailTitle")}</DialogTitle>
          </DialogHeader>
          {detail?.patient && (
            <div className="clinic-patient-detail">
              {(() => {
                const patient = detail.patient;
                const speciesKey = (patient.species || "").toLowerCase();
                const speciesIcon =
                  CONSULTATION_CATEGORY_ICONS[speciesKey] || "🐾";
                const sexNorm = normalizePetSex(patient.sex);
                const sexLabel = sexNorm
                  ? t(`clients.sex.${sexNorm}`, { defaultValue: sexNorm })
                  : t("common.emDash");
                const patientIdShort = patient.id
                  ? `PET-${String(patient.id).slice(0, 8).toUpperCase()}`
                  : t("common.emDash");
                const lastVisit = (() => {
                  const dates = [
                    ...(detail.consultations || []).map((c) => c.created_at),
                    ...(detail.medical_images || []).map((s) => s.created_at),
                    patient.updated_at,
                    patient.created_at,
                  ].filter(Boolean);
                  if (!dates.length) return null;
                  return dates
                    .map((d) => ({ raw: d, t: new Date(d).getTime() }))
                    .filter((d) => !Number.isNaN(d.t))
                    .sort((a, b) => b.t - a.t)[0]?.raw;
                })();
                const cdsCount = detail.consultations?.length || 0;
                const labCount = detail.medical_images?.length || 0;
                const copyId = async () => {
                  try {
                    await navigator.clipboard.writeText(String(patient.id || ""));
                    setCopiedPatientId(true);
                    notifySuccess(t("clients.idCopied"));
                    window.setTimeout(() => setCopiedPatientId(false), 1600);
                  } catch {
                    notifyError(t("clients.idCopyError"));
                  }
                };

                return (
                  <>
                    <section className="clinic-patient-id-card" aria-label={t("clients.petIdCardAria")}>
                      <div className="clinic-patient-id-top">
                        <div className="clinic-patient-id-identity">
                          <div className="clinic-patient-id-avatar" aria-hidden>
                            {speciesIcon}
                          </div>
                          <div className="clinic-patient-id-identity-copy">
                            <div className="clinic-patient-id-date-row">
                              <CalendarDays size={14} aria-hidden />
                              <span>{t("clients.detailLastVisit")}</span>
                            </div>
                            <strong className="clinic-patient-id-date-value">
                              {lastVisit
                                ? formatConsultationDateShort(lastVisit)
                                : t("common.emDash")}
                            </strong>
                            <p className="clinic-patient-id-name">
                              {patient.name}
                              {patient.is_hospitalized || detail.hospitalization ? (
                                <span className="clinic-pet-hosp-badge">
                                  {t("clients.hospitalizedBadge")}
                                </span>
                              ) : null}
                            </p>
                            <p className="clinic-patient-id-species">
                              {speciesLabel(patient.species)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="clinic-patient-id-chip"
                          onClick={copyId}
                          title={t("clients.copyId")}
                        >
                          <span>{patientIdShort}</span>
                          {copiedPatientId ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                        </button>
                      </div>

                      <div className="clinic-patient-id-grid" role="list">
                        <div className="clinic-patient-id-field" role="listitem">
                          <span className="clinic-patient-id-label">{t("clients.detailOwnerLabel")}</span>
                          <span className="clinic-patient-id-value">
                            {patient.clients?.name || t("common.emDash")}
                          </span>
                        </div>
                        <div className="clinic-patient-id-field" role="listitem">
                          <span className="clinic-patient-id-label">{t("clients.detailSpeciesLabel")}</span>
                          <span className="clinic-patient-id-value">
                            {speciesLabel(patient.species)}
                          </span>
                        </div>
                        <div className="clinic-patient-id-field" role="listitem">
                          <span className="clinic-patient-id-label">{t("clients.detailBreedLabel")}</span>
                          <span className="clinic-patient-id-value">
                            {patient.breed || t("common.emDash")}
                          </span>
                        </div>
                        <div className="clinic-patient-id-field" role="listitem">
                          <span className="clinic-patient-id-label">{t("clients.detailSexLabel")}</span>
                          <span className="clinic-patient-id-value">{sexLabel}</span>
                        </div>
                        <div className="clinic-patient-id-field" role="listitem">
                          <span className="clinic-patient-id-label">{t("clients.detailBirthLabel")}</span>
                          <span className="clinic-patient-id-value">
                            {patient.birth_date
                              ? formatConsultationDateShort(patient.birth_date)
                              : t("common.emDash")}
                          </span>
                        </div>
                        <div className="clinic-patient-id-field" role="listitem">
                          <span className="clinic-patient-id-label">{t("clients.detailWeightLabel")}</span>
                          <span className="clinic-patient-id-value">
                            {patient.weight_kg != null && patient.weight_kg !== ""
                              ? `${patient.weight_kg} kg`
                              : t("common.emDash")}
                          </span>
                        </div>
                        <div className="clinic-patient-id-field" role="listitem">
                          <span className="clinic-patient-id-label">{t("clients.detailMicrochipLabel")}</span>
                          <span className="clinic-patient-id-value clinic-patient-id-value--mono">
                            {patient.microchip || t("common.emDash")}
                          </span>
                        </div>
                        <div className="clinic-patient-id-field" role="listitem">
                          <span className="clinic-patient-id-label">{t("clients.detailRecordsLabel")}</span>
                          <span className="clinic-patient-id-value">{cdsCount + labCount}</span>
                        </div>
                      </div>

                      {(patient.notes || detail.hospitalization?.reason) && (
                        <div className="clinic-patient-id-note">
                          <span className="clinic-patient-id-label">
                            {detail.hospitalization?.reason
                              ? t("clients.detailHospReason")
                              : t("clients.detailNotesLabel")}
                          </span>
                          <span className="clinic-patient-id-value">
                            {detail.hospitalization?.reason || patient.notes}
                          </span>
                        </div>
                      )}
                    </section>

                    <div className="clinic-patient-detail-stats" aria-label={t("clients.detailStatsAria")}>
                      <ClinicStatPill value={cdsCount} label={t("clients.statCds")} />
                      <ClinicStatPill value={labCount} label={t("clients.statLab")} />
                    </div>

                    <div className="clinic-patient-detail-actions">
                      {onStartConsultation && (
                        <Button
                          type="button"
                          className="clinic-patient-detail-cta"
                          onClick={() => {
                            setDetailOpen(false);
                            onStartConsultation({
                              patientId: patient.id,
                              clientId: patient.client_id,
                              patient,
                            });
                          }}
                        >
                          <Stethoscope size={16} aria-hidden /> {t("clients.startConsultation")}
                        </Button>
                      )}
                      <div className="clinic-patient-detail-secondary">
                        {onOpenPatientChart && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setDetailOpen(false);
                              onOpenPatientChart(patient.id);
                            }}
                          >
                            <FolderOpen size={16} aria-hidden /> {t("clients.openChart")}
                          </Button>
                        )}
                        {onStartLabAnalysis && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setDetailOpen(false);
                              onStartLabAnalysis({
                                patientId: patient.id,
                                clientId: patient.client_id,
                                patient,
                              });
                            }}
                          >
                            <FlaskConical size={16} aria-hidden /> {t("clients.interpretStudy")}
                          </Button>
                        )}
                        {(cdsCount || labCount) > 0 && (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={historyPdfLoading}
                            onClick={handleDownloadHistoryPdf}
                          >
                            <FileDown size={16} aria-hidden />
                            {historyPdfLoading
                              ? t("clients.generatingPdf")
                              : t("clients.downloadHistoryPdf")}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="clinic-timeline clinic-timeline-unified clinic-patient-detail-history">
                      <h3>{t("clients.clinicalHistory")}</h3>
                      <p className="clinic-timeline-hint">{t("clients.clinicalHistoryHint")}</p>
                      <ClinicalTimelineList
                        consultations={detail.consultations || []}
                        medicalImages={detail.medical_images || []}
                        onViewConsultation={onViewConsultation}
                        onDownloadConsultationPdf={handleDownloadConsultationPdf}
                        pdfLoadingId={pdfLoadingId}
                        onCloseBeforeNavigate={() => setDetailOpen(false)}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog {...dialogProps} />
    </div>
  );
}
