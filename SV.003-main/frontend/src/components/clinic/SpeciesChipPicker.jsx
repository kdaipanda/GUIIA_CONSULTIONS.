import React from "react";
import { Label } from "../ui/label";
import { QUICK_SPECIES } from "../../lib/clinicQuickForms";

export function SpeciesChipPicker({ value, onChange, label = "Especie" }) {
  return (
    <div className="form-group">
      <Label>{label}</Label>
      <div className="clinic-quick-chips" role="group" aria-label={label}>
        {QUICK_SPECIES.map(({ value: speciesValue, label: speciesLabel }) => (
          <button
            key={speciesValue}
            type="button"
            className={`clinic-quick-chip${value === speciesValue ? " is-active" : ""}`}
            onClick={() => onChange(speciesValue)}
          >
            {speciesLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
