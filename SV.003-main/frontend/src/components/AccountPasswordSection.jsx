import React, { useCallback, useEffect, useState } from "react";
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
      notifyError("Las contraseñas no coinciden.");
      return;
    }
    if (hasPassword && !currentPassword.trim()) {
      notifyError("Ingresa tu contraseña actual.");
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
        throw new Error(data.detail || "No se pudo guardar la contraseña");
      }
      notifySuccess(data.message || "Contraseña guardada.");
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      setHasPassword(true);
      refreshProfile?.();
    } catch (err) {
      notifyError(err.message || "Error al guardar contraseña");
    } finally {
      setSaving(false);
    }
  };

  if (!veterinarian?.id) return null;

  return (
    <form onSubmit={handleSubmit} className="clinic-settings-card clinic-form">
      <h2>
        <KeyRound size={18} aria-hidden />
        Seguridad de tu cuenta
      </h2>
      <p className="clinic-muted clinic-tools-desc">
        {hasPassword
          ? "Cambia la contraseña con la que inicias sesión en GUIAA."
          : "Tu cuenta usa login con matrícula. Crea una contraseña para acceder de forma más segura."}
      </p>
      {hasPassword && (
        <div className="form-group">
          <Label htmlFor="acct-current-pw">Contraseña actual</Label>
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
            {hasPassword ? "Nueva contraseña" : "Contraseña"}
          </Label>
          <Input
            id="acct-new-pw"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            passwordrules={PASSWORD_RULES_ATTR}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ej. Clinica2024"
            required
            aria-describedby="acct-password-hint"
          />
          <PasswordRequirementsHint password={password} className="mt-2" id="acct-password-hint" />
        </div>
        <div className="form-group">
          <Label htmlFor="acct-confirm-pw">Confirmar</Label>
          <Input
            id="acct-confirm-pw"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={saving}>
        <Save size={16} aria-hidden />
        {saving ? "Guardando..." : hasPassword ? "Actualizar contraseña" : "Crear contraseña"}
      </Button>
    </form>
  );
}
