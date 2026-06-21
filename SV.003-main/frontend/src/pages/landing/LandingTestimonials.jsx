import React from "react";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "La estructura CDS me ayuda a no omitir pasos en casos complejos. Mis consultas son más claras y los tutores lo notan.",
    name: "Dra. Ana M.",
    role: "Clínica de pequeñas especies · CDMX",
  },
  {
    quote:
      "Tener expediente, inventario y ventas conectados ahorra tiempo entre pacientes. Es la herramienta que buscaba.",
    name: "Dr. Carlos R.",
    role: "Consulta mixta · Guadalajara",
  },
  {
    quote:
      "El flujo multiespecie es sólido. Uso GUIAA tanto en perros y gatos como en consultas de producción.",
    name: "MVZ Laura S.",
    role: "Medicina de producción · Monterrey",
  },
];

export function LandingTestimonials() {
  return (
    <section className="border-t border-guiaa-brand-navy/8 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-guiaa-brand-navy sm:text-4xl">
            Lo que dicen los colegas
          </h2>
          <p className="mt-4 text-guiaa-brand-navy/65">
            Veterinarios certificados que ya integran GUIAA en su práctica diaria.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, role }) => (
            <figure
              key={name}
              className="flex flex-col rounded-2xl border border-guiaa-brand-navy/8 bg-white p-6 shadow-sm"
            >
              <Quote size={28} className="text-guiaa-brand-green/40" aria-hidden />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-guiaa-brand-navy/75">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-guiaa-brand-navy/8 pt-4">
                <p className="text-sm font-semibold text-guiaa-brand-navy">{name}</p>
                <p className="mt-0.5 text-xs text-guiaa-brand-navy/50">{role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
