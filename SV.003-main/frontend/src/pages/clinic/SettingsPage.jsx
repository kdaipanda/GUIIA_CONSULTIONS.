import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Save, Users, UserPlus, Trash2, Settings, ShieldAlert, BookOpen, PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./clinicPageShared.css";
import { ConfirmActionDialog } from "../../components/clinic/ConfirmActionDialog";
import { AccountPasswordSection } from "../../components/AccountPasswordSection";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import {
  ClinicSettingsSkeleton,
  ClinicEmptyState,
} from "../../components/clinic/ClinicPageUi";
import { ModuleHelpTip } from "../../components/clinic/ModuleHelpTip";
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
import { requestPlatformOnboarding } from "../../lib/helpCenter";
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
import "./helpCenterPage.css";

const INVITE_ROLE_KEYS = [
  { value: "receptionist", hintKey: "settings.roleHintReceptionist" },
  { value: "admin", hintKey: "settings.roleHintAdmin" },
  { value: "veterinarian", hintKey: "settings.roleHintVeterinarian" },
];

const TEAM_STEPS = [
  { titleKey: "settings.teamStep1Title", bodyKey: "settings.teamStep1" },
  { titleKey: "settings.teamStep2Title", bodyKey: "settings.teamStep2" },
  { titleKey: "settings.teamStep3Title", bodyKey: "settings.teamStep3" },
];

export function SettingsPage({ setView }) {
  const { t, i18n } = useTranslation("clinic");
  const { t: tHelp } = useTranslation("help");
  const { veterinarian } = useVet();
  const { role } = useClinic();
  const { confirm, dialogProps } = useConfirmAction();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: "", timezone: "America/Mexico_City" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("receptionist");
  const [pendingInvites, setPendingInvites] = useState([]);
  const [lastInviteUrl, setLastInviteUrl] = useState("");
  const [lastInviteEmail, setLastInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);

  const isOrgAdmin = role === "owner" || role === "admin";
  const dateLocale = i18n.language?.startsWith("en") ? "en-US" : "es-MX";

  const inviteRoles = useMemo(
    () =>
      INVITE_ROLE_KEYS.map((item) => ({
        ...item,
        label: t(`settings.roles.${item.value}`),
        hint: t(item.hintKey),
      })),
    [t],
  );

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
      notifySuccess(t("settings.orgUpdated"));
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
      notifySuccess(data.message || t("settings.memberAdded"));
      if (data.mode === "invited" && data.invite_url) {
        setLastInviteUrl(data.invite_url);
        setLastInviteEmail(inviteEmail.trim().toLowerCase());
        try {
          await navigator.clipboard.writeText(data.invite_url);
          notifySuccess(t("settings.inviteLinkCopied"));
        } catch {
          /* clipboard opcional: el enlace queda visible abajo */
        }
      } else {
        setLastInviteUrl("");
        setLastInviteEmail("");
      }
      setInviteEmail("");
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const copyLastInvite = async () => {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      notifySuccess(t("settings.inviteLinkCopied"));
    } catch {
      notifyError(t("settings.inviteLinkCopyFailed"));
    }
  };

  const handleRevokeInvite = async (invite) => {
    const ok = await confirm({
      title: t("settings.revokeInviteTitle"),
      description: t("settings.revokeInviteDesc", { email: invite.email }),
      confirmLabel: t("settings.revokeInviteConfirm"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await revokeOrganizationInvite(veterinarian.id, invite.id);
      notifySuccess(t("settings.inviteRevoked"));
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleRemoveMember = async (member) => {
    if (member.role === "owner") return;
    const label = member.nombre || member.email || t("settings.thisMember");
    const ok = await confirm({
      title: t("settings.removeMemberTitle"),
      description: t("settings.removeMemberDesc", { name: label }),
      confirmLabel: t("settings.removeConfirm"),
      destructive: true,
    });
    if (!ok) return;
    try {
      const data = await removeOrganizationMember(veterinarian.id, member.id);
      notifySuccess(data.message || t("settings.memberRemoved"));
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
    notifySuccess(t("settings.portalCopied"));
  };

  const extraMembers = members.filter((m) => m.role !== "owner");

  if (!isOrgAdmin) {
    return (
      <div className="clinic-page clinic-page-guiaa">
        <div className="clinic-page-header">
          <div>
            <p className="clinic-page-eyebrow">{t("settings.accountEyebrow")}</p>
            <div className="clinic-page-title-row">
              <h1>{t("settings.title")}</h1>
              <ModuleHelpTip topicId="settings" setView={setView} />
            </div>
            <p>{t("settings.accountLead")}</p>
          </div>
        </div>
        <AccountPasswordSection />
        <section className="clinic-settings-help-card" aria-label={tHelp("settingsCardTitle")}>
          <div>
            <h2>{tHelp("settingsCardTitle")}</h2>
            <p>{tHelp("settingsCardLead")}</p>
          </div>
          <div className="clinic-settings-help-actions">
            <Button type="button" variant="secondary" onClick={() => setView?.("help")}>
              <BookOpen size={16} aria-hidden />
              {tHelp("settingsOpenHelp")}
            </Button>
            <Button type="button" variant="outline" onClick={() => requestPlatformOnboarding()}>
              <PlayCircle size={16} aria-hidden />
              {tHelp("openTour")}
            </Button>
          </div>
        </section>
        <ClinicEmptyState
          icon={ShieldAlert}
          title={t("settings.lockedTitle")}
          description={t("settings.lockedDesc")}
        />
        <ConfirmActionDialog {...dialogProps} />
      </div>
    );
  }

  return (
    <div className="clinic-page clinic-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">{t("shell.eyebrow")}</p>
          <div className="clinic-page-title-row">
            <h1>{t("settings.titleAdmin")}</h1>
            <ModuleHelpTip topicId="settings" setView={setView} />
          </div>
          <p>{t("settings.leadAdmin")}</p>
        </div>
      </div>

      <section className="clinic-settings-help-card" aria-label={tHelp("settingsCardTitle")}>
        <div>
          <h2>{tHelp("settingsCardTitle")}</h2>
          <p>{tHelp("settingsCardLead")}</p>
        </div>
        <div className="clinic-settings-help-actions">
          <Button type="button" variant="secondary" onClick={() => setView?.("help")}>
            <BookOpen size={16} aria-hidden />
            {tHelp("settingsOpenHelp")}
          </Button>
          <Button type="button" variant="outline" onClick={() => requestPlatformOnboarding()}>
            <PlayCircle size={16} aria-hidden />
            {tHelp("openTour")}
          </Button>
        </div>
      </section>

      <AccountPasswordSection />

      {loading ? (
        <ClinicSettingsSkeleton />
      ) : (
        <>
          <form onSubmit={handleSave} className="clinic-settings-card clinic-form">
            <h2>
              <Settings size={18} aria-hidden />
              {t("settings.general")}
            </h2>
            <div className="clinic-form-grid-2">
              <div className="form-group">
                <Label htmlFor="org-name">{t("settings.orgName")}</Label>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <Label htmlFor="org-timezone">{t("settings.timezone")}</Label>
                <Input
                  id="org-timezone"
                  value={form.timezone}
                  onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              <Save size={16} aria-hidden />
              {saving ? t("common.saving") : t("settings.saveChanges")}
            </Button>
          </form>

          <section className="clinic-settings-card">
            <h2>{t("settings.portalTitle")}</h2>
            <p className="clinic-team-note">{t("settings.portalDesc")}</p>
            <div className="clinic-settings-portal">
              <Input readOnly value={portalUrl} />
              <Button type="button" variant="secondary" onClick={copyPortal}>
                <Copy size={16} aria-hidden />
                {t("settings.copy")}
              </Button>
            </div>
          </section>

          <section className="clinic-settings-card">
            <h2>
              <Users size={18} aria-hidden />
              {t("settings.team")}
            </h2>
            <div className="clinic-team-guide">
              <p className="clinic-team-lead">{t("settings.teamDesc")}</p>
              <ol className="clinic-team-steps" aria-label={t("settings.teamHowToAria")}>
                {TEAM_STEPS.map((step, index) => (
                  <li key={step.titleKey} className="clinic-team-step">
                    <span className="clinic-team-step-num" aria-hidden>
                      {index + 1}
                    </span>
                    <div>
                      <p className="clinic-team-step-title">{t(step.titleKey)}</p>
                      <p className="clinic-team-step-body">{t(step.bodyKey)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="clinic-team-callout">{t("settings.teamOneOrg")}</p>
            </div>

            <div className="clinic-team-add">
              <h3>{t("settings.teamAddHeading")}</h3>
              <form onSubmit={handleInvite} className="clinic-invite-form">
                <div className="form-group">
                  <Label htmlFor="invite-email">{t("settings.inviteEmail")}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder={t("settings.invitePlaceholder")}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="invite-role">{t("settings.inviteRole")}</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {inviteRoles.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="clinic-team-role-hint">
                    {inviteRoles.find((item) => item.value === inviteRole)?.hint}
                  </p>
                </div>
                <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
                  <UserPlus size={16} aria-hidden />
                  {inviting ? t("settings.inviting") : t("settings.sendInvite")}
                </Button>
              </form>
            </div>

            {lastInviteUrl ? (
              <div className="clinic-team-callout" style={{ marginTop: "1rem" }}>
                <p className="clinic-team-step-title">{t("settings.lastInviteTitle")}</p>
                <p className="clinic-team-step-body">
                  {t("settings.lastInviteBody", { email: lastInviteEmail || t("common.emDash") })}
                </p>
                <div className="clinic-settings-portal" style={{ marginTop: "0.75rem" }}>
                  <Input readOnly value={lastInviteUrl} />
                  <Button type="button" variant="secondary" onClick={copyLastInvite}>
                    <Copy size={16} aria-hidden />
                    {t("settings.copy")}
                  </Button>
                </div>
              </div>
            ) : null}

            {pendingInvites.length > 0 ? (
              <div className="clinic-team-pending">
                <h3>{t("settings.pendingInvites")}</h3>
                <div className="clinic-table-wrap">
                  <table className="clinic-table">
                    <thead>
                      <tr>
                        <th>{t("settings.memberEmail")}</th>
                        <th>{t("settings.memberRole")}</th>
                        <th>{t("settings.inviteExpires")}</th>
                        <th aria-label={t("common.actionsAria")} />
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInvites.map((invite) => (
                        <tr key={invite.id}>
                          <td>{invite.email}</td>
                          <td>{t(`settings.roles.${invite.role}`, { defaultValue: invite.role })}</td>
                          <td>
                            {invite.expires_at
                              ? new Date(invite.expires_at).toLocaleDateString(dateLocale)
                              : t("common.emDash")}
                          </td>
                          <td>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvite(invite)}
                              aria-label={t("settings.revokeInviteAria")}
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
                title={t("settings.noMembers")}
                description={t("settings.noMembersDesc")}
              />
            ) : (
              <>
                {extraMembers.length === 0 && (
                  <p className="clinic-team-note">{t("settings.teamOwnerNote")}</p>
                )}
                <div className="clinic-table-wrap">
                  <table className="clinic-table">
                    <thead>
                      <tr>
                        <th>{t("settings.memberName")}</th>
                        <th>{t("settings.memberEmail")}</th>
                        <th>{t("settings.memberRole")}</th>
                        <th>{t("settings.memberSince")}</th>
                        <th aria-label={t("common.actionsAria")} />
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td>{member.nombre || t("common.emDash")}</td>
                          <td>{member.email || t("common.emDash")}</td>
                          <td>{t(`settings.roles.${member.role}`, { defaultValue: member.role })}</td>
                          <td>
                            {member.created_at
                              ? new Date(member.created_at).toLocaleDateString(dateLocale)
                              : t("common.emDash")}
                          </td>
                          <td>
                            {member.role !== "owner" && member.profile_id !== veterinarian?.id && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member)}
                                aria-label={t("settings.removeMemberAria")}
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
