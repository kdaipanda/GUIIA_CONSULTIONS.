import React from "react";
import { Check, Circle } from "lucide-react";
import {
  getPasswordChecks,
  PASSWORD_EXAMPLE_TEXT,
  PASSWORD_HELP_INTRO,
} from "../lib/passwordPolicy";

export function PasswordRequirementsHint({
  password,
  className = "",
  showIntro = true,
  id,
  variant = "default",
}) {
  const checks = getPasswordChecks(password);
  const metCount = checks.filter((check) => check.met).length;
  const allMet = metCount === checks.length && (password || "").length > 0;
  const headingId = id ? `${id}-heading` : "password-requirements-heading";
  const examples = PASSWORD_EXAMPLE_TEXT.replace(/^Ejemplos válidos:\s*/i, "");

  return (
    <div
      className={`password-requirements-panel password-requirements-panel--${variant} ${className}`.trim()}
      id={id}
    >
      {showIntro && (
        <p className="password-requirements-intro">{PASSWORD_HELP_INTRO}</p>
      )}

      <div className="password-requirements-card">
        <p className="password-requirements-heading" id={headingId}>
          Tu contraseña debe tener
        </p>
        <ul
          className="password-requirements-list"
          aria-live="polite"
          aria-labelledby={headingId}
        >
          {checks.map((check) => (
            <li
              key={check.id}
              className={
                check.met
                  ? "password-requirements-item password-requirements-item--met"
                  : "password-requirements-item"
              }
            >
              <span className="password-requirements-icon" aria-hidden>
                {check.met ? <Check size={14} strokeWidth={2.5} /> : <Circle size={14} strokeWidth={2} />}
              </span>
              <span>{check.label}</span>
            </li>
          ))}
        </ul>

        {showIntro && (
          <p className="password-requirements-examples">
            <span className="password-requirements-examples-label">Ejemplos:</span>
            {examples}
          </p>
        )}
      </div>

      {allMet && (
        <p className="password-requirements-ready" role="status">
          <Check size={14} strokeWidth={2.5} aria-hidden />
          Listo: tu contraseña cumple los requisitos.
        </p>
      )}
    </div>
  );
}
