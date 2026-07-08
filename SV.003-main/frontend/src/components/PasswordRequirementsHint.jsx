import React from "react";
import {
  getPasswordChecks,
  PASSWORD_EXAMPLE_TEXT,
  PASSWORD_HELP_INTRO,
} from "../lib/passwordPolicy";

export function PasswordRequirementsHint({ password, className = "", showIntro = true, id }) {
  const checks = getPasswordChecks(password);
  const metCount = checks.filter((check) => check.met).length;
  const allMet = metCount === checks.length && (password || "").length > 0;
  const headingId = id ? `${id}-heading` : "password-requirements-heading";

  return (
    <div className={`password-requirements-panel ${className}`.trim()} id={id}>
      {showIntro && (
        <>
          <p className="password-requirements-intro clinic-muted">{PASSWORD_HELP_INTRO}</p>
          <p className="password-requirements-example clinic-muted">{PASSWORD_EXAMPLE_TEXT}</p>
        </>
      )}
      <p className="password-requirements-heading" id={headingId}>
        Tu contraseña debe tener:
      </p>
      <ul
        className="password-requirements-hint clinic-muted"
        aria-live="polite"
        aria-labelledby={headingId}
      >
        {checks.map((check) => (
          <li key={check.id} className={check.met ? "password-requirements-hint--met" : ""}>
            {check.label}
          </li>
        ))}
      </ul>
      {allMet && (
        <p className="password-requirements-ready" role="status">
          Listo: tu contraseña cumple los requisitos.
        </p>
      )}
    </div>
  );
}
