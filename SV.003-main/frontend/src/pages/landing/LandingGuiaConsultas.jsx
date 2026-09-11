import React, { useState } from "react";
import { Megaphone, Target, Users, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { submitGuiaConsultasLead } from "../../lib/clinicApi";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { LANDING_IMAGES } from "./landingBrandAssets";
import "./landingGuiaConsultas.css";

const INITIAL = {
  name: "",
  email: "",
  phone: "",
  message: "",
  privacy_accepted: false,
};

const VALUE_PROP_KEYS = [
  { icon: Target, key: "moment" },
  { icon: Zap, key: "intent" },
  { icon: Users, key: "reach" },
];

export function LandingGuiaConsultas() {
  const { t } = useTranslation("landing");
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      notifyError(t("guiaConsultas.errorNameEmail"));
      return;
    }
    if (!form.privacy_accepted) {
      notifyError(t("guiaConsultas.errorPrivacy"));
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitGuiaConsultasLead({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim() || undefined,
        privacy_accepted: true,
      });
      notifySuccess(data.message || t("guiaConsultas.sentTitle"));
      setForm(INITIAL);
      setSent(true);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="guia-consultas"
      className="landing-section landing-guia-consultas-section"
      aria-labelledby="landing-guia-consultas-heading"
    >
      <div className="landing-container">
        <div className="landing-guia-consultas-panel">
          <div className="landing-guia-consultas-accent" aria-hidden />

          <div className="landing-guia-consultas-grid">
            <div className="landing-guia-consultas-copy">
              <div className="landing-guia-consultas-brand-row">
                <span className="landing-guia-ads-badge">{t("guiaConsultas.badge")}</span>
                <span className="landing-guia-consultas-eyebrow">
                  {t("guiaConsultas.eyebrow")}
                </span>
              </div>

              <h2 id="landing-guia-consultas-heading" className="landing-guia-consultas-title">
                {t("guiaConsultas.title")}
              </h2>
              <p className="landing-guia-consultas-lead">{t("guiaConsultas.lead")}</p>

              <ul className="landing-guia-value-props">
                {VALUE_PROP_KEYS.map(({ icon: Icon, key }) => (
                  <li key={key} className="landing-guia-value-prop">
                    <span className="landing-guia-value-prop-icon" aria-hidden>
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <div>
                      <strong>{t(`guiaConsultas.props.${key}.title`)}</strong>
                      <p>{t(`guiaConsultas.props.${key}.text`)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="landing-guia-plumitas-wrap" aria-hidden>
                <img
                  src={LANDING_IMAGES.mascotFlyingCutout}
                  alt=""
                  className="landing-guia-plumitas"
                  width={120}
                  height={120}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            <div className="landing-guia-consultas-form-col">
              <div className="landing-guia-consultas-form-wrap">
                {sent ? (
                  <div className="landing-guia-consultas-success" role="status">
                    <p className="landing-guia-consultas-success-title">
                      {t("guiaConsultas.sentTitle")}
                    </p>
                    <p className="landing-guia-consultas-success-text">
                      {t("guiaConsultas.sentText")}
                    </p>
                    <button
                      type="button"
                      className="landing-guia-consultas-submit"
                      onClick={() => setSent(false)}
                    >
                      {t("guiaConsultas.sentAgain")}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="landing-guia-form-head">
                      <span className="landing-guia-form-head-icon" aria-hidden>
                        <Megaphone size={20} strokeWidth={2} />
                      </span>
                      <div>
                        <h3 className="landing-guia-form-kicker">
                          {t("guiaConsultas.formTitle")}
                        </h3>
                        <p className="landing-guia-form-sub">{t("guiaConsultas.formSub")}</p>
                      </div>
                    </div>

                    <form
                      className="landing-guia-consultas-form"
                      onSubmit={handleSubmit}
                      noValidate
                    >
                      <div className="landing-guia-field">
                        <Label htmlFor="gc-name">{t("guiaConsultas.name")}</Label>
                        <Input
                          id="gc-name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder={t("guiaConsultas.namePlaceholder")}
                          autoComplete="organization"
                          required
                          className="landing-guia-input"
                        />
                      </div>
                      <div className="landing-guia-field-row">
                        <div className="landing-guia-field">
                          <Label htmlFor="gc-email">{t("guiaConsultas.email")}</Label>
                          <Input
                            id="gc-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder={t("guiaConsultas.emailPlaceholder")}
                            autoComplete="email"
                            required
                            className="landing-guia-input"
                          />
                        </div>
                        <div className="landing-guia-field">
                          <Label htmlFor="gc-phone">{t("guiaConsultas.phone")}</Label>
                          <Input
                            id="gc-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder={t("guiaConsultas.phonePlaceholder")}
                            autoComplete="tel"
                            className="landing-guia-input"
                          />
                        </div>
                      </div>
                      <div className="landing-guia-field">
                        <Label htmlFor="gc-message">{t("guiaConsultas.message")}</Label>
                        <Textarea
                          id="gc-message"
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder={t("guiaConsultas.messagePlaceholder")}
                          rows={3}
                          className="landing-guia-input landing-guia-textarea"
                        />
                      </div>

                      <label className="landing-guia-privacy">
                        <Checkbox
                          checked={form.privacy_accepted}
                          onCheckedChange={(checked) =>
                            setForm({ ...form, privacy_accepted: checked === true })
                          }
                        />
                        <span>{t("guiaConsultas.privacy")}</span>
                      </label>

                      <button
                        type="submit"
                        className="landing-guia-consultas-submit"
                        disabled={submitting}
                      >
                        {submitting
                          ? t("guiaConsultas.submitting")
                          : t("guiaConsultas.submit")}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
