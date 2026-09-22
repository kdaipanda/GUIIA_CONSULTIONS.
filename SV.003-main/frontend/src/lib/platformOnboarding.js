import {
  BarChart3,
  CalendarDays,
  MessageCircle,
  Package,
  PawPrint,
  Sparkles,
  Stethoscope,
} from "lucide-react";

const ONBOARDING_VERSION = 1;

export function platformOnboardingStorageKey(vetId) {
  return `guiaa_platform_onboarding_v${ONBOARDING_VERSION}_${vetId}`;
}

export function hasCompletedPlatformOnboarding(vetId) {
  if (!vetId) return true;
  try {
    return localStorage.getItem(platformOnboardingStorageKey(vetId)) === "done";
  } catch {
    return false;
  }
}

export function markPlatformOnboardingComplete(vetId) {
  if (!vetId) return;
  try {
    localStorage.setItem(platformOnboardingStorageKey(vetId), "done");
  } catch {
    /* ignore */
  }
}

export const PLATFORM_ONBOARDING_STEPS = [
  {
    id: "welcome",
    Icon: Sparkles,
  },
  {
    id: "diagnosis",
    Icon: Stethoscope,
    hint: "N",
    actionView: "new-consultation",
  },
  {
    id: "patients",
    Icon: PawPrint,
  },
  {
    id: "agenda",
    Icon: CalendarDays,
  },
  {
    id: "inventory-sales",
    Icon: Package,
  },
  {
    id: "reports",
    Icon: BarChart3,
  },
  {
    id: "support",
    Icon: MessageCircle,
  },
];
