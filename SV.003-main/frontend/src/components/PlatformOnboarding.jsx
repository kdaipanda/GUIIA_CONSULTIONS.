import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PLATFORM_ONBOARDING_STEPS,
  markPlatformOnboardingComplete,
} from "../lib/platformOnboarding";

const VIEW_TO_PATH = {
  dashboard: "/app/dashboard",
  "new-consultation": "/app/consultas/nueva",
  clients: "/app/clientes",
  agenda: "/app/agenda",
  inventory: "/app/inventario",
  billing: "/app/facturacion",
  reports: "/app/reportes",
  "consultation-history": "/app/historial",
  membership: "/app/membresia",
};

export function PlatformOnboarding({ isOpen, onClose, veterinarianId, setView }) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const steps = PLATFORM_ONBOARDING_STEPS;
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const finish = () => {
    markPlatformOnboardingComplete(veterinarianId);
    setStepIndex(0);
    onClose?.();
  };

  const goToAction = () => {
    if (!step?.actionView) return;
    setView?.(step.actionView);
    const path = VIEW_TO_PATH[step.actionView];
    if (path) navigate(path);
    finish();
  };

  const handleNext = () => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleSkip = () => {
    finish();
  };

  if (!step) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleSkip();
      }}
    >
      <DialogContent className="platform-onboarding-dialog sm:max-w-lg">
        <DialogHeader>
          <div className="platform-onboarding-progress" aria-hidden>
            {steps.map((s, idx) => (
              <span
                key={s.id}
                className={`platform-onboarding-dot${idx === stepIndex ? " active" : ""}${idx < stepIndex ? " done" : ""}`}
              />
            ))}
          </div>
          <p className="platform-onboarding-step-label">
            Paso {stepIndex + 1} de {steps.length}
          </p>
          <DialogTitle className="platform-onboarding-title">
            <span className="platform-onboarding-icon" aria-hidden>
              {step.icon}
            </span>
            {step.title}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="platform-onboarding-body">
              <p>{step.body}</p>
              {step.hint && (
                <p className="platform-onboarding-hint">
                  Atajo de teclado: <kbd>{step.hint}</kbd>
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="platform-onboarding-footer">
          <div className="platform-onboarding-footer-left">
            {!isFirst && (
              <Button type="button" variant="ghost" onClick={handleBack}>
                Anterior
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={handleSkip}>
              Omitir tour
            </Button>
          </div>
          <div className="platform-onboarding-footer-right">
            {step.actionView && (
              <Button type="button" variant="secondary" onClick={goToAction}>
                {step.actionLabel}
              </Button>
            )}
            <Button type="button" onClick={handleNext}>
              {isLast ? "Comenzar" : "Siguiente"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
