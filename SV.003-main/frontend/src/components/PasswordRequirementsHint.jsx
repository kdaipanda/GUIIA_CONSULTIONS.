import React from "react";
import { getPasswordChecks } from "../lib/passwordPolicy";

export function PasswordRequirementsHint({ password, className = "" }) {
  const checks = getPasswordChecks(password);

  return (
    <ul
      className={`password-requirements-hint clinic-muted ${className}`.trim()}
      aria-live="polite"
    >
      {checks.map((check) => (
        <li key={check.id} className={check.met ? "password-requirements-hint--met" : ""}>
          {check.label}
        </li>
      ))}
    </ul>
  );
}
