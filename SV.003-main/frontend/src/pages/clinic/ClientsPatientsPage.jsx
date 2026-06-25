import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Stethoscope,
  FileDown,
  ExternalLink,
  PawPrint,
  Zap,
  Users,
} from "lucide-react";
import "./clinicPageShared.css";
import {
  ClinicTableSkeleton,
  ClinicEmptyState,
  ClinicStatPill,
  clinicDialogClass,
} from "../../components/clinic/ClinicPageUi";
import {
  formatConsultationFolio,
  formatConsultationDateShort,
  getConsultationStatusLabel,
} from "../../lib/consultationDisplay";
import { useVet } from "../../context/VetContext";
import {
  fetchPatients,
  fetchClients,
  createPatient,
  updatePatient,
  deletePatient,
  fetchPatient,
  createClient,
  updateClient,
  deleteClient,
} from "../../lib/clinicApi";
import { downloadConsultationPdf, downloadPatientHistoryPdf, cleanClinicalDisplayText } from "../../lib/consultationPdf";
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

function consultationMotivo(consultation) {
  return (
    consultation?.motivo_consulta ||
    consultation?.detalle_paciente ||
    consultation?.form_data?.motivo_consulta ||
    "Sin motivo registrado"
  );
}

const IMAGE_TYPE_LABELS = {
  blood_test: "Análisis de sangre",
  urinalysis: "Urianálisis",
  xray: "Radiografía",
  general: "Estudio general",
};

function matchesQuery(value, q) {
  return (value || "").toLowerCase().includes(q);
}

export function ClientsPatientsPage({ onStartConsultation, onViewConsultation }) {
  const { veterinarian } = useVet();
  const [clients, setClients] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
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

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    try {
      const [clientsData, patientsData] = await Promise.all([
        fetchClients(veterinarian.id),
        fetchPatients(veterinarian.id),
      ]);
      setClients(clientsData.clients || []);
      setPatients(patientsData.patients || []);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id]);

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
        notifySuccess("Dueño actualizado");
      } else {
        await createClient(veterinarian.id, clientForm);
        notifySuccess("Dueño registrado");
      }
      setClientDialogOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm(`¿Eliminar dueño "${client.name}"?`)) return;
    try {
      await deleteClient(veterinarian.id, client.id);
      notifySuccess("Dueño eliminado");
      load();
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

  const handleSavePatient = async (e) => {
    e.preventDefault();
    if (!patientForm.name.trim() || !patientForm.client_id) return;
    setSaving(true);
    const payload = {
      ...patientForm,
      weight_kg: patientForm.weight_kg === "" ? null : Number(patientForm.weight_kg),
    };
    try {
      if (patientEditing) {
        await updatePatient(veterinarian.id, patientEditing.id, payload);
        notifySuccess("Mascota actualizada");
      } else {
        await createPatient(veterinarian.id, payload);
        notifySuccess("Mascota registrada");
      }
      setPatientDialogOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async (patient) => {
    if (!window.confirm(`¿Eliminar mascota "${patient.name}"?`)) return;
    try {
      await deletePatient(veterinarian.id, patient.id);
      notifySuccess("Mascota eliminada");
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleDownloadConsultationPdf = async (consultation) => {
    setPdfLoadingId(consultation.id);
    try {
      await downloadConsultationPdf(consultation, { veterinarian });
    } catch (err) {
      notifyError(err.message || "No se pudo generar el PDF");
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
      notifyError(err.message || "No se pudo generar el historial PDF");
    } finally {
      setHistoryPdfLoading(false);
    }
  };

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Dueños y mascotas</h1>
          <p>Tutores, fichas clínicas e historial en un solo lugar.</p>
        </div>
        <div className="clinic-header-actions">
          <Button type="button" variant="secondary" onClick={() => setQuickDialogOpen(true)}>
            <Zap size={16} className="mr-1" /> Registro rápido
          </Button>
          <Button type="button" onClick={openCreateClient}>
            <Plus size={16} className="mr-1" /> Nuevo dueño
          </Button>
        </div>
      </div>

      <div className="clinic-toolbar">
        <div className="clinic-search">
          <Search size={16} />
          <Input
            placeholder="Buscar dueño, teléfono, mascota o especie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!loading && clients.length > 0 && (
        <div className="clinic-stats-row">
          <ClinicStatPill value={stats.owners} label="Dueños" />
          <ClinicStatPill value={stats.pets} label="Mascotas" />
          <ClinicStatPill value={stats.species} label="Especies" />
        </div>
      )}

      {loading ? (
        <ClinicTableSkeleton rows={6} cols={4} />
      ) : clients.length === 0 ? (
        <ClinicEmptyState
          mascot={<DoctorPlumitas size="sm" badge />}
          title="Sin dueños registrados"
          description="Usa registro rápido para crear dueño y mascota en un solo paso."
          actionLabel="Registro rápido"
          onAction={() => setQuickDialogOpen(true)}
        />
      ) : visibleClients.length === 0 ? (
        <ClinicEmptyState
          title="Sin resultados"
          description="Prueba con otro nombre, teléfono o mascota."
        />
      ) : (
        <div className="clinic-owner-list">
          {visibleClients.map((client) => {
            const pets = petsForClient(client.id);
            return (
              <section key={client.id} className="clinic-owner-card">
                <header className="clinic-owner-card-head">
                  <div className="clinic-owner-card-icon" aria-hidden>
                    <Users size={18} />
                  </div>
                  <div className="clinic-owner-card-info">
                    <strong>{client.name}</strong>
                    <span>
                      {[client.phone, client.email].filter(Boolean).join(" · ") || "Sin contacto"}
                    </span>
                  </div>
                  <div className="clinic-table-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Agregar mascota"
                      onClick={() => openCreatePatient(client.id)}
                    >
                      <PawPrint size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEditClient(client)}>
                      <Pencil size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteClient(client)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </header>

                {pets.length === 0 ? (
                  <p className="clinic-owner-empty">
                    Sin mascotas.{" "}
                    <button type="button" className="clinic-link-btn" onClick={() => openCreatePatient(client.id)}>
                      Agregar mascota
                    </button>
                  </p>
                ) : (
                  <div className="clinic-table-wrap clinic-owner-pets-table">
                    <table className="clinic-table">
                      <thead>
                        <tr>
                          <th>Mascota</th>
                          <th>Especie</th>
                          <th>Raza</th>
                          <th aria-label="Acciones" />
                        </tr>
                      </thead>
                      <tbody>
                        {pets.map((p) => (
                          <tr key={p.id} className="clinic-table-row-click" onClick={() => openDetail(p)}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.species || "—"}</td>
                            <td>{p.breed || "—"}</td>
                            <td className="clinic-table-actions" onClick={(e) => e.stopPropagation()}>
                              {onStartConsultation && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  title="Iniciar consulta"
                                  onClick={() =>
                                    onStartConsultation({
                                      patientId: p.id,
                                      clientId: p.client_id,
                                      patient: p,
                                    })
                                  }
                                >
                                  <Stethoscope size={14} />
                                </Button>
                              )}
                              <Button type="button" variant="ghost" size="sm" onClick={() => openEditPatient(p)}>
                                <Pencil size={14} />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleDeletePatient(p)}>
                                <Trash2 size={14} />
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
            <DialogTitle>{clientEditing ? "Editar dueño" : "Nuevo dueño"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveClient} className="clinic-form">
            <div className="clinic-form-grid-2">
              <div className="form-group">
                <Label htmlFor="client-name">Nombre *</Label>
                <Input
                  id="client-name"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <Label htmlFor="client-phone">Teléfono</Label>
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
                + Email, dirección y notas
              </button>
            )}
            {(clientEditing || showFullClientForm) && (
              <>
                <div className="form-group">
                  <Label htmlFor="client-email">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="client-address">Dirección</Label>
                  <Input
                    id="client-address"
                    value={clientForm.address}
                    onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="client-notes">Notas</Label>
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
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={patientDialogOpen} onOpenChange={setPatientDialogOpen}>
        <DialogContent className={clinicDialogClass("max-w-md")}>
          <DialogHeader>
            <DialogTitle>{patientEditing ? "Editar mascota" : "Nueva mascota"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePatient} className="clinic-form">
            <div className="form-group">
              <Label>Dueño *</Label>
              <Select
                value={patientForm.client_id}
                onValueChange={(v) => setPatientForm({ ...patientForm, client_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar dueño" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Nombre *</Label>
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
            />
            {!patientEditing && !showFullPetForm && (
              <button
                type="button"
                className="clinic-link-btn"
                onClick={() => setShowFullPetForm(true)}
              >
                + Raza, sexo y más datos
              </button>
            )}
            {(patientEditing || showFullPetForm) && (
              <>
                <div className="form-group">
                  <Label>Raza</Label>
                  <Input
                    value={patientForm.breed}
                    onChange={(e) => setPatientForm({ ...patientForm, breed: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <Label>Especie (lista completa)</Label>
                  <Select
                    value={patientForm.species}
                    onValueChange={(v) => setPatientForm({ ...patientForm, species: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Especie" /></SelectTrigger>
                    <SelectContent>
                      {SPECIES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <Label>Notas</Label>
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
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <QuickClientPatientDialog
        open={quickDialogOpen}
        onOpenChange={setQuickDialogOpen}
        veterinarianId={veterinarian?.id}
        onSuccess={load}
      />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className={clinicDialogClass("max-w-xl", "max-h-[86vh]", "overflow-y-auto")}>
          <DialogHeader>
            <DialogTitle>{detail?.patient?.name}</DialogTitle>
          </DialogHeader>
          {detail?.patient && (
            <div className="clinic-detail">
              <div className="clinic-detail-grid">
                <p><strong>Dueño:</strong> {detail.patient.clients?.name}</p>
                <p><strong>Especie:</strong> {detail.patient.species || "—"}</p>
                <p><strong>Raza:</strong> {detail.patient.breed || "—"}</p>
                <p><strong>Consultas CDS:</strong> {detail.consultations?.length || 0}</p>
                <p><strong>Estudios:</strong> {detail.medical_images?.length || 0}</p>
              </div>

              <div className="clinic-detail-actions">
                {onStartConsultation && (
                  <Button
                    type="button"
                    onClick={() => {
                      setDetailOpen(false);
                      onStartConsultation({
                        patientId: detail.patient.id,
                        clientId: detail.patient.client_id,
                        patient: detail.patient,
                      });
                    }}
                  >
                    <Stethoscope size={16} className="mr-1" /> Iniciar consulta
                  </Button>
                )}
                {(detail.consultations?.length || detail.medical_images?.length) > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={historyPdfLoading}
                    onClick={handleDownloadHistoryPdf}
                  >
                    <FileDown size={16} className="mr-1" />
                    {historyPdfLoading ? "Generando..." : "Descargar historial PDF"}
                  </Button>
                )}
              </div>

              <div className="clinic-timeline">
                <h3>Historia clínica</h3>
                {!detail.consultations?.length ? (
                  <p className="clinic-muted">Aún no hay consultas vinculadas a esta mascota.</p>
                ) : (
                  <ul className="clinic-timeline-list">
                    {detail.consultations.map((consultation) => (
                      <li key={consultation.id} className="clinic-timeline-item">
                        <div className="clinic-timeline-head">
                          <span className="clinic-timeline-folio">{formatConsultationFolio(consultation)}</span>
                          <span className={`clinic-timeline-status status-${consultation.status || "draft"}`}>
                            {getConsultationStatusLabel(consultation.status)}
                          </span>
                        </div>
                        <p className="clinic-timeline-date">{formatConsultationDateShort(consultation.created_at)}</p>
                        <p className="clinic-timeline-motivo">{consultationMotivo(consultation)}</p>
                        {consultation.analysis && (
                          <p className="clinic-timeline-analysis">
                            {(() => {
                              const text = cleanClinicalDisplayText(consultation.analysis);
                              return text.length > 180 ? `${text.slice(0, 180)}…` : text;
                            })()}
                          </p>
                        )}
                        <div className="clinic-timeline-actions">
                          {onViewConsultation && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDetailOpen(false);
                                onViewConsultation(consultation.id);
                              }}
                            >
                              <ExternalLink size={14} className="mr-1" /> Ver consulta
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={pdfLoadingId === consultation.id}
                            onClick={() => handleDownloadConsultationPdf(consultation)}
                          >
                            <FileDown size={14} className="mr-1" />
                            {pdfLoadingId === consultation.id ? "Generando..." : "PDF"}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {(detail.medical_images?.length || 0) > 0 && (
                <div className="clinic-timeline clinic-timeline-studies">
                  <h3>Estudios e interpretaciones</h3>
                  <ul className="clinic-timeline-list">
                    {detail.medical_images.map((img) => (
                      <li key={img.id} className="clinic-timeline-item clinic-timeline-item-study">
                        <div className="clinic-timeline-head">
                          <span className="clinic-timeline-folio">
                            {IMAGE_TYPE_LABELS[img.image_type] || img.image_type || "Estudio"}
                          </span>
                        </div>
                        <p className="clinic-timeline-date">{formatConsultationDateShort(img.created_at)}</p>
                        {img.analysis && (
                          <p className="clinic-timeline-analysis">
                            {(() => {
                              const text = cleanClinicalDisplayText(img.analysis);
                              return text.length > 200 ? `${text.slice(0, 200)}…` : text;
                            })()}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
