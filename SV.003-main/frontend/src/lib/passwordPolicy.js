export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72;

export const PASSWORD_HELP_INTRO =
  "Crea una contraseña personal que solo tú conozcas. La usarás cada vez que entres a GUIAA.";

export const PASSWORD_EXAMPLE_TEXT =
  "Ejemplos válidos: Clinica2024 · LunaVet08 · mipassword1";

export const PASSWORD_REQUIREMENTS_TEXT =
  "Al menos 8 caracteres, con letras y números. Máximo 72 caracteres.";

export const PASSWORD_TOO_LONG_MESSAGE =
  "La contraseña es demasiado larga; usa como máximo 72 caracteres.";

const HAS_LETTER = /[A-Za-záéíóúñÁÉÍÓÚÑ]/;
const HAS_DIGIT = /\d/;

function passwordByteLength(value) {
  return new TextEncoder().encode(value).length;
}

/** Evita pegar o autocompletar contraseñas que excedan el límite de bcrypt. */
export function clampPasswordInput(value) {
  const current = value ?? "";
  if (!current || passwordByteLength(current) <= MAX_PASSWORD_BYTES) {
    return current;
  }
  let trimmed = current;
  while (trimmed && passwordByteLength(trimmed) > MAX_PASSWORD_BYTES) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
}

export const PASSWORD_CHECKS = [
  {
    id: "length",
    label: "Mínimo 8 caracteres",
    helpText: "Usa al menos 8 caracteres; entre más larga, más segura.",
    test: (value) => value.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "max",
    label: "Máximo 72 caracteres",
    helpText: PASSWORD_TOO_LONG_MESSAGE,
    test: (value) => !value || passwordByteLength(value) <= MAX_PASSWORD_BYTES,
  },
  {
    id: "letter",
    label: "Al menos una letra (a-z)",
    helpText: "Incluye letras, por ejemplo el nombre de tu clínica o mascota.",
    test: (value) => HAS_LETTER.test(value),
  },
  {
    id: "digit",
    label: "Al menos un número (0-9)",
    helpText: "Agrega un número, por ejemplo el año o el día de tu cumpleaños.",
    test: (value) => HAS_DIGIT.test(value),
  },
];

export function getPasswordChecks(password) {
  const value = password || "";
  return PASSWORD_CHECKS.map((check) => ({
    ...check,
    met: check.test(value),
  }));
}

export function getPasswordValidationError(password) {
  const value = (password || "").trim();
  if (!value) {
    return "Escribe la contraseña con la que iniciarás sesión en GUIAA.";
  }
  const failed = getPasswordChecks(value).find((check) => !check.met);
  return failed?.helpText || null;
}

export function isPasswordValid(password) {
  return !getPasswordValidationError(password);
}

/** Texto corto para el atributo passwordrules del navegador (sin jerga de bits). */
export const PASSWORD_RULES_ATTR = `minlength: ${MIN_PASSWORD_LENGTH}; maxlength: ${MAX_PASSWORD_BYTES}; required: lower; required: digit;`;
