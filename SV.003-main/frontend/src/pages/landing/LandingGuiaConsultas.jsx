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
          <span className="landing-guia-paw landing-guia-paw--tl" aria-hidden>
            <PawPrint size={18} />
          </span>
          <span className="landing-guia-paw landing-guia-paw--tr" aria-hidden>
            <PawPrint size={14} />
          </span>
          <span className="landing-guia-paw landing-guia-paw--br" aria-hidden>
            <PawPrint size={16} />
          </span>

          <div className="landing-guia-consultas-mascot" aria-hidden>
            <img
              src={LANDING_IMAGES.pets.catGinger}
              alt=""
              width={72}
              height={72}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="landing-guia-consultas-grid">
            <div className="landing-guia-consultas-copy">
              <p className="landing-guia-consultas-eyebrow">Guía Consultas · GUIAA</p>
              <h2 id="landing-guia-consultas-heading" className="landing-guia-consultas-title">
                Conoce el software y el CDS dentro de Guía Consultas
              </h2>
              <p className="landing-guia-consultas-lead">
                Guía Consultas integra anamnesis multiespecie, expediente clínico y{" "}
                <strong>soporte a la decisión (CDS L4 y L5)</strong> en un solo flujo para MVZ
                certificados. Solicita información y el equipo GUIAA te contactará para una
                demostración personalizada.
              </p>
              <ul className="landing-guia-consultas-points">
                <li>Consulta estructurada con trazabilidad clínica</li>
                <li>CDS avanzado y documentación lista para el tutor</li>
                <li>Conexión con inventario, ventas y agenda de tu clínica</li>
              </ul>
            </div>

            <div className="landing-guia-consultas-form-wrap">
              {sent ? (
                <div className="landing-guia-consultas-success" role="status">
                  <p className="landing-guia-consultas-success-title">¡Solicitud recibida!</p>
                  <p className="landing-guia-consultas-success-text">
                    Un administrador de GUIAA revisará tu mensaje y te contactará pronto para
                    explicarte Guía Consultas y el módulo CDS.
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
                <form className="landing-guia-consultas-form" onSubmit={handleSubmit} noValidate>
                  <div className="landing-guia-field">
                    <Label htmlFor="gc-name">Nombre</Label>
                    <Input
                      id="gc-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Dra. Ana Martínez"
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
                    <Label htmlFor="gc-message">¿Qué te interesa conocer?</Label>
                    <Textarea
                      id="gc-message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Ej. demo del CDS, flujo de consulta multiespecie, planes para mi clínica…"
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
                      contacte con información sobre Guía Consultas.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="landing-guia-consultas-submit"
                    disabled={submitting}
                  >
                    {submitting ? "Enviando…" : "Solicitar información"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
