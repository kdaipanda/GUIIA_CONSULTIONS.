import React from "react";
import { Mail, MessageCircle, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { scrollToLandingProduct, scrollToLandingSection } from "./landingScroll";

export function LandingSocialRail() {
  const { t } = useTranslation("landing");

  const desktopItems = [
    {
      icon: Monitor,
      label: t("socialRail.product"),
      onClick: () => scrollToLandingProduct("species"),
    },
    {
      icon: MessageCircle,
      label: t("socialRail.faq"),
      onClick: () => scrollToLandingSection("#faq"),
    },
    {
      icon: Mail,
      label: t("socialRail.contact"),
      href: "mailto:soporte@guiaa.vet",
    },
  ];

  return (
    <>
      <aside
        className="landing-rail fixed right-3 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 rounded-full border px-2.5 py-4 backdrop-blur-md lg:flex xl:right-6"
        aria-label={t("socialRail.aria")}
      >
        {desktopItems.map(({ icon: Icon, label, href, onClick }) =>
          href ? (
            <a
              key={label}
              href={href}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-guiaa-brand-navy/70 transition hover:bg-guiaa-brand-navy/5 hover:text-guiaa-brand-navy"
              aria-label={label}
            >
              <Icon size={18} aria-hidden />
              <span className="sr-only">{label}</span>
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
              <span className="sr-only">{label}</span>
            </button>
          ),
        )}
      </aside>
    </>
  );
}
