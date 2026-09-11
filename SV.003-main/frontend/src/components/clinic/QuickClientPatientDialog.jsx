import React, { useEffect, useState } from "react";
import { Users, PawPrint, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { clinicDialogClass } from "./ClinicPageUi";
import { DoctorPlumitas } from "../brand/DoctorPlumitas";
import { createClient, createPatient } from "../../lib/clinicApi";
import { QUICK_SPECIES } from "../../lib/clinicQuickForms";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

const EMPTY = {
  ownerName: "",
  ownerPhone: "",
  petName: "",
  species: "perros",
};

export function QuickClientPatientDialog({
  open,
  onOpenChange,
  veterinarianId,
  onSuccess,
  onOwnerOnly,
}) {
  const { t } = useTranslation("clinic");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ownerName.trim() || !form.petName.trim() || !veterinarianId) return;
    setSaving(true);
    try {
      const { client } = await createClient(veterinarianId, {
        name: form.ownerName.trim(),
        phone: form.ownerPhone.trim() || "",
        email: "",
        address: "",
        notes: "",
      });
      const { patient } = await createPatient(veterinarianId, {
        client_id: client.id,
        name: form.petName.trim(),
        species: form.species,
        weight_kg: null,
      });
      notifySuccess(
        t("quickRegister.success", {
          pet: form.petName.trim(),
          owner: form.ownerName.trim(),
        }),
      );
      onOpenChange(false);
      onSuccess?.({ client, patient });
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={clinicDialogClass("max-w-md", "clinic-dialog", "clinic-quick-register-dialog")}>
        <DialogHeader className="clinic-dialog-header clinic-quick-dialog-header">
          <div className="clinic-quick-dialog-hero">
            <DoctorPlumitas size="xs" badge={false} className="clinic-quick-dialog-mascot" />
            <div className="clinic-quick-dialog-intro">
              <p className="clinic-quick-dialog-eyebrow">
                <Zap size={12} aria-hidden />
                {t("quickRegister.eyebrow")}
              </p>
              <DialogTitle className="clinic-quick-dialog-title">
                {t("quickRegister.title")}
              </DialogTitle>
              <p className="clinic-dialog-subtitle clinic-quick-hint">
                {t("quickRegister.lead")}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="clinic-form clinic-form-product clinic-quick-dialog-form">
          <div className="clinic-form-scroll clinic-form-scroll-compact">
            <p className="clinic-form-section-label">
              <Users size={14} aria-hidden /> {t("quickRegister.ownerSection")}
            </p>
            <div className="clinic-form-grid-2">
              <div className="form-group">
                <Label htmlFor="quick-owner-name">{t("quickRegister.name")}</Label>
                <Input
                  id="quick-owner-name"
                  className="clinic-field-control"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder={t("quickRegister.ownerPlaceholder")}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <Label htmlFor="quick-owner-phone">{t("quickRegister.phone")}</Label>
                <Input
                  id="quick-owner-phone"
                  className="clinic-field-control"
                  value={form.ownerPhone}
                  onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                  placeholder={t("quickRegister.optional")}
                />
              </div>
            </div>

            <p className="clinic-form-section-label clinic-form-section-label--spaced">
              <PawPrint size={14} aria-hidden /> {t("quickRegister.petSection")}
            </p>
            <div className="form-group">
              <Label htmlFor="quick-pet-name">{t("quickRegister.name")}</Label>
              <Input
                id="quick-pet-name"
                className="clinic-field-control"
                value={form.petName}
                onChange={(e) => setForm({ ...form, petName: e.target.value })}
                placeholder={t("quickRegister.petPlaceholder")}
                required
              />
            </div>
            <div className="form-group">
              <Label id="quick-species-label">{t("quickRegister.species")}</Label>
              <div
                className="clinic-quick-chips clinic-quick-chips--species"
                role="group"
                aria-labelledby="quick-species-label"
              >
                {QUICK_SPECIES.map(({ value }) => (
                  <button
                    key={value}
                    type="button"
                    className={`clinic-quick-chip${form.species === value ? " is-active" : ""}`}
                    onClick={() => setForm({ ...form, species: value })}
                  >
                    {t(`quickRegister.speciesLabels.${value}`, { defaultValue: value })}
                  </button>
                ))}
              </div>
            </div>

            {onOwnerOnly && (
              <button type="button" className="clinic-link-btn clinic-quick-owner-only" onClick={onOwnerOnly}>
                {t("quickRegister.ownerOnly")}
              </button>
            )}
          </div>

          <DialogFooter className="clinic-dialog-footer clinic-quick-dialog-footer">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="clinic-quick-submit-btn" disabled={saving}>
              {saving ? t("common.saving") : t("quickRegister.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
