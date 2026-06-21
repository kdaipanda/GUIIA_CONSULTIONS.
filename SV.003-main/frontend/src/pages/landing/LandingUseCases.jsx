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
    <section className="landing-section border-t border-guiaa-brand-navy/8">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-xl">
          <p className="landing-eyebrow">Flujos de trabajo</p>
          <h2 className="landing-section-title mt-3 text-3xl text-guiaa-brand-navy sm:text-4xl">
            Pensado para el ritmo real de consulta
          </h2>
          <p className="landing-lead mt-4">
            Escenarios concretos en los que GUIAA encaja en la práctica diaria del MVZ.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-12">
          {USE_CASES.map(({ icon: Icon, title, description, tag, productTab }, index) => (
            <button
              key={title}
              type="button"
              onClick={() => scrollToLandingProduct(productTab)}
              className={`landing-card landing-card-interactive group flex flex-col rounded-2xl p-6 text-left ${
                index === 0
                  ? "md:col-span-2 lg:col-span-7"
                  : index === 1
                    ? "lg:col-span-5"
                    : "md:col-span-2 lg:col-span-12 lg:flex-row lg:items-center lg:gap-8 lg:p-8"
              }`}
            >
              <div className={index === 2 ? "lg:flex-1" : undefined}>
                <div className="inline-flex w-fit rounded-xl bg-guiaa-brand-blue/10 p-2.5 text-guiaa-brand-blue">
                  <Icon size={20} strokeWidth={2} aria-hidden />
                </div>
                <span className="mt-4 inline-flex w-fit rounded-md bg-guiaa-sky-soft/80 px-2 py-0.5 text-[11px] font-semibold text-guiaa-brand-ink-muted">
                  {tag}
                </span>
                <h3 className="mt-3 text-base font-semibold text-guiaa-brand-navy">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-guiaa-brand-ink-muted">
                  {description}
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-guiaa-brand-blue transition group-hover:gap-1.5 lg:mt-0 lg:shrink-0">
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
