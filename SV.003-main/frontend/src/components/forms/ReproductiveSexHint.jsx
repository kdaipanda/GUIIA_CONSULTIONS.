import { useTranslation } from "react-i18next";

/** Mensaje cuando la sección reproductiva depende del sexo y aún no está definido. */
export default function ReproductiveSexHint({ sexo }) {
  const { t } = useTranslation("speciesForms");
  if (sexo) return null;
  return (
    <p className="form-hint" style={{ marginBottom: "1rem", color: "#64748b" }}>
      {t("chrome.selectSexReproductive")}
    </p>
  );
}
