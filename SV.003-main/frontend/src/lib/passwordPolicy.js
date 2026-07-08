export const MIN_PASSWORD_LENGTH = 6;

export const PASSWORD_HELP_INTRO =
  "Crea una contraseña personal que solo tú conozcas. La usarás cada vez que entres a GUIAA.";

export const PASSWORD_EXAMPLE_TEXT =
  "Ejemplos válidos: Vet2024 · Luna08 · clinica1";

export const PASSWORD_REQUIREMENTS_TEXT =
  "Al menos 6 caracteres, con letras y números.";

const HAS_LETTER = /[A-Za-záéíóúñÁÉÍÓÚÑ]/;
const HAS_DIGIT = /\d/;

export const PASSWORD_CHECKS = [
  {
    id: "length",
    label: "Mínimo 6 caracteres",
    helpText: "Usa al menos 6 caracteres.",
    test: (value) => value.length >= MIN_PASSWORD_LENGTH,
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

export const PASSWORD_RULES_ATTR = `minlength: ${MIN_PASSWORD_LENGTH}; required: lower; required: digit;`;
