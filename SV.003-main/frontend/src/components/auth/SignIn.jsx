import React, { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { GuiaaLogoImg } from "../GuiaaBrandLockup";
import { notifyError } from "../../lib/appToast";
import "./signIn.css";

const LOGIN_VIDEO = "/04-prueba.mp4";
const REMEMBER_KEY = "guiaa_remember_email";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M5.3 14.3l-.8.6-2.5 2c1.6 3.1 4.9 5.1 8.5 5.1 2.6 0 4.7-.8 6.3-2.3l-3.1-2.4c-.8.6-1.9.9-3.2.9-2.5 0-4.6-1.7-5.3-3.9z"
      />
      <path
        fill="#4A90E2"
        d="M3.9 7.1C3.3 8.3 3 9.6 3 11s.3 2.7.9 3.9c0 .1 5.3-4.1 5.3-4.1C8.5 8.6 10.1 7 12 7c1.2 0 2.3.4 3.1 1.2l2.7-2.7C16.2 3.9 14.2 3 12 3 8.4 3 5.2 5 3.9 7.1z"
      />
      <path
        fill="#FBBC05"
        d="M12 7c1.2 0 2.3.4 3.1 1.2l2.7-2.7C16.2 3.9 14.2 3 12 3 8.4 3 5.2 5 3.9 7.1l3.4 2.6C8.1 8.1 9.9 7 12 7z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.2-.8-2.2-3.6zM14.7 6.4c.6-.7 1-1.7.9-2.7-1 .1-2.1.6-2.8 1.4-.6.7-1.1 1.7-.9 2.7 1 0 2-.5 2.8-1.4z" />
    </svg>
  );
}

export function SignIn({
  setView,
  formData,
  setFormData,
  legacyLogin,
  setLegacyLogin,
  loading,
  pending2FA,
  twoFactorCode,
  setTwoFactorCode,
  verifying2FA,
  onSubmit,
  onVerify2FA,
  onResetToLogin,
}) {
  const { t } = useTranslation("auth");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prevHtml = root.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    root.style.backgroundColor = "#0c2d4d";
    body.style.backgroundColor = "#0c2d4d";
    root.setAttribute("data-auth-signin", "1");
    return () => {
      root.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
      root.removeAttribute("data-auth-signin");
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setFormData((prev) => ({ ...prev, email: saved }));
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, [setFormData]);

  const persistRemember = () => {
    try {
      if (rememberMe && formData.email) {
        localStorage.setItem(REMEMBER_KEY, formData.email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = (event) => {
    persistRemember();
    onSubmit?.(event);
  };

  const handleSocial = (provider) => {
    notifyError(t("login.socialSoon", { provider }));
  };

  return (
    <div className="signin-page antialiased">
      <div className="signin-card">
        <aside className="signin-media" aria-hidden="true">
          <video
            className="signin-media-video"
            src={LOGIN_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="signin-media-shade" />
          <div className="signin-media-brand">
            <GuiaaLogoImg tone="on-dark" className="signin-media-logo" />
            <p>{t("shell.trustLine")}</p>
          </div>
        </aside>

        <section className="signin-panel">
          <div className="signin-panel-top">
            <button
              type="button"
              className="signin-back"
              onClick={() => setView("landing")}
            >
              <ArrowLeft size={16} aria-hidden />
              {t("login.backHome")}
            </button>
            <LanguageSwitcher />
          </div>

          <div className="signin-panel-body">
            <div className="signin-heading">
              <p className="signin-kicker" translate="no">
                GUIAA
              </p>
              <h1>{pending2FA ? t("twoFactor.title") : t("login.welcomeBack")}</h1>
              <p>
                {pending2FA
                  ? t("twoFactor.hint")
                  : legacyLogin
                    ? t("login.subtitleLegacy")
                    : t("login.subtitlePassword")}
              </p>
            </div>

            {!pending2FA ? (
              <form onSubmit={handleSubmit} className="signin-form">
                <div className="signin-field">
                  <Label htmlFor="signin-email">{t("login.email")}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder={t("login.emailPlaceholder")}
                    className="signin-input"
                  />
                </div>

                {!legacyLogin ? (
                  <div className="signin-field">
                    <Label htmlFor="signin-password">{t("login.password")}</Label>
                    <div className="signin-password-wrap">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder={t("login.passwordPlaceholder")}
                        className="signin-input signin-input--password"
                      />
                      <button
                        type="button"
                        className="signin-password-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword
                            ? t("login.hidePassword")
                            : t("login.showPassword")
                        }
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="signin-field">
                    <Label htmlFor="signin-cedula">{t("login.license")}</Label>
                    <Input
                      id="signin-cedula"
                      type="text"
                      required
                      autoComplete="off"
                      value={formData.cedula_profesional}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cedula_profesional: e.target.value,
                        })
                      }
                      placeholder={t("login.licensePlaceholder")}
                      className="signin-input"
                    />
                  </div>
                )}

                {!legacyLogin && (
                  <div className="signin-row">
                    <label className="signin-remember" htmlFor="signin-remember">
                      <Checkbox
                        id="signin-remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <span>{t("login.rememberMe")}</span>
                    </label>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="signin-submit">
                  {loading ? t("login.submitting") : t("login.signIn")}
                </Button>

                <button
                  type="button"
                  className="signin-link-btn"
                  onClick={() => {
                    setLegacyLogin((prev) => !prev);
                    notifyError("");
                  }}
                >
                  {legacyLogin ? t("login.usePassword") : t("login.useLegacy")}
                </button>

                {!legacyLogin && (
                  <>
                    <div className="signin-divider" role="separator">
                      <span>{t("login.orContinue")}</span>
                    </div>

                    <div className="signin-social">
                      <button
                        type="button"
                        className="signin-social-btn"
                        onClick={() => handleSocial("Google")}
                      >
                        <GoogleIcon />
                        {t("login.continueGoogle")}
                      </button>
                      <button
                        type="button"
                        className="signin-social-btn"
                        onClick={() => handleSocial("Apple")}
                      >
                        <AppleIcon />
                        {t("login.continueApple")}
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={onVerify2FA} className="signin-form">
                <div className="signin-field">
                  <Label htmlFor="signin-2fa">{t("twoFactor.label")}</Label>
                  <Input
                    id="signin-2fa"
                    type="text"
                    required
                    inputMode="numeric"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder={t("twoFactor.placeholder")}
                    maxLength={6}
                    autoFocus
                    className="signin-input tracking-widest"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={verifying2FA}
                  className="signin-submit"
                >
                  {verifying2FA ? t("twoFactor.submitting") : t("twoFactor.submit")}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={onResetToLogin}
                  className="w-full"
                >
                  {t("twoFactor.back")}
                </Button>
              </form>
            )}

            <p className="signin-footer">
              {t("login.noAccount")}{" "}
              <button
                type="button"
                className="signin-footer-link"
                onClick={() => setView("register")}
              >
                {t("login.registerLink")}
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
