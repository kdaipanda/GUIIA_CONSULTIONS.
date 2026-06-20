/** Colores del menú clínico (sidebar + paleta de comandos). */
const CLINIC_NAV_THEMES = {
  dashboard: { from: "#3b82f6", to: "#2563eb", glow: "59, 130, 246" },
  "new-consultation": {
    from: "#10b981",
    to: "#059669",
    glow: "16, 185, 129",
    hero: true,
  },
  clients: { from: "#8b5cf6", to: "#7c3aed", glow: "139, 92, 246" },
  patients: { from: "#f59e0b", to: "#d97706", glow: "245, 158, 11" },
  agenda: { from: "#0ea5e9", to: "#0284c7", glow: "14, 165, 233" },
  inventory: { from: "#6366f1", to: "#4f46e5", glow: "99, 102, 241" },
  billing: { from: "#14b8a6", to: "#0d9488", glow: "20, 184, 166" },
  reports: { from: "#ec4899", to: "#db2777", glow: "236, 72, 153" },
  tools: { from: "#f97316", to: "#ea580c", glow: "249, 115, 22" },
  settings: { from: "#64748b", to: "#475569", glow: "100, 116, 139" },
  "consultation-history": {
    from: "#a855f7",
    to: "#9333ea",
    glow: "168, 85, 247",
  },
  membership: { from: "#eab308", to: "#ca8a04", glow: "234, 179, 8" },
  profile: { from: "#06b6d4", to: "#0891b2", glow: "6, 182, 212" },
  admin: { from: "#ef4444", to: "#dc2626", glow: "239, 68, 68" },
  "expert-consultation": {
    from: "#7c3aed",
    to: "#6d28d9",
    glow: "124, 58, 237",
    hero: true,
  },
  "medical-images": { from: "#2563eb", to: "#1d4ed8", glow: "37, 99, 235" },
};

export function getClinicNavTheme(viewOrId) {
  return CLINIC_NAV_THEMES[viewOrId] || CLINIC_NAV_THEMES.dashboard;
}

export function clinicNavThemeStyle(viewOrId) {
  const theme = getClinicNavTheme(viewOrId);
  return {
    "--nav-from": theme.from,
    "--nav-to": theme.to,
    "--nav-glow": theme.glow,
  };
}

export function clinicNavIsHero(viewOrId) {
  return Boolean(getClinicNavTheme(viewOrId).hero);
}
