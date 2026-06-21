import React from "react";
import { ArrowUpRight, ClipboardList, Clock, MapPin } from "lucide-react";
import { scrollToLandingProduct } from "./landingScroll";

const USE_CASES = [
  {
    icon: ClipboardList,
    title: "Consulta estructurada",
    description:
      "Anamnesis por especie, examen físico y razonamiento CDS en secuencia — sin saltos entre herramientas.",
    tag: "Pequeñas especies",
    productTab: "consultation",
  },
  {
    icon: Clock,
    title: "Entre pacientes",
    description:
      "Expediente, inventario y ventas conectados: menos tiempo administrativo entre una cita y la siguiente.",
    tag: "Clínica de consulta",
    productTab: "dashboard",
  },
  {
    icon: MapPin,
    title: "Consulta móvil",
    description:
      "Acceso web desde tablet o laptop en domicilio, con el mismo historial clínico que en consultorio.",
    tag: "Visita externa",
    productTab: "consultation",
  },
];

export function LandingUseCases() {
  return (
    <section className="border-t border-guiaa-brand-navy/8 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-guiaa-brand-blue">
            Flujos de trabajo
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-guiaa-brand-navy sm:text-4xl">
            Pensado para el ritmo real de consulta
          </h2>
          <p className="mt-4 text-guiaa-brand-navy/60">
            Escenarios concretos en los que GUIAA encaja en la práctica diaria del MVZ.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {USE_CASES.map(({ icon: Icon, title, description, tag, productTab }) => (
            <button
              key={title}
              type="button"
              onClick={() => scrollToLandingProduct(productTab)}
              className="group flex flex-col rounded-2xl border border-guiaa-brand-navy/10 bg-white p-6 text-left transition hover:border-guiaa-brand-blue/25 hover:shadow-sm"
            >
              <div className="inline-flex w-fit rounded-xl bg-guiaa-brand-blue/10 p-2.5 text-guiaa-brand-blue">
                <Icon size={20} strokeWidth={2} aria-hidden />
              </div>
              <span className="mt-4 inline-flex w-fit rounded-md bg-guiaa-sky-soft/80 px-2 py-0.5 text-[11px] font-semibold text-guiaa-brand-navy/55">
                {tag}
              </span>
              <h3 className="mt-3 text-base font-semibold text-guiaa-brand-navy">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-guiaa-brand-navy/60">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-guiaa-brand-blue transition group-hover:gap-1.5">
                Ver en producto
                <ArrowUpRight size={13} aria-hidden />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
