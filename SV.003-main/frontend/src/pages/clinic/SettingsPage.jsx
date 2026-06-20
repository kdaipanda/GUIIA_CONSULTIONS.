import React, { useCallback, useEffect, useState } from "react";
import { Copy, Save, Users, UserPlus, Trash2 } from "lucide-react";
import { useVet } from "../../context/VetContext";
import { useClinic } from "../../context/ClinicContext";
import {
  fetchOrganization,
  updateOrganization,
  addOrganizationMember,
  removeOrganizationMember,
} from "../../lib/clinicApi";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const ROLE_LABELS = {
  owner: "Propietario",
  admin: "Administrador",
  veterinarian: "Veterinario",
  receptionist: "Recepción",
};

const INVITE_ROLES = [
  { value: "veterinarian", label: "Veterinario" },
  { value: "receptionist", label: "Recepción" },
  { value: "admin", label: "Administrador" },
];

export function SettingsPage() {
  const { veterinarian } = useVet();
  const { role } = useClinic();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: "", timezone: "America/Mexico_City" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("veterinarian");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isOrgAdmin = role === "owner" || role === "admin";

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchOrganization(veterinarian.id);
      setOrg(data.organization || null);
      setMembers(data.members || []);
      setForm({
        name: data.organization?.name || "",
        timezone: data.organization?.timezone || "America/Mexico_City",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOrgAdmin) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await updateOrganization(veterinarian.id, form);
      setOrg(data.organization || null);
      setMessage("Consultorio actualizado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError("");
    setMessage("");
    try {
      const data = await addOrganizationMember(
        veterinarian.id,
        inviteEmail.trim(),
        inviteRole,
      );
      setMessage(data.message || "Miembro agregado.");
      setInviteEmail("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (member.role === "owner") return;
    const label = member.nombre || member.email || "este miembro";
    if (!window.confirm(`¿Quitar a ${label} del consultorio?`)) return;
    setError("");
    setMessage("");
    try {
      const data = await removeOrganizationMember(veterinarian.id, member.id);
      setMessage(data.message || "Miembro eliminado.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const portalUrl = org?.id
    ? `${window.location.origin}/solicitar-cita/${org.id}`
    : "";

  const copyPortal = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setMessage("Enlace del portal copiado.");
  };

  if (!isOrgAdmin) {
    return (
      <div className="clinic-page">
        <div className="clinic-page-header">
          <div>
            <h1>Configuración</h1>
            <p>Solo administradores del consultorio pueden editar esta sección.</p>
          </div>
        </div>
        <p className="clinic-muted">Tu rol actual no tiene permisos de administración.</p>
      </div>
    );
  }

  return (
    <div className="clinic-page">
      <div className="clinic-page-header">
        <div>
          <h1>Configuración del consultorio</h1>
          <p>Datos de la clínica, equipo y portal de citas.</p>
        </div>
      </div>

      {error && <p className="clinic-error">{error}</p>}
      {message && <p className="clinic-success-msg">{message}</p>}

      {loading ? (
        <p className="clinic-muted">Cargando...</p>
      ) : (
        <>
          <form onSubmit={handleSave} className="clinic-settings-card">
            <h2>Datos generales</h2>
            <div className="clinic-form-grid-2">
              <div className="form-group">
                <Label htmlFor="org-name">Nombre del consultorio</Label>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <Label htmlFor="org-tz">Zona horaria</Label>
                <Input
                  id="org-tz"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              <Save size={16} aria-hidden />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>

          <section className="clinic-settings-card">
            <h2>Portal de solicitud de citas</h2>
            <p className="clinic-muted clinic-tools-desc">
              Comparte este enlace con los dueños para que soliciten cita sin iniciar sesión.
            </p>
            <div className="clinic-settings-portal">
              <Input readOnly value={portalUrl} />
              <Button type="button" variant="secondary" onClick={copyPortal}>
                <Copy size={16} aria-hidden />
                Copiar
              </Button>
            </div>
          </section>

          <section className="clinic-settings-card">
            <h2>
              <Users size={18} aria-hidden />
              Equipo
            </h2>
            <p className="clinic-muted clinic-tools-desc">
              Invita veterinarios o recepción que ya tengan cuenta en GUIAA (mismo email de registro).
            </p>

            <form onSubmit={handleInvite} className="clinic-invite-form">
              <div className="form-group">
                <Label htmlFor="invite-email">Email del usuario</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colega@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <Label htmlFor="invite-role">Rol</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
                <UserPlus size={16} aria-hidden />
                {inviting ? "Agregando..." : "Agregar al equipo"}
              </Button>
            </form>

            {members.length === 0 ? (
              <p className="clinic-muted">No hay miembros registrados.</p>
            ) : (
              <div className="clinic-table-wrap">
                <table className="clinic-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Alta</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td>{m.nombre || "—"}</td>
                        <td>{m.email || "—"}</td>
                        <td>{ROLE_LABELS[m.role] || m.role}</td>
                        <td>
                          {m.created_at
                            ? new Date(m.created_at).toLocaleDateString("es-MX")
                            : "—"}
                        </td>
                        <td>
                          {m.role !== "owner" && m.profile_id !== veterinarian?.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(m)}
                              aria-label="Quitar miembro"
                            >
                              <Trash2 size={16} aria-hidden />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
