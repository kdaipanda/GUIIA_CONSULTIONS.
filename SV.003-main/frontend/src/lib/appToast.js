import { toast } from "sonner";
import { formatApiErrorDetail } from "./friendlyFetchError";
import { AlertBanner } from "@/components/ui/alert-banner";

function toastMessage(message) {
  if (message == null || message === "") return "";
  if (typeof message === "string") return message;
  return formatApiErrorDetail(message, "Error desconocido");
}

const TYPE_TO_VARIANT = {
  success: "success",
  error: "destructive",
  warning: "warning",
  info: "info",
  primary: "primary",
};

function showBannerToast(message, type = "info", options = {}) {
  const text = toastMessage(message);
  if (!text) return;

  const variant = TYPE_TO_VARIANT[type] || "info";
  const {
    duration = type === "error" ? 6000 : 4500,
    actionLabel,
    onAction,
    ...rest
  } = options;

  return toast.custom(
    (id) => (
      <AlertBanner
        variant={variant}
        actionLabel={actionLabel}
        onAction={
          onAction
            ? () => {
                onAction();
                toast.dismiss(id);
              }
            : undefined
        }
        onClose={() => toast.dismiss(id)}
      >
        {text}
      </AlertBanner>
    ),
    {
      duration,
      className: "guiaa-toast-banner",
      ...rest,
    },
  );
}

export function notify(message, type = "info") {
  showBannerToast(message, type);
}

export function notifySuccess(message) {
  notify(message, "success");
}

export function notifyError(message, options) {
  const text = toastMessage(message);
  if (!text) return;

  if (options?.action?.label && options?.action?.onClick) {
    showBannerToast(text, "error", {
      duration: options.duration ?? 8000,
      actionLabel: options.action.label,
      onAction: options.action.onClick,
    });
    return;
  }

  if (options) {
    showBannerToast(text, "error", {
      duration: options.duration,
    });
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
    showBannerToast(text, "error", {
      duration: 8000,
      actionLabel: "Ver planes",
      onAction: onViewMembership,
    });
    return;
  }
  showBannerToast(text, "error");
}

export function notifyWarning(message) {
  notify(message, "warning");
}

export function notifyPrimary(message, options) {
  showBannerToast(message, "primary", options);
}

export function notifyInfo(message, options) {
  showBannerToast(message, "info", options);
}

/** Compat con showToast(message, type) legacy de App.js */
export function showToast(message, type = "info") {
  notify(message, type);
}
