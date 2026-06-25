import React from "react";

const COLLEAGUE_TESTIMONIALS = [
  {
    id: "ana",
    name: "Dra. Ana M.",
    petName: "Max",
    petImage: "/landing/pets/dog-golden.png",
    petAlt: "Perro golden retriever atendido en consulta",
    tags: ["CDS L4·L5", "Expediente"],
    quote:
      "La estructura CDS me ayuda a no omitir pasos en casos complejos. Mis consultas son más claras.",
    role: "Pequeñas especies · CDMX",
    tone: "coral",
  },
  {
    id: "carlos",
    name: "Dr. Carlos R.",
    petName: "Luna",
    petImage: "/landing/pets/cat-tabby.png",
    petAlt: "Gata atendida en consulta veterinaria",
    tags: ["Inventario", "Ventas"],
    quote: "Expediente, inventario y ventas conectados ahorran tiempo entre pacientes.",
    role: "Consulta mixta · GDL",
    tone: "rose",
  },
  {
    id: "laura",
    name: "MVZ Laura S.",
    petName: "Rocky",
    petImage: "/landing/pets/puppy.png",
    petAlt: "Cachorro en consulta multiespecie",
    tags: ["Multiespecie", "Producción"],
    quote: "Uso GUIAA en perros, gatos y consultas de producción con el mismo rigor.",
    role: "Medicina de producción · MTY",
    tone: "sky",
  },
  {
    id: "patricia",
    name: "Dra. Patricia V.",
    petName: "Nala",
    petImage: "/landing/pets/corgi.png",
    petAlt: "Corgi atendido en clínica veterinaria",
    tags: ["Anamnesis", "CDS avanzado"],
    quote:
      "GUIAA refleja cómo trabajo en consulta: datos del paciente, razonamiento clínico y trazabilidad sin saltar entre herramientas.",
    role: "Clínica felina · Querétaro",
    tone: "amber",
  },
  {
    id: "miguel",
    name: "Dr. Miguel T.",
    petName: "Simba",
    petImage: "/landing/pets/cat-ginger.png",
    petAlt: "Gato naranja en hospital veterinario",
    tags: ["Laboratorio PDF", "Premium"],
    quote:
      "Interpretar laboratorios con el PDF integrado cambió mi flujo. Los tutores reciben explicaciones más claras.",
    role: "Hospital veterinario · Puebla",
    tone: "violet",
  },
  {
    id: "sofia",
    name: "Dra. Sofía L.",
    petName: "Mía",
    petImage: "/landing/pets/cat-black.png",
    petAlt: "Gata en servicio de emergencias veterinarias",
    tags: ["Registro MVZ", "LATAM"],
    quote: "El acceso verificado con cédula profesional da confianza a todo el equipo clínico.",
    role: "Emergencias · Lima",
    tone: "slate",
  },
];

export function LandingTestimonials() {
  return (
    <section
      className="landing-colleagues-section landing-section"
      aria-labelledby="landing-colleagues-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="landing-colleagues-head">
          <p className="landing-eyebrow">Comunidad MVZ</p>
          <h2
            id="landing-colleagues-heading"
            className="landing-section-title mt-3 text-3xl sm:text-4xl"
          >
            Lo que dicen los colegas
          </h2>
          <p className="landing-lead mt-4 max-w-xl">
            Colegas MVZ comparten cómo documentan consultas y recuperan tiempo clínico con GUIAA.
          </p>
        </div>

        <div className="landing-colleagues-bento" role="list">
          {COLLEAGUE_TESTIMONIALS.map(
            ({ id, name, petName, petImage, petAlt, tags, quote, role, tone }) => (
              <figure
                key={id}
                role="listitem"
                className={`landing-colleague-card landing-colleague-card--${tone}`}
              >
                <div className="landing-colleague-card-top">
                  <figcaption className="landing-colleague-name">{petName}</figcaption>
                  <ul className="landing-colleague-tags" aria-label={`Caso de ${petName}`}>
                    {tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </div>

                <blockquote className="landing-colleague-quote">&ldquo;{quote}&rdquo;</blockquote>
                <p className="landing-colleague-role">
                  {name} · {role}
                </p>

                <picture>
                  <source srcSet={petImage.replace(/\.png$/, ".webp")} type="image/webp" />
                  <img
                    src={petImage}
                    alt={petAlt}
                    className="landing-colleague-pet"
                    loading="lazy"
                    decoding="async"
                    width={320}
                    height={400}
                  />
                </picture>

                <span className="landing-colleague-curve" aria-hidden />
              </figure>
            ),
          )}
        </div>

        <p className="landing-colleagues-disclaimer">
          Casos ilustrativos con fines demostrativos. Los testimonios representan flujos típicos
          de consulta MVZ en GUIAA.
        </p>
      </div>
    </section>
  );
}
