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
import "./appointmentRequestPortal.css";

const SPECIES = ["perros", "gatos", "conejos", "aves", "otros"];

const EMPTY_FORM = {
  client_name: "",
  phone: "",
  email: "",
  patient_name: "",
  species: "perros",
  preferred_starts_at: "",
  reason: "",
};

export function AppointmentRequestPortal({ organizationId }) {
  const { t } = useTranslation("clinic");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const invalidLink = !organizationId;

  useEffect(() => {
    if (invalidLink) {
      setLoading(false);
      return;
    }
    fetchPublicOrganization(organizationId)
      .then((data) => setOrgName(data.organization?.name || t("portal.defaultOrg")))
      .catch((err) => notifyError(err.message || t("portal.loadError")))
      .finally(() => setLoading(false));
  }, [organizationId, invalidLink, t]);

  const speciesOptions = useMemo(
    () =>
      SPECIES.map((value) => ({
        value,
        label: t(`portal.speciesOptions.${value}`),
      })),
    [t],
  );

  const updateField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim() || !form.patient_name.trim()) {
      notifyError(t("portal.missingRequired"));
      return;
    }
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
      setForm(EMPTY_FORM);
    } catch (err) {
      notifyError(err.message || t("portal.submitError"));
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
          <GuiaaLogoImg
            className="portal-logo-full logo-image logo-image-full"
            tone="on-light"
          />
          <div>
            <h1>{t("portal.title")}</h1>
            {loading ? (
              <p role="status">{t("portal.loading")}</p>
            ) : (
              <p>{invalidLink ? t("portal.unavailable") : orgName}</p>
            )}
          </div>
        </div>

        {invalidLink && !loading && (
          <div className="portal-empty" role="alert">
            <p>{t("portal.invalidLinkBody")}</p>
          </div>
        )}

        {!loading && !invalidLink && (
          <form onSubmit={handleSubmit} className="clinic-form portal-form" noValidate>
            <div className="form-group">
              <Label htmlFor="portal-client-name">{t("portal.clientName")}</Label>
              <Input
                id="portal-client-name"
                name="client_name"
                autoComplete="name"
                value={form.client_name}
                onChange={updateField("client_name")}
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="portal-phone">{t("portal.phone")}</Label>
              <Input
                id="portal-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={updateField("phone")}
              />
            </div>
            <div className="form-group">
              <Label htmlFor="portal-email">{t("portal.email")}</Label>
              <Input
                id="portal-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={updateField("email")}
              />
            </div>
            <div className="form-group">
              <Label htmlFor="portal-pet-name">{t("portal.petName")}</Label>
              <Input
                id="portal-pet-name"
                name="patient_name"
                value={form.patient_name}
                onChange={updateField("patient_name")}
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="portal-species">{t("portal.species")}</Label>
              <select
                id="portal-species"
                className="portal-select"
                value={form.species}
                onChange={updateField("species")}
              >
                {speciesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <Label htmlFor="portal-preferred-date">{t("portal.preferredDate")}</Label>
              <Input
                id="portal-preferred-date"
                name="preferred_starts_at"
                type="datetime-local"
                value={form.preferred_starts_at}
                onChange={updateField("preferred_starts_at")}
              />
            </div>
            <div className="form-group">
              <Label htmlFor="portal-reason">{t("portal.reason")}</Label>
              <Textarea
                id="portal-reason"
                name="reason"
                value={form.reason}
                onChange={updateField("reason")}
                rows={3}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full portal-submit-btn"
            >
              {submitting ? t("portal.submitting") : t("portal.submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
