import { toast } from "sonner";
import { formatApiErrorDetail } from "./friendlyFetchError";

function toastMessage(message) {
  if (message == null || message === "") return "";
  if (typeof message === "string") return message;
  return formatApiErrorDetail(message, "Error desconocido");
}

export function notify(message, type = "info") {
  const text = toastMessage(message);
  if (!text) return;
  switch (type) {
    case "success":
      toast.success(text);
      break;
    case "error":
      toast.error(text);
      break;
    case "warning":
      toast.warning(text);
      break;
    default:
      toast.message(text);
  }
}

export function notifySuccess(message) {
  notify(message, "success");
}

export function notifyError(message, options) {
  const text = toastMessage(message);
  if (!text) return;
  if (options) {
    toast.error(text, options);
    return;
  }
  notify(text, "error");
}

export function notifyQuotaError(message, onViewMembership) {
  const text = toastMessage(message);
  if (!text) return;
  const isQuota =
    text.includes("agotado") ||
    text.includes("consultas de prueba") ||
    text.includes("consultas gratuitas") ||
    text.includes("membresía activa") ||
    text.includes("TRIAL_EXHAUSTED");
  if (isQuota && onViewMembership) {
    toast.error(text, {
      duration: 8000,
      action: { label: "Ver planes", onClick: onViewMembership },
    });
    return;
  }
  toast.error(text);
}

export function notifyWarning(message) {
  notify(message, "warning");
}

/** Compat con showToast(message, type) legacy de App.js */
export function showToast(message, type = "info") {
  notify(message, type);
}
