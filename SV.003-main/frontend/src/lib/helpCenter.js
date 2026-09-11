/** Temas del centro de ayuda y vínculo vista clínica → guía. */

export const HELP_TOPIC_IDS = [
  "getting-started",
  "dashboard",
  "diagnosis",
  "clients",
  "agenda",
  "inventory",
  "billing",
  "reports",
  "history",
  "lab",
  "settings",
  "membership",
  "profile",
  "shortcuts",
];

/** Vista de la app → id de guía (para tips contextuales). */
export const VIEW_TO_HELP_TOPIC = {
  dashboard: "dashboard",
  "new-consultation": "diagnosis",
  clients: "clients",
  patients: "clients",
  agenda: "agenda",
  inventory: "inventory",
  billing: "billing",
  reports: "reports",
  "consultation-history": "history",
  "medical-images": "lab",
  settings: "settings",
  tools: "settings",
  membership: "membership",
  profile: "profile",
};

/** Vista destino al pulsar “Ir al módulo” desde una guía. */
export const HELP_TOPIC_TO_VIEW = {
  "getting-started": "dashboard",
  dashboard: "dashboard",
  diagnosis: "new-consultation",
  clients: "clients",
  agenda: "agenda",
  inventory: "inventory",
  billing: "billing",
  reports: "reports",
  history: "consultation-history",
  lab: "medical-images",
  settings: "settings",
  membership: "membership",
  profile: "profile",
  shortcuts: "dashboard",
};

export const OPEN_PLATFORM_ONBOARDING_EVENT = "guiaa:open-platform-onboarding";

export function requestPlatformOnboarding() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_PLATFORM_ONBOARDING_EVENT));
}

export function helpCenterPath(topicId) {
  if (!topicId || !HELP_TOPIC_IDS.includes(topicId)) return "/app/ayuda";
  return `/app/ayuda?tema=${encodeURIComponent(topicId)}`;
}
