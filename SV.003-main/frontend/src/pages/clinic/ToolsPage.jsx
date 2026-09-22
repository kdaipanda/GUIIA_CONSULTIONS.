import React, { useMemo, useState } from "react";
import { FlaskConical, Scale, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ModuleHelpTip } from "../../components/clinic/ModuleHelpTip";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import "./clinicPageShared.css";
import "./helpCenterPage.css";
import "./toolsPage.css";

const REFERENCE_LINKS = [
  {
    labelKey: "tools.refPlumb",
    url: "https://www.plumbsveterinarydrugs.com/",
  },
  {
    labelKey: "tools.refMerck",
    url: "https://www.merckvetmanual.com/",
  },
  {
    labelKey: "tools.refVin",
    url: "https://www.vin.com/",
  },
];

export function ToolsPage({ setView }) {
  const { t } = useTranslation("clinic");
  const [weight, setWeight] = useState("");
  const [dosePerKg, setDosePerKg] = useState("");
  const [concentration, setConcentration] = useState("");
  const [unitType, setUnitType] = useState("mg_ml");

  const result = useMemo(() => {
    const w = parseFloat(weight);
    const dose = parseFloat(dosePerKg);
    const conc = parseFloat(concentration);

    if (!w || !dose || w <= 0 || dose <= 0) {
      return null;
    }

    const totalMg = w * dose;
    let volumeOrUnits = null;

    if (conc > 0) {
      volumeOrUnits = totalMg / conc;
    }

    return {
      totalMg: totalMg.toFixed(2),
      volumeOrUnits: volumeOrUnits != null ? volumeOrUnits.toFixed(3) : null,
      unitLabel:
        unitType === "mg_ml" ? t("tools.unitMl") : t("tools.unitTablet"),
    };
  }, [weight, dosePerKg, concentration, unitType, t]);

  const concUnit =
    unitType === "mg_ml" ? t("tools.concMgMl") : t("tools.concMgUnit");

  return (
    <div className="clinic-page clinic-page-guiaa clinic-tools-page clinic-tools-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <div className="clinic-page-title-row">
            <h1>{t("tools.title")}</h1>
            <ModuleHelpTip topicId="tools" setView={setView} />
          </div>
          <p>{t("tools.lead")}</p>
        </div>
      </div>

      <div className="clinic-tools-grid">
        <section className="clinic-tools-card" aria-labelledby="tools-dose-title">
          <h2 id="tools-dose-title">{t("tools.doseTitle")}</h2>
          <p className="clinic-muted clinic-tools-desc">{t("tools.doseLead")}</p>

          <div className="clinic-form-grid-2">
            <div className="form-group">
              <Label htmlFor="tool-weight">{t("tools.weightLabel")}</Label>
              <Input
                id="tool-weight"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder={t("tools.weightPlaceholder")}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="form-group">
              <Label htmlFor="tool-dose">{t("tools.doseLabel")}</Label>
              <Input
                id="tool-dose"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder={t("tools.dosePlaceholder")}
                value={dosePerKg}
                onChange={(e) => setDosePerKg(e.target.value)}
              />
            </div>
          </div>

          <div className="clinic-form-grid-2">
            <div className="form-group">
              <Label htmlFor="tool-presentation">{t("tools.presentationLabel")}</Label>
              <Select value={unitType} onValueChange={setUnitType}>
                <SelectTrigger id="tool-presentation" aria-label={t("tools.presentationLabel")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg_ml">{t("tools.presentationLiquid")}</SelectItem>
                  <SelectItem value="mg_unit">{t("tools.presentationSolid")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label htmlFor="tool-conc">
                {t("tools.concentrationLabel", { unit: concUnit })}
              </Label>
              <Input
                id="tool-conc"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder={
                  unitType === "mg_ml"
                    ? t("tools.concPlaceholderLiquid")
                    : t("tools.concPlaceholderSolid")
                }
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
              />
            </div>
          </div>

          {result ? (
            <div className="clinic-tools-result" role="status" aria-live="polite">
              <div className="clinic-tools-result-row">
                <Scale size={16} aria-hidden />
                <span>{t("tools.totalDose")}</span>
                <strong>
                  {result.totalMg} {t("tools.unitMg")}
                </strong>
              </div>
              {result.volumeOrUnits && (
                <div className="clinic-tools-result-row">
                  <FlaskConical size={16} aria-hidden />
                  <span>{t("tools.toAdminister")}</span>
                  <strong>
                    {result.volumeOrUnits} {result.unitLabel}
                  </strong>
                </div>
              )}
            </div>
          ) : (
            <p className="clinic-tools-placeholder">{t("tools.placeholder")}</p>
          )}
        </section>

        <section className="clinic-tools-card" aria-labelledby="tools-refs-title">
          <h2 id="tools-refs-title">{t("tools.refsTitle")}</h2>
          <p className="clinic-muted clinic-tools-desc">{t("tools.refsLead")}</p>
          <ul className="clinic-tools-links">
            {REFERENCE_LINKS.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <span>{t(link.labelKey)}</span>
                  <ExternalLink
                    size={14}
                    aria-hidden
                    className="clinic-tools-link-icon"
                  />
                </a>
              </li>
            ))}
          </ul>
          <p className="clinic-report-note">{t("tools.disclaimer")}</p>
        </section>
      </div>
    </div>
  );
}
