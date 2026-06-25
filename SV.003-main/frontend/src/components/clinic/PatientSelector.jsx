import React, { useEffect, useState } from "react";
import { useVet } from "../../context/VetContext";
import { fetchPatients } from "../../lib/clinicApi";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function PatientSelector({ value, onChange, disabled }) {
  const { veterinarian } = useVet();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!veterinarian?.id) return;
    setLoading(true);
    fetchPatients(veterinarian.id)
      .then((data) => setPatients(data.patients || []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, [veterinarian?.id]);

  return (
    <div className="form-group patient-selector">
      <Label>Mascota registrada (opcional)</Label>
      <Select
        value={value || "__none__"}
        onValueChange={(v) => {
          if (v === "__none__") {
            onChange(null);
            return;
          }
          const p = patients.find((x) => x.id === v);
          onChange(
            p
              ? {
                  patientId: p.id,
                  clientId: p.client_id,
                  patient: p,
                }
              : null,
          );
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger className="patient-selector-trigger">
          <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar mascota"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— Sin vincular —</SelectItem>
          {patients.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name} · {p.clients?.name || "dueño"} · {p.species || "especie"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
