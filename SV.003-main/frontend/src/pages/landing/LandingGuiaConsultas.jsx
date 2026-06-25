import React, { useState } from "react";
import { Megaphone, Target, Users, Zap } from "lucide-react";
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

const VALUE_PROPS = [
  {
    icon: Target,
    title: "Momento de decisión",
    text: "Tu marca aparece cuando el MVZ y el tutor evalúan tratamiento o producto.",
  },
  {
    icon: Zap,
    title: "Alta intención",
    text: "Contexto clínico real, no banners genéricos en sitios ajenos.",
  },
  {
    icon: Users,
    title: "Alcance MVZ",
    text: "Médicos veterinarios certificados en Latinoamérica.",
  },
];

export function LandingGuiaConsultas() {
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      notifyError("Completa nombre y email.");
      return;
    }
    if (!form.privacy_accepted) {
      notifyError("Debes aceptar el tratamiento de datos personales.");
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
      notifySuccess(data.message || "Solicitud enviada correctamente.");
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
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="landing-guia-consultas-panel">
          <div className="landing-guia-consultas-accent" aria-hidden />

          <div className="landing-guia-consultas-grid">
            <div className="landing-guia-consultas-copy">
              <div className="landing-guia-consultas-brand-row">
                <span className="landing-guia-ads-badge">ADSGuiaa</span>
                <span className="landing-guia-consultas-eyebrow">Guía Consultas</span>
              </div>

              <h2 id="landing-guia-consultas-heading" className="landing-guia-consultas-title">
                Anúnciate con nosotros
              </h2>
              <p className="landing-guia-consultas-lead">
                Influye en cada consulta veterinaria: coloca tu marca en el momento exacto de la
                decisión clínica, dentro del software que usan los MVZ cada día.
              </p>

              <ul className="landing-guia-value-props">
                {VALUE_PROPS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="landing-guia-value-prop">
                    <span className="landing-guia-value-prop-icon" aria-hidden>
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <p>{text}</p>
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
                    <p className="landing-guia-consultas-success-title">Solicitud recibida</p>
                    <p className="landing-guia-consultas-success-text">
                      El equipo GUIAA revisará tu mensaje y te contactará con opciones de
                      publicidad en <strong>ADSGuiaa</strong>.
                    </p>
                    <button
                      type="button"
                      className="landing-guia-consultas-submit"
                      onClick={() => setSent(false)}
                    >
                      Enviar otra solicitud
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="landing-guia-form-head">
                      <span className="landing-guia-form-head-icon" aria-hidden>
                        <Megaphone size={20} strokeWidth={2} />
                      </span>
                      <div>
                        <h3 className="landing-guia-form-kicker">Solicitud de información</h3>
                        <p className="landing-guia-form-sub">
                          Cuéntanos tu marca o laboratorio. Te proponemos formatos en Guía
                          Consultas.
                        </p>
                      </div>
                    </div>

                    <form className="landing-guia-consultas-form" onSubmit={handleSubmit} noValidate>
                      <div className="landing-guia-field">
                        <Label htmlFor="gc-name">Nombre o empresa</Label>
                        <Input
                          id="gc-name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Laboratorio VetLab"
                          autoComplete="organization"
                          required
                          className="landing-guia-input"
                        />
                      </div>
                      <div className="landing-guia-field-row">
                        <div className="landing-guia-field">
                          <Label htmlFor="gc-email">Email</Label>
                          <Input
                            id="gc-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="contacto@marca.com"
                            autoComplete="email"
                            required
                            className="landing-guia-input"
                          />
                        </div>
                        <div className="landing-guia-field">
                          <Label htmlFor="gc-phone">Teléfono</Label>
                          <Input
                            id="gc-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+52 55 0000 0000"
                            autoComplete="tel"
                            className="landing-guia-input"
                          />
                        </div>
                      </div>
                      <div className="landing-guia-field">
                        <Label htmlFor="gc-message">Producto o marca a promover</Label>
                        <Textarea
                          id="gc-message"
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder="Alimento terapéutico, vacunas, laboratorio, equipamiento…"
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
                        <span>
                          Acepto el tratamiento de mis datos para recibir información sobre ADSGuiaa
                          y publicidad en Guía Consultas.
                        </span>
                      </label>

                      <button
                        type="submit"
                        className="landing-guia-consultas-submit"
                        disabled={submitting}
                      >
                        {submitting ? "Enviando…" : "Quiero anunciarme"}
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
