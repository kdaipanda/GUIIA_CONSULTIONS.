import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { LazySpeciesForm } from "./forms/LazySpeciesForm";

const LEGACY_SPECIES_KEYS = {
  perro: "perros",
  gato: "gatos",
  tortuga: "tortugas",
  erizo: "erizos",
  huron: "hurones",
  iguana: "iguanas",
  hamster: "hamsters",
  patos_pollos: "patos_pollos",
  aves: "aves",
  conejo: "conejos",
};

export function LegacySpeciesFormBridge({ speciesId, onSubmit, onCancel }) {
  const { t } = useTranslation("clinic");
  const [formData, setFormData] = useState({
    especie: LEGACY_SPECIES_KEYS[speciesId] || speciesId,
  });

  return (
    <div className="legacy-species-form-bridge">
      <LazySpeciesForm
        category={speciesId}
        formData={formData}
        setFormData={setFormData}
        unknownMessage={
          <p className="text-sm text-muted-foreground">{t("legacyAnimalForm.unsupportedSpecies")}</p>
        }
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("legacyAnimalForm.cancel")}
        </Button>
        <Button type="button" onClick={() => onSubmit(formData)}>
          {t("legacyAnimalForm.submit")}
        </Button>
      </div>
    </div>
  );
}
