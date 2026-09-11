import React, { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { preloadSpeciesFormNamespace } from "../../lib/loadI18nNamespace";

const SPECIES_FORM_COMPONENTS = {
  perros: lazy(() => import("./PerrosForm")),
  gatos: lazy(() => import("./GatosForm")),
  tortugas: lazy(() => import("./TortugasForm")),
  erizos: lazy(() => import("./ErizosForm")),
  hurones: lazy(() => import("./HuronesForm")),
  iguanas: lazy(() => import("./IguanasForm")),
  hamsters: lazy(() => import("./HamstersForm")),
  patos_pollos: lazy(() => import("./PatosPollosForm")),
  aves_corral: lazy(() => import("./PatosPollosForm")),
  aves: lazy(() => import("./AvesForm")),
  aves_ornamentales: lazy(() => import("./AvesForm")),
  conejos: lazy(() => import("./ConejosForm")),
  cuyos: lazy(() => import("./CuyosForm")),
};

const LEGACY_SPECIES_MAP = {
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

function resolveCategory(category) {
  if (!category) return null;
  if (SPECIES_FORM_COMPONENTS[category]) return category;
  return LEGACY_SPECIES_MAP[category] || null;
}

function SpeciesFormFallback() {
  const { t } = useTranslation("common");
  return (
    <div className="species-form-loading" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden />
      <p>{t("loading")}</p>
    </div>
  );
}

export function LazySpeciesForm({ category, formData, setFormData, unknownMessage }) {
  const resolved = resolveCategory(category);
  const FormComponent = resolved ? SPECIES_FORM_COMPONENTS[resolved] : null;

  React.useEffect(() => {
    if (resolved) preloadSpeciesFormNamespace();
  }, [resolved]);

  if (!FormComponent) {
    return unknownMessage ? <div className="form-section">{unknownMessage}</div> : null;
  }

  return (
    <Suspense fallback={<SpeciesFormFallback />}>
      <FormComponent formData={formData} setFormData={setFormData} />
    </Suspense>
  );
}
