import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import "./clinicPageShared.css";
import {
  ClinicTableSkeleton,
  ClinicEmptyState,
  ClinicStatPill,
  clinicDialogClass,
} from "../../components/clinic/ClinicPageUi";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { useVet } from "../../context/VetContext";
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
} from "../../lib/clinicApi";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", notes: "" };

export function ClientsPage() {
  const { veterinarian } = useVet();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    try {
      const data = await fetchClients(veterinarian.id, search);
      setClients(data.clients || []);
    } catch (err) {
      notifyError(err.message);
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
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateClient(veterinarian.id, editing.id, form);
      } else {
        await createClient(veterinarian.id, form);
      }
      setDialogOpen(false);
      notifySuccess(editing ? "Dueño actualizado" : "Dueño registrado");
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const withPhone = clients.filter((c) => c.phone?.trim()).length;
    const withEmail = clients.filter((c) => c.email?.trim()).length;
    return { total: clients.length, withPhone, withEmail };
  }, [clients]);

  const handleDelete = async (client) => {
    if (!window.confirm(`¿Eliminar dueño "${client.name}"?`)) return;
    try {
      await deleteClient(veterinarian.id, client.id);
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Dueños</h1>
          <p>Contactos y datos de tutores registrados en tu consultorio.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Nuevo dueño
        </Button>
      </div>

      <div className="clinic-toolbar">
        <div className="clinic-search">
          <Search size={16} />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!loading && clients.length > 0 && (
        <div className="clinic-stats-row">
          <ClinicStatPill value={stats.total} label="Registrados" />
          <ClinicStatPill value={stats.withPhone} label="Con teléfono" />
          <ClinicStatPill value={stats.withEmail} label="Con email" />
        </div>
      )}

      {loading ? (
        <ClinicTableSkeleton rows={6} cols={4} />
      ) : clients.length === 0 ? (
        <ClinicEmptyState
          icon={Users}
          title="Sin dueños registrados"
          description="Agrega tutores para vincular mascotas, consultas y ventas."
          actionLabel="Registrar primer dueño"
          onAction={openCreate}
        />
      ) : (
        <div className="clinic-table-wrap">
          <table className="clinic-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.address || "—"}</td>
                  <td className="clinic-table-actions">
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(c)}>
                      <Pencil size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(c)}>
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
            <DialogTitle>{editing ? "Editar dueño" : "Nuevo dueño"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="clinic-form">
            <div className="form-group">
              <Label htmlFor="client-name">Nombre *</Label>
              <Input id="client-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <Label htmlFor="client-phone">Teléfono</Label>
              <Input id="client-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <Label htmlFor="client-email">Email</Label>
              <Input id="client-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <Label htmlFor="client-address">Dirección</Label>
              <Input id="client-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group">
              <Label htmlFor="client-notes">Notas</Label>
              <Textarea id="client-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
