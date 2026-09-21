import React from "react";
import { CONSULTATION_CATEGORY_LIST } from "../../lib/consultationCategories";

export function MultiespecieCategoryIcons({ compact = false }) {
  return (
    <div
      className={`landing-multiespecie-grid grid gap-1.5 ${
        compact ? "grid-cols-4" : "grid-cols-3 sm:grid-cols-4"
      }`}
      aria-hidden
    >
      {CONSULTATION_CATEGORY_LIST.map(({ key, icon, name }) => (
        <div
          key={key}
          title={name}
          className="landing-multiespecie-cell flex flex-col items-center justify-center rounded-lg border border-guiaa-brand-navy/10 bg-white px-1 py-1.5 sm:py-2"
        >
          <span
            className={`landing-multiespecie-emoji leading-none ${
              compact ? "text-xl" : "text-2xl sm:text-[1.65rem]"
            }`}
          >
            {icon}
          </span>
          {!compact && (
            <span className="mt-1 hidden text-center text-[9px] font-semibold leading-tight text-guiaa-brand-navy/70 sm:block">
              {name.split(" ")[0]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
