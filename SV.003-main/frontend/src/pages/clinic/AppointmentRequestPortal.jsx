import React, { useEffect, useState } from "react";
import { fetchPublicOrganization, submitAppointmentRequest } from "../../lib/clinicApi";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

const SPECIES = ["perros", "gatos", "conejos", "aves", "otros"];

export function AppointmentRequestPortal({ organizationId }) {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    phone: "",
    email: "",
    patient_name: "",
    species: "perros",
    preferred_starts_at: "",
    reason: "",
  });

  const invalidLink = !organizationId;

  useEffect(() => {
    if (invalidLink) {
      notifyError("Enlace inválido");
      setLoading(false);
      return;
    }
    fetchPublicOrganization(organizationId)
      .then((data) => setOrgName(data.organization?.name || "Consultorio"))
      .catch((err) => notifyError(err.message))
      .finally(() => setLoading(false));
  }, [organizationId, invalidLink]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim() || !form.patient_name.trim()) return;
    setSubmitting(true);
    try {
      const data = await submitAppointmentRequest({
        organization_id: organizationId,
        ...form,
        preferred_starts_at: form.preferred_starts_at
          ? new Date(form.preferred_starts_at).toISOString()
          : null,
      });
      notifySuccess(data.message || "Solicitud enviada correctamente.");
      setForm({
        client_name: "",
        phone: "",
        email: "",
        patient_name: "",
        species: "perros",
        preferred_starts_at: "",
        reason: "",
      });
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-page">
      <div className="portal-card">
        <div className="portal-brand">
          <img src="/GuiaaLogo-full.png" alt="GUIAA" className="portal-logo-full" />
          <div>
            <h1>Solicitar cita</h1>
            <p>{loading ? "Cargando..." : orgName}</p>
          </div>
        </div>

        {!loading && !invalidLink && (
          <form onSubmit={handleSubmit} className="clinic-form portal-form">
            <div className="form-group">
              <Label>Tu nombre *</Label>
              <Input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <Label>Nombre de la mascota *</Label>
              <Input
                value={form.patient_name}
                onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <Label>Especie</Label>
              <select
                className="portal-select"
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
              >
                {SPECIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <Label>Fecha y hora preferida</Label>
              <Input
                type="datetime-local"
                value={form.preferred_starts_at}
                onChange={(e) => setForm({ ...form, preferred_starts_at: e.target.value })}
              />
            </div>
            <div className="form-group">
              <Label>Motivo de la consulta</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
