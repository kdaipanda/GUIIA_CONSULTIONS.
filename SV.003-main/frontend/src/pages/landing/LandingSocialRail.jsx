import React from "react";
import { Mail, MessageCircle, Monitor } from "lucide-react";
import { scrollToLandingProduct, scrollToLandingSection } from "./landingScroll";

const DESKTOP_ITEMS = [
  {
    icon: Monitor,
    label: "Producto",
    onClick: () => scrollToLandingProduct("species"),
  },
  {
    icon: MessageCircle,
    label: "FAQ",
    onClick: () => scrollToLandingSection("#faq"),
  },
  {
    icon: Mail,
    label: "Contacto",
    href: "mailto:soporte@guiaa.vet",
  },
];

export function LandingSocialRail({ setView }) {
  return (
    <>
      <aside
        className="fixed right-3 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 rounded-full border border-white/60 bg-white/70 px-2.5 py-4 shadow-lg backdrop-blur-md lg:flex xl:right-6"
        aria-label="Accesos rápidos"
      >
        {DESKTOP_ITEMS.map(({ icon: Icon, label, href, onClick }) =>
          href ? (
            <a
              key={label}
              href={href}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-guiaa-brand-navy/70 transition hover:bg-guiaa-brand-navy/5 hover:text-guiaa-brand-navy"
              aria-label={label}
            >
              <Icon size={18} aria-hidden />
            </a>
          ) : (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-guiaa-brand-navy/70 transition hover:bg-guiaa-brand-navy/5 hover:text-guiaa-brand-navy"
              aria-label={label}
            >
              <Icon size={18} aria-hidden />
            </button>
          ),
        )}
      </aside>

      {setView && (
        <div className="landing-mobile-bar fixed inset-x-0 bottom-0 z-50 border-t border-guiaa-brand-navy/10 bg-white/95 px-3 py-2.5 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <button
              type="button"
              onClick={() => scrollToLandingProduct("species")}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-guiaa-brand-navy/10 py-2.5 text-xs font-semibold text-guiaa-brand-navy"
            >
              <Monitor size={15} aria-hidden />
              Producto
            </button>
            <button
              type="button"
              onClick={() => scrollToLandingSection("#faq")}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-guiaa-brand-navy/10 py-2.5 text-xs font-semibold text-guiaa-brand-navy"
            >
              <MessageCircle size={15} aria-hidden />
              FAQ
            </button>
            <button
              type="button"
              onClick={() => setView("register")}
              className="inline-flex flex-[1.2] items-center justify-center rounded-xl bg-guiaa-brand-green py-2.5 text-xs font-bold text-white"
            >
              Registro
            </button>
          </div>
        </div>
      )}
    </>
  );
}
