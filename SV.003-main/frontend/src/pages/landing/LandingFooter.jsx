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
    <footer className="landing-footer-v2 py-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <LandingBrandLockup variant="footer" logoTone="on-dark" className="max-w-md" />
            <p className="landing-body mt-4 max-w-sm text-sm">
              Software clínico veterinario multiespecie con soporte CDS L4 y L5. Para
              médicos veterinarios certificados en Latinoamérica.
            </p>
          </div>

          <div>
            <p className="landing-eyebrow">Navegación</p>
            <nav className="mt-4 flex flex-col gap-2.5">
              {FOOTER_NAV.map(({ label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="landing-btn-ghost w-fit text-left text-sm"
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <p className="landing-eyebrow">Cuenta y contacto</p>
            <nav className="mt-4 flex flex-col gap-2.5">
              {FOOTER_ACCOUNT.map(({ label, view }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setView(view)}
                  className="landing-btn-ghost w-fit text-left text-sm"
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-5 space-y-1.5 text-sm">
              <a
                href="mailto:soporte@guiaa.vet"
                className="block text-guiaa-brand-blue transition hover:text-guiaa-brand-navy"
              >
                soporte@guiaa.vet
              </a>
              <a
                href="mailto:privacidad@guiaa.com"
                className="landing-body block text-sm transition hover:text-guiaa-brand-navy"
              >
                privacidad@guiaa.com
              </a>
            </div>
          </div>
        </div>

        <div className="landing-trust-divider mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-guiaa-brand-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} GUIAA. Todos los derechos reservados.</p>
          <p>Soporte clínico · Enfoque LATAM · Solo MVZ certificados</p>
        </div>
      </div>
    </footer>
  );
}
