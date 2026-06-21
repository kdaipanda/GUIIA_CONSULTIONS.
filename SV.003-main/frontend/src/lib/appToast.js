import { toast } from "sonner";

export function notify(message, type = "info") {
  if (!message) return;
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "warning":
      toast.warning(message);
      break;
    default:
      toast.message(message);
  }
}

export function notifySuccess(message) {
  notify(message, "success");
}

export function notifyError(message, options) {
  if (!message) return;
  if (options) {
    toast.error(message, options);
    return;
  }
  notify(message, "error");
}

export function notifyQuotaError(message, onViewMembership) {
  if (!message) return;
  const isQuota =
    message.includes("agotado") ||
    message.includes("consultas de prueba") ||
    message.includes("consultas gratuitas") ||
    message.includes("membresía activa") ||
    message.includes("TRIAL_EXHAUSTED");
  if (isQuota && onViewMembership) {
    toast.error(message, {
      duration: 8000,
      action: { label: "Ver planes", onClick: onViewMembership },
    });
    return;
  }
  toast.error(message);
}

export function notifyWarning(message) {
  notify(message, "warning");
}

/** Compat con showToast(message, type) legacy de App.js */
export function showToast(message, type = "info") {
  notify(message, type);
}
