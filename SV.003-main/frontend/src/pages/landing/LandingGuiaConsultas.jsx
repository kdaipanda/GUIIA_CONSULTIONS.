import React, { useState } from "react";
import { PawPrint } from "lucide-react";
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

const PAWS = [
  { className: "landing-guia-paw landing-guia-paw--tl", size: 18 },
  { className: "landing-guia-paw landing-guia-paw--trail-1", size: 13 },
  { className: "landing-guia-paw landing-guia-paw--trail-2", size: 15 },
  { className: "landing-guia-paw landing-guia-paw--trail-3", size: 12 },
  { className: "landing-guia-paw landing-guia-paw--br", size: 16 },
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
          {PAWS.map(({ className, size }) => (
            <span key={className} className={className} aria-hidden>
              <PawPrint size={size} />
            </span>
          ))}

          <div className="landing-guia-consultas-grid">
            <div className="landing-guia-consultas-copy">
              <p className="landing-guia-consultas-eyebrow">ADSGuiaa · Guía Consultas</p>
              <h2 id="landing-guia-consultas-heading" className="landing-guia-consultas-title">
                Anúnciate con nosotros dentro de{" "}
                <span className="landing-guia-consultas-title-accent">Guía Consultas</span>
              </h2>
              <p className="landing-guia-consultas-lead">
                <strong className="landing-guia-ads-brand">ADSGuiaa</strong> coloca tu marca en el
                software que usan los MVZ cada día: influye en cada consulta veterinaria en el
                momento exacto de la <strong>decisión clínica</strong>, cuando el profesional y el
                tutor están evaluando opciones de tratamiento, producto o protocolo.
              </p>
              <ul className="landing-guia-consultas-points">
                <li>Visibilidad en el flujo real de consulta multiespecie</li>
                <li>Contexto de alta intención: decisión clínica, no banner genérico</li>
                <li>Alcance a médicos veterinarios certificados en Latinoamérica</li>
              </ul>
            </div>

            <div className="landing-guia-consultas-form-col">
              <div className="landing-guia-consultas-form-wrap">
                <div className="landing-guia-consultas-mascot" aria-hidden>
                  <img
                    src={LANDING_IMAGES.pets.catGinger}
                    alt=""
                    width={88}
                    height={88}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {sent ? (
                  <div className="landing-guia-consultas-success" role="status">
                    <p className="landing-guia-consultas-success-title">¡Solicitud recibida!</p>
                    <p className="landing-guia-consultas-success-text">
                      Un administrador de GUIAA revisará tu mensaje y te contactará pronto para
                      explicarte planes y formatos de <strong>ADSGuiaa</strong>.
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
                    <p className="landing-guia-form-kicker">Anúnciate con nosotros</p>
                    <p className="landing-guia-form-sub">
                      Cuéntanos tu marca o laboratorio. Te proponemos cómo aparecer en Guía
                      Consultas en el momento de la decisión clínica.
                    </p>

                    <form className="landing-guia-consultas-form" onSubmit={handleSubmit} noValidate>
                      <div className="landing-guia-field">
                        <Label htmlFor="gc-name">Nombre o empresa</Label>
                        <Input
                          id="gc-name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Laboratorio VetLab / Dra. Ana Martínez"
                          autoComplete="name"
                          required
                          className="landing-guia-input"
                        />
                      </div>
                      <div className="landing-guia-field">
                        <Label htmlFor="gc-email">Email</Label>
                        <Input
                          id="gc-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="ana@clinica.com"
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
                          placeholder="+52 55 1234 5678"
                          autoComplete="tel"
                          className="landing-guia-input"
                        />
                      </div>
                      <div className="landing-guia-field">
                        <Label htmlFor="gc-message">¿Qué producto o marca quieres promover?</Label>
                        <Textarea
                          id="gc-message"
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder="Ej. alimento terapéutico, vacunas, laboratorio, equipamiento…"
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
                          Al enviar acepto el tratamiento de mis datos personales para que GUIAA me
                          contacte con información sobre <strong>ADSGuiaa</strong> y publicidad en
                          Guía Consultas.
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
