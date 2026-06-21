import React from "react";
import { LandingBrandLockup } from "./LandingBrandLockup";
import { scrollToLandingProduct, scrollToLandingSection } from "./landingScroll";

const FOOTER_NAV = [
  { label: "Producto", action: () => scrollToLandingProduct("species") },
  { label: "Características", action: () => scrollToLandingSection("#features") },
  { label: "Precios", action: () => scrollToLandingSection("#pricing") },
  { label: "FAQ", action: () => scrollToLandingSection("#faq") },
];

const FOOTER_ACCOUNT = [
  { label: "Iniciar sesión", view: "login" },
  { label: "Registro MVZ", view: "register" },
  { label: "Membresía", view: "membership" },
];

export function LandingFooter({ setView }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-guiaa-brand-navy/8 bg-white/50 py-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <LandingBrandLockup variant="footer" className="max-w-md" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-guiaa-brand-navy/50">
              Plataforma clínica multiespecie con soporte CDS L4 y L5 para médicos
              veterinarios certificados en Latinoamérica.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-guiaa-brand-navy/40">
              Navegación
            </p>
            <nav className="mt-4 flex flex-col gap-2.5">
              {FOOTER_NAV.map(({ label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="w-fit text-left text-sm text-guiaa-brand-navy/65 transition hover:text-guiaa-brand-navy"
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-guiaa-brand-navy/40">
              Cuenta y contacto
            </p>
            <nav className="mt-4 flex flex-col gap-2.5">
              {FOOTER_ACCOUNT.map(({ label, view }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setView(view)}
                  className="w-fit text-left text-sm text-guiaa-brand-navy/65 transition hover:text-guiaa-brand-navy"
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-5 space-y-1.5 text-sm">
              <a
                href="mailto:soporte@guiaa.vet"
                className="block text-guiaa-brand-navy/65 transition hover:text-guiaa-brand-blue"
              >
                soporte@guiaa.vet
              </a>
              <a
                href="mailto:privacidad@guiaa.com"
                className="block text-guiaa-brand-navy/45 transition hover:text-guiaa-brand-navy"
              >
                privacidad@guiaa.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-guiaa-brand-navy/8 pt-6 text-xs text-guiaa-brand-navy/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} GUIAA. Todos los derechos reservados.</p>
          <p>Soporte clínico · Enfoque LATAM · Solo MVZ certificados</p>
        </div>
      </div>
    </footer>
  );
}
