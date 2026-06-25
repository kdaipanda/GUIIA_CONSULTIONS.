import React from "react";
import { ClipboardList, PawPrint, ShieldCheck } from "lucide-react";

const HERO_STATS = [
  {
    icon: PawPrint,
    value: "11+ especies veterinarias",
    desc: "Formularios clínicos para perros, felinos, exóticos y más.",
  },
  {
    icon: ClipboardList,
    value: "Expediente unificado",
    desc: "Dueños, mascotas, consultas y ventas en un solo consultorio.",
  },
  {
    icon: ShieldCheck,
    value: "Acceso MVZ verificado",
    desc: "Registro con cédula profesional para veterinarios en LATAM.",
  },
];

export function LandingHeroStats() {
  return (
    <div className="landing-petpal-stats" role="region" aria-label="Ventajas de GUIAA">
      {HERO_STATS.map(({ icon: Icon, value, desc }) => (
        <div key={value} className="landing-petpal-stat">
          <span className="landing-petpal-stat-icon">
            <Icon size={18} aria-hidden />
          </span>
          <div className="landing-petpal-stat-copy">
            <p className="landing-petpal-stat-value">{value}</p>
            <p className="landing-petpal-stat-desc">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
