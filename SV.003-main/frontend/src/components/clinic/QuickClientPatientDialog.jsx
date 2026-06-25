import React, { useEffect, useState } from "react";
import { Users, PawPrint, Zap } from "lucide-react";
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
      notifySuccess(`${form.petName.trim()} y ${form.ownerName.trim()} registrados.`);
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
      <DialogContent className={clinicDialogClass("max-w-md", "clinic-quick-register-dialog")}>
        <DialogHeader className="clinic-quick-dialog-header">
          <div className="clinic-quick-dialog-hero">
            <DoctorPlumitas size="xs" badge={false} className="clinic-quick-dialog-mascot" />
            <div className="clinic-quick-dialog-intro">
              <p className="clinic-quick-dialog-eyebrow">
                <Zap size={12} aria-hidden />
                Registro en un paso
              </p>
              <DialogTitle>Dueño + mascota</DialogTitle>
              <p className="clinic-muted clinic-quick-hint">
                Solo lo esencial. Puedes completar más datos después.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="clinic-form clinic-quick-dialog-form">
          <p className="clinic-form-section-label">
            <Users size={14} aria-hidden /> Dueño
          </p>
          <div className="clinic-form-grid-2">
            <div className="form-group">
              <Label htmlFor="quick-owner-name">Nombre *</Label>
              <Input
                id="quick-owner-name"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                placeholder="Ej. María López"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <Label htmlFor="quick-owner-phone">Teléfono</Label>
              <Input
                id="quick-owner-phone"
                value={form.ownerPhone}
                onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          <p className="clinic-form-section-label">
            <PawPrint size={14} aria-hidden /> Mascota
          </p>
          <div className="form-group">
            <Label htmlFor="quick-pet-name">Nombre *</Label>
            <Input
              id="quick-pet-name"
              value={form.petName}
              onChange={(e) => setForm({ ...form, petName: e.target.value })}
              placeholder="Ej. Firulais"
              required
            />
          </div>
          <div className="form-group">
            <Label>Especie</Label>
            <div className="clinic-quick-chips" role="group" aria-label="Especie">
              {QUICK_SPECIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`clinic-quick-chip${form.species === value ? " is-active" : ""}`}
                  onClick={() => setForm({ ...form, species: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {onOwnerOnly && (
            <button type="button" className="clinic-link-btn" onClick={onOwnerOnly}>
              Solo dueño (sin mascota)
            </button>
          )}

          <DialogFooter className="clinic-quick-dialog-footer">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Registrar ambos"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
