import i18n from "../i18n";

export const MIN_PASSWORD_LENGTH = 6;

const HAS_LETTER = /[A-Za-záéíóúñÁÉÍÓÚÑ]/;
const HAS_DIGIT = /\d/;

const CHECK_DEFS = [
  {
    id: "length",
    test: (value) => value.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "letter",
    test: (value) => HAS_LETTER.test(value),
  },
  {
    id: "digit",
    test: (value) => HAS_DIGIT.test(value),
  },
];

function tp(key, options) {
  return i18n.t(`password.${key}`, { ns: "auth", ...options });
}

export function getPasswordChecks(password) {
  const value = password || "";
  return CHECK_DEFS.map((check) => ({
    id: check.id,
    label: tp(`checks.${check.id}.label`),
    helpText: tp(`checks.${check.id}.help`),
    met: check.test(value),
  }));
}

export function getPasswordValidationError(password) {
  const value = (password || "").trim();
  if (!value) {
    return tp("errors.empty");
  }
  const failed = getPasswordChecks(value).find((check) => !check.met);
  return failed?.helpText || null;
}

export function normalizePasswordInput(value) {
  return (value ?? "").trim();
}

export function isPasswordValid(password) {
  return !getPasswordValidationError(password);
}

export const PASSWORD_RULES_ATTR = `minlength: ${MIN_PASSWORD_LENGTH}; required: lower; required: digit;`;
