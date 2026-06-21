import React, { useMemo, useState } from "react";
import { Calculator, FlaskConical, Scale, ExternalLink } from "lucide-react";
import "./clinicPageShared.css";
import "./toolsPage.css";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const REFERENCE_LINKS = [
  { label: "Plumb's Veterinary Drugs", url: "https://www.plumbsveterinarydrugs.com/" },
  { label: "Merck Veterinary Manual", url: "https://www.merckvetmanual.com/" },
  { label: "VIN (Veterinary Information Network)", url: "https://www.vin.com/" },
];

export function ToolsPage() {
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
      unitLabel: unitType === "mg_ml" ? "ml" : "unidades",
    };
  }, [weight, dosePerKg, concentration, unitType]);

  return (
    <div className="clinic-page clinic-page-guiaa clinic-tools-page clinic-tools-page-guiaa">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Herramientas clínicas</h1>
          <p>Calculadoras y referencias rápidas para apoyo en consulta.</p>
        </div>
      </div>

      <div className="clinic-tools-grid">
        <section className="clinic-tools-card">
          <div className="clinic-tools-card-head">
            <Calculator size={20} aria-hidden />
            <h2>Calculadora de dosis</h2>
          </div>
          <p className="clinic-muted clinic-tools-desc">
            Calcula la dosis total a partir del peso, dosis mg/kg y concentración del fármaco.
            Verifica siempre con la ficha técnica y el peso actual de la mascota.
          </p>

          <div className="clinic-form-grid-2">
            <div className="form-group">
              <Label htmlFor="tool-weight">Peso de la mascota (kg)</Label>
              <Input
                id="tool-weight"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 12.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="form-group">
              <Label htmlFor="tool-dose">Dosis (mg/kg)</Label>
              <Input
                id="tool-dose"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 10"
                value={dosePerKg}
                onChange={(e) => setDosePerKg(e.target.value)}
              />
            </div>
          </div>

          <div className="clinic-form-grid-2">
            <div className="form-group">
              <Label>Presentación</Label>
              <Select value={unitType} onValueChange={setUnitType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg_ml">mg/ml (líquido)</SelectItem>
                  <SelectItem value="mg_unit">mg por tableta/cápsula</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label htmlFor="tool-conc">
                Concentración ({unitType === "mg_ml" ? "mg/ml" : "mg/unidad"})
              </Label>
              <Input
                id="tool-conc"
                type="number"
                min="0"
                step="0.01"
                placeholder={unitType === "mg_ml" ? "Ej. 50" : "Ej. 250"}
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
              />
            </div>
          </div>

          {result ? (
            <div className="clinic-tools-result">
              <div className="clinic-tools-result-row">
                <Scale size={16} aria-hidden />
                <span>Dosis total:</span>
                <strong>{result.totalMg} mg</strong>
              </div>
              {result.volumeOrUnits && (
                <div className="clinic-tools-result-row">
                  <FlaskConical size={16} aria-hidden />
                  <span>A administrar:</span>
                  <strong>
                    {result.volumeOrUnits} {result.unitLabel}
                  </strong>
                </div>
              )}
            </div>
          ) : (
            <p className="clinic-tools-placeholder">
              Ingresa peso y dosis mg/kg para ver el resultado.
            </p>
          )}
        </section>

        <section className="clinic-tools-card">
          <div className="clinic-tools-card-head">
            <FlaskConical size={20} aria-hidden />
            <h2>Referencias</h2>
          </div>
          <p className="clinic-muted clinic-tools-desc">
            Enlaces útiles para consultar protocolos, interacciones y dosificación.
          </p>
          <ul className="clinic-tools-links">
            {REFERENCE_LINKS.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <span>{link.label}</span>
                  <ExternalLink size={14} aria-hidden className="clinic-tools-link-icon" />
                </a>
              </li>
            ))}
          </ul>
          <p className="clinic-report-note">
            GUIAA CDS complementa pero no sustituye el criterio clínico ni la prescripción formal.
          </p>
        </section>
      </div>
    </div>
  );
}
