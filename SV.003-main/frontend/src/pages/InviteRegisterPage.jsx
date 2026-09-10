import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthPageShell } from "../layout/AuthPageShell";
import { GuiaaBrandLockup } from "../components/GuiaaBrandLockup";
import { TermsAndConditionsModal } from "../components/TermsAndConditionsModal";
import { PasswordRequirementsHint } from "../components/PasswordRequirementsHint";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { getBackendUrl } from "../lib/backendUrl";
import { useVet } from "../context/VetContext";
import {
  getPasswordValidationError,
  normalizePasswordInput,
  PASSWORD_RULES_ATTR,
} from "../lib/passwordPolicy";
import { notifyError } from "../lib/appToast";
import { friendlyFetchError, formatApiErrorDetail, parseJsonResponse } from "../lib/friendlyFetchError";
import { persistAuthFromResponse } from "../lib/authHeaders";

const ROLE_LABELS = {
  receptionist: "Recepción",
  admin: "Administrador",
  veterinarian: "Veterinario",
};

/**
 * Alta por invitación (?invite=TOKEN) — español para producción sin i18n.
 * Tras el formulario exige OTP al email invitado antes de crear la cuenta.
 */
export function InviteRegisterPage({ setView, setCedulaFlow, onAuthSuccess }) {
  const { login } = useVet();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("invite") || "").trim();

  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [cedulaFile, setCedulaFile] = useState(null);
  const [step, setStep] = useState("form"); // form | verify
  const [pendingNonce, setPendingNonce] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resending, setResending] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    password: "",
    password_confirm: "",
    profesional_pais: "MX",
    cedula_profesional: "",
    especialidad: "",
    años_experiencia: "",
    institucion: "",
  });

  const requiresLicense = Boolean(invite?.requires_license);
  const backend = getBackendUrl();
  const roleLabel = ROLE_LABELS[invite?.role] || invite?.role || "";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setLoadError("Falta el enlace de invitación.");
        setLoadingInvite(false);
        return;
      }
      setLoadingInvite(true);
      try {
        const res = await fetch(`${backend}/api/auth/invite/${encodeURIComponent(token)}`);
        const data = await parseJsonResponse(res, {});
        if (!res.ok) {
          throw new Error(
            formatApiErrorDetail(data.detail, friendlyFetchError(res.status, backend)) ||
              "Esta invitación no es válida o ya expiró.",
          );
        }
        if (!cancelled) setInvite(data.invite || null);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Invitación no válida");
      } finally {
        if (!cancelled) setLoadingInvite(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, backend]);

  const finishAuth = (data, password) => {
    persistAuthFromResponse(data);
    login(data);

    if (requiresLicense) {
      setCedulaFlow?.({
        source: "register",
        veterinarian_id: data?.id,
        email: invite.email,
        cedula_profesional: formData.cedula_profesional,
        expected_nombre: formData.nombre,
        needs_upload: false,
        file: cedulaFile,
        login_password: password,
      });
      setView("cedula-verification");
    } else {
      onAuthSuccess?.(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      notifyError("Debes aceptar los términos y la política de privacidad para registrarte.");
      return;
    }
    const phoneDigits = String(formData.telefono || "").replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      notifyError("Ingresa un número de teléfono válido (mínimo 8 dígitos).");
      return;
    }
    if (requiresLicense) {
      if (!cedulaFile) {
        notifyError("Debes subir el documento de tu registro profesional (PDF/JPG/PNG).");
        return;
      }
      if (!formData.especialidad?.trim()) {
        notifyError("Selecciona una especialidad.");
        return;
      }
    }
    const passwordError = getPasswordValidationError(formData.password);
    if (passwordError) {
      notifyError(passwordError);
      return;
    }
    const password = normalizePasswordInput(formData.password);
    const passwordConfirm = normalizePasswordInput(formData.password_confirm);
    if (password !== passwordConfirm) {
      notifyError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        token,
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        password,
        profesional_pais: formData.profesional_pais || "MX",
      };
      if (requiresLicense) {
        payload.cedula_profesional = formData.cedula_profesional;
        payload.especialidad = formData.especialidad;
        payload.años_experiencia = parseInt(formData.años_experiencia, 10) || 0;
        payload.institucion = formData.institucion;
      }

      const response = await fetch(`${backend}/api/auth/register-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse(response, {});
      if (!response.ok) {
        throw new Error(
          formatApiErrorDetail(data.detail, friendlyFetchError(response.status, backend)) ||
            "Error en el registro",
        );
      }

      if (data.status === "pending_email_verification" && data.nonce) {
        setPendingNonce(data.nonce);
        setPendingEmail(data.email || invite.email || "");
        setOtpCode("");
        setStep("verify");
        return;
      }

      // Compat con backend viejo que aún creaba la cuenta de inmediato
      finishAuth(data, password);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = String(otpCode || "").trim();
    if (code.length < 4) {
      notifyError("Ingresa el código de 6 dígitos.");
      return;
    }
    if (!pendingNonce) {
      notifyError("La sesión de verificación expiró. Vuelve a completar el formulario.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backend}/api/auth/register-invite/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: pendingNonce, code }),
      });
      const data = await parseJsonResponse(response, {});
      if (!response.ok) {
        throw new Error(
          formatApiErrorDetail(data.detail, friendlyFetchError(response.status, backend)) ||
            "No se pudo verificar el código.",
        );
      }
      finishAuth(data, normalizePasswordInput(formData.password));
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingNonce || resending) return;
    setResending(true);
    try {
      const response = await fetch(`${backend}/api/auth/register-invite/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: pendingNonce }),
      });
      const data = await parseJsonResponse(response, {});
      if (!response.ok) {
        throw new Error(
          formatApiErrorDetail(data.detail, friendlyFetchError(response.status, backend)) ||
            "No se pudo reenviar el código.",
        );
      }
      if (data.nonce) setPendingNonce(data.nonce);
      if (data.email) setPendingEmail(data.email);
      setOtpCode("");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setResending(false);
    }
  };

  if (loadingInvite) {
    return (
      <AuthPageShell setView={setView}>
        <GuiaaBrandLockup variant="auth" className="mb-6" />
        <p>Cargando invitación…</p>
      </AuthPageShell>
    );
  }

  if (loadError || !invite) {
    return (
      <AuthPageShell setView={setView}>
        <GuiaaBrandLockup variant="auth" className="mb-6" />
        <h2>Invitación no válida</h2>
        <p>{loadError || "Esta invitación no es válida o ya expiró."}</p>
        <Button type="button" className="mt-4" onClick={() => setView("login")}>
          Ir a iniciar sesión
        </Button>
      </AuthPageShell>
    );
  }

  if (step === "verify") {
    return (
      <AuthPageShell setView={setView}>
        <GuiaaBrandLockup variant="auth" className="mb-6" />
        <h2>Confirma tu email</h2>
        <p>
          Enviamos un código de 6 dígitos a{" "}
          <strong>{pendingEmail || invite.email || ""}</strong>. Ingrésalo para crear tu cuenta.
        </p>
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <div className="form-group">
            <Label htmlFor="inv-otp">Código de verificación</Label>
            <Input
              id="inv-otp"
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Código de 6 dígitos"
              maxLength={6}
              autoFocus
              className="mt-1.5 h-11 min-h-11 bg-background tracking-widest"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Válido por 15 minutos. Revisa también spam.
            </p>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Verificando…" : "Verificar y unirme"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={resending}
            onClick={handleResendCode}
            className="mt-2.5 w-full"
          >
            {resending ? "Reenviando…" : "Reenviar código"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStep("form");
              setPendingNonce("");
              setOtpCode("");
            }}
            className="mt-2.5 w-full"
          >
            Volver al formulario
          </Button>
        </form>
      </AuthPageShell>
    );
  }

  return (
    <>
      <AuthPageShell setView={setView} wide={requiresLicense}>
        <GuiaaBrandLockup variant="auth" className="mb-6" />
        <h2>Únete al consultorio</h2>
        <p>
          Te invitaron a {invite.organization_name || "un consultorio en GUIAA"} como {roleLabel}.
        </p>
        {!requiresLicense ? (
          <p className="text-sm text-muted-foreground mt-2">
            Cuenta de equipo: no necesitas cédula profesional.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <Label htmlFor="inv-nombre">Nombre completo *</Label>
            <Input
              id="inv-nombre"
              required
              autoComplete="name"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="mt-1.5 h-11"
            />
          </div>

          <div className="form-group">
            <Label htmlFor="inv-email">Email *</Label>
            <Input
              id="inv-email"
              type="email"
              readOnly
              value={invite.email || ""}
              className="mt-1.5 h-11 bg-muted"
            />
          </div>

          <div className="form-group">
            <Label htmlFor="inv-telefono">Teléfono / WhatsApp *</Label>
            <Input
              id="inv-telefono"
              type="tel"
              required
              autoComplete="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="+52 55 1234 5678"
              className="mt-1.5 h-11"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <Label htmlFor="inv-password">Contraseña *</Label>
              <Input
                id="inv-password"
                type="password"
                required
                autoComplete="new-password"
                passwordrules={PASSWORD_RULES_ATTR}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1.5 h-11"
              />
              <PasswordRequirementsHint password={formData.password} />
            </div>
            <div className="form-group">
              <Label htmlFor="inv-password-confirm">Confirmar contraseña *</Label>
              <Input
                id="inv-password-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={formData.password_confirm}
                onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          {requiresLicense ? (
            <>
              <div className="form-group">
                <Label htmlFor="inv-cedula">Nº matrícula / licencia / registro *</Label>
                <Input
                  id="inv-cedula"
                  required
                  value={formData.cedula_profesional}
                  onChange={(e) => setFormData({ ...formData, cedula_profesional: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>
              <div className="form-group">
                <Label htmlFor="inv-license-file">Documento profesional (PDF/JPG/PNG) *</Label>
                <Input
                  id="inv-license-file"
                  type="file"
                  accept=".pdf,image/*"
                  required
                  onChange={(e) => setCedulaFile(e.target.files?.[0] || null)}
                  className="mt-1.5"
                />
              </div>
              <div className="form-group">
                <Label htmlFor="inv-specialty">Especialidad *</Label>
                <Select
                  value={formData.especialidad || undefined}
                  onValueChange={(v) => setFormData({ ...formData, especialidad: v })}
                >
                  <SelectTrigger id="inv-specialty" className="mt-1.5 h-11">
                    <SelectValue placeholder="Seleccione una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pequeñas Especies">Pequeñas Especies</SelectItem>
                    <SelectItem value="Animales de Producción">Animales de Producción</SelectItem>
                    <SelectItem value="Equinos">Equinos</SelectItem>
                    <SelectItem value="Animales Exóticos">Animales Exóticos</SelectItem>
                    <SelectItem value="Medicina Preventiva">Medicina Preventiva</SelectItem>
                    <SelectItem value="Patología">Patología</SelectItem>
                    <SelectItem value="Cirugía">Cirugía</SelectItem>
                    <SelectItem value="Medicina Interna">Medicina Interna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="inv-years">Años de experiencia *</Label>
                  <Input
                    id="inv-years"
                    type="number"
                    min={0}
                    required
                    value={formData.años_experiencia}
                    onChange={(e) => setFormData({ ...formData, años_experiencia: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="inv-inst">Institución *</Label>
                  <Input
                    id="inv-inst"
                    required
                    value={formData.institucion}
                    onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
            </>
          ) : null}

          <label className="auth-terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              He leído y acepto los{" "}
              <button type="button" className="auth-link" onClick={() => setShowTermsModal(true)}>
                Términos y Condiciones de Uso
              </button>{" "}
              de la Plataforma GUIAA
            </span>
          </label>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Enviando código…" : "Continuar y verificar email"}
          </Button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes una cuenta?{" "}
          <button type="button" className="auth-link" onClick={() => setView("login")}>
            Inicia Sesión
          </button>
        </p>
      </AuthPageShell>
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAcceptedTerms(true);
          setShowTermsModal(false);
        }}
      />
    </>
  );
}
