import React from "react";
import { useTranslation } from "react-i18next";
import { Label } from "../ui/label";
import { QUICK_SPECIES } from "../../lib/clinicQuickForms";

export function SpeciesChipPicker({ value, onChange, label }) {
  const { t } = useTranslation("clinic");
  const resolvedLabel = label || t("clients.colSpecies");

  return (
    <div className="form-group">
      <Label>{resolvedLabel}</Label>
      <div className="clinic-quick-chips" role="group" aria-label={resolvedLabel}>
        {QUICK_SPECIES.map(({ value: speciesValue }) => (
          <button
            key={speciesValue}
            type="button"
            className={`clinic-quick-chip${value === speciesValue ? " is-active" : ""}`}
            onClick={() => onChange(speciesValue)}
          >
            {t(`quickRegister.speciesLabels.${speciesValue}`, { defaultValue: speciesValue })}
          </button>
        ))}
      </div>
    </div>
  );
}
