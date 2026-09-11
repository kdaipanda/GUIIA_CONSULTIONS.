import React from "react";
import { FileText, PawPrint, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

const ITEMS = [
  { icon: ShieldCheck, key: "license" },
  { icon: PawPrint, key: "species" },
  { icon: FileText, key: "history" },
];

export function LandingTrustStrip() {
  const { t } = useTranslation("landing");

  return (
    <section className="landing-trust-strip" aria-label={t("trust.aria")}>
      <div className="landing-container landing-trust-strip-inner">
        {ITEMS.map(({ icon: Icon, key }) => (
          <div key={key} className="landing-trust-strip-item">
            <span className="landing-trust-icon shrink-0">
              <Icon size={17} className="text-guiaa-brand-blue" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-guiaa-brand-navy">
                {t(`trust.items.${key}.text`)}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-guiaa-brand-ink-muted">
                {t(`trust.items.${key}.sub`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
