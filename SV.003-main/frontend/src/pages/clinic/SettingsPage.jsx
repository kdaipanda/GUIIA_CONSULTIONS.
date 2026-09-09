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
  createOrganizationInvite,
  fetchOrganizationInvites,
  revokeOrganizationInvite,
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
    value: "receptionist",
    label: "Recepción",
    hint: "Agenda, dueños y pacientes. Sin consultas CDS. Alta sin cédula.",
  },
  {
    value: "admin",
    label: "Administrador",
    hint: "Configurar el consultorio y el equipo. Alta sin cédula.",
  },
  {
    value: "veterinarian",
    label: "Veterinario",
    hint: "Consultas CDS, expediente, pacientes y agenda. Requiere cédula.",
  },
];

const TEAM_STEPS = [
  {
    title: "Elige el rol",
    body:
      "Recepción: agenda, dueños y pacientes (sin consultas CDS). Administrador: configura el consultorio y el equipo. Veterinario: consultas CDS y expediente. Recepción y admin no necesitan cédula; el veterinario sí, con la suya (no la tuya).",
  },
  {
    title: "Escribe el email y envía",
    body:
      "Pon el correo de tu colega abajo y pulsa «Enviar invitación». Si ya tiene cuenta GUIAA, entra a tu equipo al momento. Si no, le mandamos un correo con un enlace (también se copia al portapapeles por si no llega).",
  },
  {
    title: "Tu colega completa el alta",
    body:
      "Abre el enlace, crea su contraseña y acepta. Recepción/admin: formulario corto. Veterinario: cédula y documento. Al terminar, que cierre sesión y vuelva a entrar: verá este consultorio.",
  },
];

export function SettingsPage() {
  const { veterinarian } = useVet();
  const { role } = useClinic();
  const { confirm, dialogProps } = useConfirmAction();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [form, setForm] = useState({ name: "", timezone: "America/Mexico_City" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("receptionist");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);

  const isOrgAdmin = role === "owner" || role === "admin";

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    try {
      const [data, invitesData] = await Promise.all([
        fetchOrganization(veterinarian.id),
        fetchOrganizationInvites(veterinarian.id).catch(() => ({ invites: [] })),
      ]);
      setOrg(data.organization || null);
      setMembers(data.members || []);
      setPendingInvites(invitesData.invites || []);
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
      const data = await createOrganizationInvite(
        veterinarian.id,
        inviteEmail.trim().toLowerCase(),
        inviteRole,
      );
      notifySuccess(data.message || "Invitación enviada.");
      if (data.mode === "invited" && data.invite_url) {
        try {
          await navigator.clipboard.writeText(data.invite_url);
          notifySuccess("Enlace de invitación copiado al portapapeles.");
        } catch {
          /* clipboard opcional */
        }
      }
      setInviteEmail("");
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (invite) => {
    const ok = await confirm({
      title: "Cancelar invitación",
      description: `¿Cancelar la invitación a ${invite.email}?`,
      confirmLabel: "Cancelar",
      destructive: true,
    });
    if (!ok) return;
    try {
      await revokeOrganizationInvite(veterinarian.id, invite.id);
      notifySuccess("Invitación cancelada.");
      load();
    } catch (err) {
      notifyError(err.message);
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
          <p>Datos de la clínica, cómo invitar al equipo y el portal de citas.</p>
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
            <div className="clinic-team-guide">
              <p className="clinic-team-lead">
                Así agregas a tu equipo en GUIAA. No hace falta que se den de alta solos primero:
                tú los invitas y ellos terminan el registro con el enlace.
              </p>
              <ol className="clinic-team-steps" aria-label="Pasos para invitar al equipo">
                {TEAM_STEPS.map((step, index) => (
                  <li key={step.title} className="clinic-team-step">
                    <span className="clinic-team-step-num" aria-hidden>
                      {index + 1}
                    </span>
                    <div>
                      <p className="clinic-team-step-title">{step.title}</p>
                      <p className="clinic-team-step-body">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="clinic-team-callout">
                Importante: una cuenta solo puede estar en un consultorio. Si tu colega ya abrió
                GUIAA solo, lo pasamos a tu clínica (con dueños y pacientes si tenía). Si ya
                pertenece a otro equipo con más gente, primero debe salir de esa organización.
              </p>
            </div>

            <div className="clinic-team-add">
              <h3>Invitar colega</h3>
              <form onSubmit={handleInvite} className="clinic-invite-form">
                <div className="form-group">
                  <Label htmlFor="invite-email">Email del colega</Label>
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
                  {inviting ? "Enviando..." : "Enviar invitación"}
                </Button>
              </form>
            </div>

            {pendingInvites.length > 0 ? (
              <div className="clinic-team-pending">
                <h3>Invitaciones pendientes</h3>
                <div className="clinic-table-wrap">
                  <table className="clinic-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Vence</th>
                        <th aria-label="Acciones" />
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInvites.map((invite) => (
                        <tr key={invite.id}>
                          <td>{invite.email}</td>
                          <td>{ROLE_LABELS[invite.role] || invite.role}</td>
                          <td>
                            {invite.expires_at
                              ? new Date(invite.expires_at).toLocaleDateString("es-MX")
                              : "—"}
                          </td>
                          <td>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvite(invite)}
                              aria-label="Cancelar invitación"
                            >
                              <Trash2 size={16} aria-hidden />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {members.length === 0 ? (
              <ClinicEmptyState
                icon={Users}
                title="Aún no hay colegas en el equipo"
                description="Invita por email. Recepción y admin pueden darse de alta sin cédula."
              />
            ) : (
              <>
                {extraMembers.length === 0 && (
                  <p className="clinic-team-note">
                    Tú eres el propietario. Invita a tus colegas con el formulario de arriba.
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
