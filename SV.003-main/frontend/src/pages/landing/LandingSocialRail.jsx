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

export function LandingSocialRail() {
  return (
    <>
      <aside
        className="landing-rail fixed right-3 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 rounded-full border px-2.5 py-4 backdrop-blur-md lg:flex xl:right-6"
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
    </>
  );
}
