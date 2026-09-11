import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPublicOrganization, submitAppointmentRequest } from "../../lib/clinicApi";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { GuiaaLogoImg } from "../../components/GuiaaBrandLockup";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

const SPECIES = ["perros", "gatos", "conejos", "aves", "otros"];

export function AppointmentRequestPortal({ organizationId }) {
  const { t } = useTranslation("clinic");
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
      notifyError(t("portal.invalidLink"));
      setLoading(false);
      return;
    }
    fetchPublicOrganization(organizationId)
      .then((data) => setOrgName(data.organization?.name || t("portal.defaultOrg")))
      .catch((err) => notifyError(err.message))
      .finally(() => setLoading(false));
  }, [organizationId, invalidLink, t]);

  const speciesOptions = useMemo(
    () => SPECIES.map((value) => ({
      value,
      label: t(`portal.speciesOptions.${value}`),
    })),
    [t],
  );

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
      notifySuccess(data.message || t("portal.success"));
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
      <div className="portal-lang">
        <LanguageSwitcher />
      </div>
      <div className="portal-card">
        <div className="portal-brand">
          <GuiaaLogoImg className="portal-logo-full logo-image logo-image-full" tone="on-light" />
          <div>
            <h1>{t("portal.title")}</h1>
            <p>{loading ? t("portal.loading") : orgName}</p>
          </div>
        </div>

        {!loading && !invalidLink && (
          <form onSubmit={handleSubmit} className="clinic-form portal-form">
            <div className="form-group">
              <Label>{t("portal.clientName")}</Label>
              <Input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <Label>{t("portal.phone")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <Label>{t("portal.email")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <Label>{t("portal.petName")}</Label>
              <Input
                value={form.patient_name}
                onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <Label>{t("portal.species")}</Label>
              <select
                className="portal-select"
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
              >
                {speciesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <Label>{t("portal.preferredDate")}</Label>
              <Input
                type="datetime-local"
                value={form.preferred_starts_at}
                onChange={(e) => setForm({ ...form, preferred_starts_at: e.target.value })}
              />
            </div>
            <div className="form-group">
              <Label>{t("portal.reason")}</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? t("portal.submitting") : t("portal.submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
