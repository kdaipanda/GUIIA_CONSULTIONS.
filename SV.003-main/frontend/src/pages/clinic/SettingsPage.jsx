import React, { useCallback, useEffect, useState } from "react";
import { Copy, Save, Users, UserPlus, Trash2, Settings, ShieldAlert } from "lucide-react";
import "./clinicPageShared.css";
import { ConfirmActionDialog } from "../../components/clinic/ConfirmActionDialog";
import { AccountPasswordSection } from "../../components/AccountPasswordSection";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import {
  ClinicSettingsSkeleton,
  ClinicEmptyState,
} from "../../components/clinic/ClinicPageUi";
import { useVet } from "../../context/VetContext";
import { useClinic } from "../../context/ClinicContext";
import {
  fetchOrganization,
  updateOrganization,
  addOrganizationMember,
  removeOrganizationMember,
} from "../../lib/clinicApi";
import { notifyError, notifySuccess } from "../../lib/appToast";
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
  {
    value: "veterinarian",
    label: "Veterinario",
    hint: "Consultas CDS, expediente, pacientes y agenda.",
  },
  {
    value: "receptionist",
    label: "Recepción",
    hint: "Agenda, dueños y pacientes. Sin consultas CDS.",
  },
  {
    value: "admin",
    label: "Administrador",
    hint: "Todo lo del veterinario, más configurar el consultorio y el equipo.",
  },
];

export function SettingsPage() {
  const { veterinarian } = useVet();
  const { role } = useClinic();
  const { confirm, dialogProps } = useConfirmAction();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: "", timezone: "America/Mexico_City" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("veterinarian");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);

  const isOrgAdmin = role === "owner" || role === "admin";

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    try {
      const data = await fetchOrganization(veterinarian.id);
      setOrg(data.organization || null);
      setMembers(data.members || []);
      setForm({
        name: data.organization?.name || "",
        timezone: data.organization?.timezone || "America/Mexico_City",
      });
    } catch (err) {
      notifyError(err.message);
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
    try {
      const data = await updateOrganization(veterinarian.id, form);
      setOrg(data.organization || null);
      notifySuccess("Consultorio actualizado.");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const data = await addOrganizationMember(
        veterinarian.id,
        inviteEmail.trim().toLowerCase(),
        inviteRole,
      );
      notifySuccess(data.message || "Miembro agregado.");
      setInviteEmail("");
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (member.role === "owner") return;
    const label = member.nombre || member.email || "este miembro";
    const ok = await confirm({
      title: "Quitar miembro",
      description: `¿Quitar a ${label} del consultorio? Perderá acceso a la organización.`,
      confirmLabel: "Quitar",
      destructive: true,
    });
    if (!ok) return;
    try {
      const data = await removeOrganizationMember(veterinarian.id, member.id);
      notifySuccess(data.message || "Miembro eliminado.");
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const portalUrl = org?.id
    ? `${window.location.origin}/solicitar-cita/${org.id}`
    : "";

  const copyPortal = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    notifySuccess("Enlace del portal copiado.");
  };

  const extraMembers = members.filter((m) => m.role !== "owner");

  if (!isOrgAdmin) {
    return (
      <div className="clinic-page clinic-page-guiaa">
        <div className="clinic-page-header">
          <div>
            <p className="clinic-page-eyebrow">Cuenta</p>
            <h1>Configuración</h1>
            <p>Seguridad de tu cuenta GUIAA.</p>
          </div>
        </div>
        <AccountPasswordSection />
        <ClinicEmptyState
          icon={ShieldAlert}
          title="Configuración del consultorio"
          description="Solo el propietario o un administrador pueden agregar veterinarios. Pídeles que te den de alta en Configuración → Equipo."
        />
        <ConfirmActionDialog {...dialogProps} />
      </div>
    );
  }

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Configuración del consultorio</h1>
          <p>Datos de la clínica, cómo agregar veterinarios al equipo y el portal de citas.</p>
        </div>
      </div>

      <AccountPasswordSection />

      {loading ? (
        <ClinicSettingsSkeleton />
      ) : (
        <>
          <form onSubmit={handleSave} className="clinic-settings-card clinic-form">
            <h2>
              <Settings size={18} aria-hidden />
              Datos generales
            </h2>
            <div className="clinic-form-grid-2">
              <div className="form-group">
                <Label htmlFor="org-name">Nombre del consultorio</Label>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <Label htmlFor="org-timezone">Zona horaria</Label>
                <Input
                  id="org-timezone"
                  value={form.timezone}
                  onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
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
            <p className="clinic-team-note">
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
            <p className="clinic-team-note">
              GUIAA no envía un correo de invitación. Primero tu colega crea su propia cuenta;
              después tú lo vinculas a este consultorio con el mismo email.
            </p>
            <ol className="clinic-team-howto">
              <li>
                Pídele que se registre en guiaa.vet (nombre, cédula y el email que vas a usar
                aquí).
              </li>
              <li>
                Cuando ya pueda iniciar sesión (aunque se le cree un consultorio vacío), escribe
                ese email abajo y elige su rol.
              </li>
              <li>
                Pulsa Agregar al equipo. Pídele que cierre sesión y entre de nuevo: verá este
                consultorio, no el suyo vacío.
              </li>
            </ol>
            <p className="clinic-team-note">
              Si tu colega ya abrió GUIAA, se le crea un consultorio vacío. Al agregarlo lo
              movemos al tuyo. Si ya tiene pacientes o citas en su propia clínica, no se puede
              unir con ese email.
            </p>

            <form onSubmit={handleInvite} className="clinic-invite-form">
              <div className="form-group">
                <Label htmlFor="invite-email">Email de registro en GUIAA</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colega@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <Label htmlFor="invite-role">Rol en el consultorio</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITE_ROLES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="clinic-team-role-hint">
                  {INVITE_ROLES.find((item) => item.value === inviteRole)?.hint}
                </p>
              </div>
              <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
                <UserPlus size={16} aria-hidden />
                {inviting ? "Agregando..." : "Agregar al equipo"}
              </Button>
            </form>

            {members.length === 0 ? (
              <ClinicEmptyState
                icon={Users}
                title="Aún no hay colegas en el equipo"
                description="Cuando tu colega ya tenga cuenta GUIAA, agrégalo con su email de registro."
              />
            ) : (
              <>
                {extraMembers.length === 0 && (
                  <p className="clinic-team-note">
                    Tú eres el propietario. Agrega a tus colegas con el formulario de arriba.
                  </p>
                )}
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
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td>{member.nombre || "—"}</td>
                          <td>{member.email || "—"}</td>
                          <td>{ROLE_LABELS[member.role] || member.role}</td>
                          <td>
                            {member.created_at
                              ? new Date(member.created_at).toLocaleDateString("es-MX")
                              : "—"}
                          </td>
                          <td>
                            {member.role !== "owner" && member.profile_id !== veterinarian?.id && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member)}
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
              </>
            )}
          </section>
        </>
      )}
      <ConfirmActionDialog {...dialogProps} />
    </div>
  );
}
