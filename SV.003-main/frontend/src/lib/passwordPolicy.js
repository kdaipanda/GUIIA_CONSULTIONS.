export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_REQUIREMENTS_TEXT =
  "Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un carácter especial (p. ej. !@#$%).";

const HAS_UPPER = /[A-ZÁÉÍÓÚÑ]/;
const HAS_LOWER = /[a-záéíóúñ]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]/;

export const PASSWORD_CHECKS = [
  {
    id: "length",
    label: `Al menos ${MIN_PASSWORD_LENGTH} caracteres`,
    test: (value) => value.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "upper",
    label: "Una letra mayúscula",
    test: (value) => HAS_UPPER.test(value),
  },
  {
    id: "lower",
    label: "Una letra minúscula",
    test: (value) => HAS_LOWER.test(value),
  },
  {
    id: "digit",
    label: "Un número",
    test: (value) => HAS_DIGIT.test(value),
  },
  {
    id: "special",
    label: "Un carácter especial (!@#$%…)",
    test: (value) => HAS_SPECIAL.test(value),
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
    return "Ingresa una contraseña.";
  }
  const failed = getPasswordChecks(value).find((check) => !check.met);
  return failed ? `La contraseña no cumple los requisitos: ${failed.label.toLowerCase()}.` : null;
}

export function isPasswordValid(password) {
  return !getPasswordValidationError(password);
}
