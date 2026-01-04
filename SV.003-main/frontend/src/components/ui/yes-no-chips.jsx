import React from "react";

const YesNoChips = ({ value, onChange, disabled = false }) => {
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
        No
      </button>
      <button
        type="button"
        className={`yes-no-chip ${current === "SI" ? "active-yes" : ""}`}
        onClick={() => handleClick("SI")}
        disabled={disabled}
      >
        Sí
      </button>
    </div>
  );
};

export default YesNoChips;
