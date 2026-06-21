import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Stethoscope, FileDown, ExternalLink, PawPrint } from "lucide-react";
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
} from "../../lib/clinicApi";
import { downloadConsultationPdf, downloadPatientHistoryPdf, cleanClinicalDisplayText } from "../../lib/consultationPdf";
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

const SPECIES = ["perros", "gatos", "conejos", "aves", "hamsters", "cuyos", "hurones", "erizos", "tortugas", "iguanas", "patos_pollos", "otros"];

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

const EMPTY_FORM = {
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

export function PatientsPage({ onStartConsultation, onViewConsultation }) {
  const { veterinarian } = useVet();
  const [patients, setPatients] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [historyPdfLoading, setHistoryPdfLoading] = useState(false);

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    setError("");
    try {
      const [patientsData, clientsData] = await Promise.all([
        fetchPatients(veterinarian.id, { search }),
        fetchClients(veterinarian.id),
      ]);
      setPatients(patientsData.patients || []);
      setClients(clientsData.clients || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, client_id: clients[0]?.id || "" });
    setDialogOpen(true);
  };

  const openEdit = (patient) => {
    setEditing(patient);
    setForm({
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
    setDialogOpen(true);
  };

  const openDetail = async (patient) => {
    try {
      const data = await fetchPatient(veterinarian.id, patient.id);
      setDetail(data);
      setDetailOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.client_id) return;
    setSaving(true);
    const payload = {
      ...form,
      weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
    };
    try {
      if (editing) {
        await updatePatient(veterinarian.id, editing.id, payload);
      } else {
        await createPatient(veterinarian.id, payload);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (patient) => {
    if (!window.confirm(`¿Eliminar mascota "${patient.name}"?`)) return;
    try {
      await deletePatient(veterinarian.id, patient.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadConsultationPdf = async (consultation) => {
    setPdfLoadingId(consultation.id);
    try {
      await downloadConsultationPdf(consultation, { veterinarian });
    } catch (err) {
      setError(err.message || "No se pudo generar el PDF");
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
      setError(err.message || "No se pudo generar el historial PDF");
    } finally {
      setHistoryPdfLoading(false);
    }
  };

  const clientName = (p) => p.clients?.name || "—";

  const stats = useMemo(() => {
    const species = new Set(patients.map((p) => p.species).filter(Boolean));
    return { total: patients.length, species: species.size };
  }, [patients]);

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Mascotas</h1>
          <p>Fichas clínicas, historial y acceso rápido a consultas.</p>
        </div>
        <Button type="button" onClick={openCreate} disabled={clients.length === 0}>
          <Plus size={16} className="mr-1" /> Nueva mascota
        </Button>
      </div>

      {clients.length === 0 && (
        <div className="info-message">Registra al menos un dueño antes de agregar mascotas.</div>
      )}

      <div className="clinic-toolbar">
        <div className="clinic-search">
          <Search size={16} />
          <Input
            placeholder="Buscar por nombre, especie o raza..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!loading && patients.length > 0 && (
        <div className="clinic-stats-row">
          <ClinicStatPill value={stats.total} label="Registradas" />
          <ClinicStatPill value={stats.species} label="Especies" />
        </div>
      )}

      {loading ? (
        <ClinicTableSkeleton rows={6} cols={5} />
      ) : patients.length === 0 ? (
        <ClinicEmptyState
          icon={PawPrint}
          title="Sin mascotas registradas"
          description={
            clients.length === 0
              ? "Primero registra un dueño para poder agregar mascotas."
              : "Agrega la primera mascota para iniciar consultas y seguimiento clínico."
          }
          actionLabel={clients.length > 0 ? "Registrar mascota" : undefined}
          onAction={clients.length > 0 ? openCreate : undefined}
        />
      ) : (
        <div className="clinic-table-wrap">
          <table className="clinic-table">
            <thead>
              <tr>
                <th>Mascota</th>
                <th>Dueño</th>
                <th>Especie</th>
                <th>Raza</th>
                <th>Sexo</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="clinic-table-row-click" onClick={() => openDetail(p)}>
                  <td><strong>{p.name}</strong></td>
                  <td>{clientName(p)}</td>
                  <td>{p.species || "—"}</td>
                  <td>{p.breed || "—"}</td>
                  <td>{p.sex || "—"}</td>
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(p)}>
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clinicDialogClass("max-w-lg")}>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar mascota" : "Nueva mascota"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="clinic-form">
            <div className="form-group">
              <Label>Dueño *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
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
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <Label>Especie</Label>
              <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
                <SelectTrigger><SelectValue placeholder="Especie" /></SelectTrigger>
                <SelectContent>
                  {SPECIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Raza</Label>
              <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
            </div>
            <div className="form-group">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className={clinicDialogClass("max-w-2xl", "max-h-[90vh]", "overflow-y-auto")}>
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
                    {detail.consultations.map((consultation) => {
                      const status = getConsultationStatusLabel(consultation.status);
                      return (
                        <li key={consultation.id} className="clinic-timeline-item">
                          <div className="clinic-timeline-head">
                            <span className="clinic-timeline-folio">{formatConsultationFolio(consultation)}</span>
                            <span className={`clinic-timeline-status status-${consultation.status || "draft"}`}>
                              {status}
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
                      );
                    })}
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
