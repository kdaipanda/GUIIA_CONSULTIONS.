import React from "react";
import { Bird, Cat, Dog, PawPrint, Rabbit, Turtle } from "lucide-react";
import { getConsultationSpeciesKey } from "../../lib/consultationDisplay";

const SPECIES_LUCIDE = {
  perros: Dog,
  gatos: Cat,
  aves: Bird,
  conejos: Rabbit,
  patos_pollos: Bird,
  tortugas: Turtle,
  iguanas: Turtle,
};

export function ConsultationSpeciesIcon({ consultation, size = 18, className }) {
  const key = getConsultationSpeciesKey(consultation);
  const Icon = SPECIES_LUCIDE[key] || PawPrint;
  return <Icon size={size} strokeWidth={2} className={className} aria-hidden />;
}
