import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Save } from "lucide-react";
import { useVet } from "../context/VetContext";
import { BACKEND_URL } from "../lib/backendUrl";
import { getAuthHeaders } from "../lib/authHeaders";
import { notifyError, notifySuccess } from "../lib/appToast";
import { getPasswordValidationError, PASSWORD_RULES_ATTR } from "../lib/passwordPolicy";
import { PasswordRequirementsHint } from "./PasswordRequirementsHint";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AccountPasswordSection() {
  const { t } = useTranslation("auth");
  const { veterinarian, refreshProfile } = useVet();
  const [hasPassword, setHasPassword] = useState(!!veterinarian?.has_password);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!veterinarian?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        headers: getAuthHeaders(veterinarian.id),
      });
      if (res.ok) {
        const data = await res.json();
        setHasPassword(!!data.has_password);
      }
    } catch {
      /* perfil opcional */
    }
  }, [veterinarian?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      notifyError(passwordError);
      return;
    }
    if (password !== confirm) {
      notifyError(t("password.account.mismatch"));
      return;
    }
    if (hasPassword && !currentPassword.trim()) {
      notifyError(t("password.account.currentRequired"));
      return;
    }

    setSaving(true);
    try {
      const body = { password };
      if (hasPassword) {
        body.current_password = currentPassword;
      }
      const res = await fetch(`${BACKEND_URL}/api/auth/set-password`, {
        method: "POST",
        headers: getAuthHeaders(veterinarian.id),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || t("password.account.saveFailed"));
      }
      notifySuccess(data.message || t("password.account.saved"));
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      setHasPassword(true);
      refreshProfile?.();
    } catch (err) {
      notifyError(err.message || t("password.account.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!veterinarian?.id) return null;

  return (
    <form onSubmit={handleSubmit} className="clinic-settings-card clinic-form">
      <h2>
        <KeyRound size={18} aria-hidden />
        {t("password.account.title")}
      </h2>
      <p className="clinic-muted clinic-tools-desc">
        {hasPassword ? t("password.account.leadChange") : t("password.account.leadCreate")}
      </p>
      {hasPassword && (
        <div className="form-group">
          <Label htmlFor="acct-current-pw">{t("password.account.current")}</Label>
          <Input
            id="acct-current-pw"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
      )}
      <div className="clinic-form-grid-2">
        <div className="form-group">
          <Label htmlFor="acct-new-pw">
            {hasPassword ? t("password.account.new") : t("password.account.create")}
          </Label>
          <Input
            id="acct-new-pw"
            type="password"
            autoComplete="new-password"
            minLength={6}
            passwordrules={PASSWORD_RULES_ATTR}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password.account.placeholder")}
            required
            aria-describedby="acct-password-hint"
          />
          <PasswordRequirementsHint password={password} className="mt-2" id="acct-password-hint" />
        </div>
        <div className="form-group">
          <Label htmlFor="acct-confirm-pw">{t("password.account.confirm")}</Label>
          <Input
            id="acct-confirm-pw"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={saving}>
        <Save size={16} aria-hidden />
        {saving
          ? t("password.account.saving")
          : hasPassword
            ? t("password.account.update")
            : t("password.account.createBtn")}
      </Button>
    </form>
  );
}
