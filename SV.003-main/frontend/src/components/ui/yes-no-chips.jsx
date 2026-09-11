import React from "react";
import { useTranslation } from "react-i18next";

const YesNoChips = ({ value, onChange, disabled = false }) => {
  const { t } = useTranslation("speciesForms");
  const current = value;

  const handleClick = (next) => {
    if (disabled) return;
    if (onChange) onChange(next);
  };

  return (
    <div className="yes-no-chips">
      <button
        type="button"
        className={`yes-no-chip ${current === "NO" ? "active-no" : ""}`}
        onClick={() => handleClick("NO")}
        disabled={disabled}
      >
        {t("no")}
      </button>
      <button
        type="button"
        className={`yes-no-chip ${current === "SI" ? "active-yes" : ""}`}
        onClick={() => handleClick("SI")}
        disabled={disabled}
      >
        {t("yes")}
      </button>
    </div>
  );
};

export default YesNoChips;
