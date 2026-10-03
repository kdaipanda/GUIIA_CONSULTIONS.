import * as React from "react";
import { Bell, Check, Minus, X } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import "./alertBanner.css";

const alertBannerVariants = cva("guiaa-alert-banner", {
  variants: {
    variant: {
      primary: "guiaa-alert-banner--primary",
      success: "guiaa-alert-banner--success",
      destructive: "guiaa-alert-banner--destructive",
      info: "guiaa-alert-banner--info",
      warning: "guiaa-alert-banner--warning",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

function BangIcon({ className }) {
  return (
    <span className={cn("guiaa-alert-banner__bang", className)} aria-hidden>
      !
    </span>
  );
}

function DashIcon({ className }) {
  return <Minus className={className} strokeWidth={2.75} aria-hidden />;
}

function CheckIcon({ className }) {
  return <Check className={className} strokeWidth={2.5} aria-hidden />;
}

function BellIcon({ className }) {
  return <Bell className={className} strokeWidth={1.75} aria-hidden />;
}

const VARIANT_ICONS = {
  primary: BellIcon,
  success: CheckIcon,
  destructive: BangIcon,
  info: BangIcon,
  warning: DashIcon,
};

const AlertBanner = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      children,
      actionLabel,
      onAction,
      onClose,
      icon,
      ...props
    },
    ref,
  ) => {
    const Icon = icon || VARIANT_ICONS[variant] || BellIcon;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertBannerVariants({ variant }), className)}
        {...props}
      >
        <div className="guiaa-alert-banner__main">
          <span className="guiaa-alert-banner__icon" aria-hidden>
            <Icon className="guiaa-alert-banner__icon-svg" />
          </span>
          <div className="guiaa-alert-banner__message">{children}</div>
        </div>

        <div className="guiaa-alert-banner__actions">
          {actionLabel && onAction ? (
            <button
              type="button"
              className="guiaa-alert-banner__action"
              onClick={onAction}
            >
              {actionLabel}
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              className="guiaa-alert-banner__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    );
  },
);
AlertBanner.displayName = "AlertBanner";

export { AlertBanner, alertBannerVariants };
