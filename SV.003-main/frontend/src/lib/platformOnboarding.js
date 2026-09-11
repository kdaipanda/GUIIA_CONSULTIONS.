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
    icon: "👋",
  },
  {
    id: "diagnosis",
    icon: "🩺",
    hint: "N",
    actionView: "new-consultation",
  },
  {
    id: "patients",
    icon: "🐾",
  },
  {
    id: "agenda",
    icon: "📅",
  },
  {
    id: "inventory-sales",
    icon: "📦",
  },
  {
    id: "reports",
    icon: "📈",
  },
  {
    id: "support",
    icon: "💬",
  },
];
