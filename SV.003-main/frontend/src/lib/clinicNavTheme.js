/**
 * Paleta del menú clínico alineada con GUIAA:
 * azul #265B93, teal #3d9b8f, navy #0c2d4d y variaciones suaves.
 */
const CLINIC_NAV_THEMES = {
  dashboard: {
    from: "#265B93",
    to: "#1e4a78",
    glow: "38, 91, 147",
  },
  "new-consultation": {
    from: "#3d9b8f",
    to: "#2f857a",
    glow: "61, 155, 143",
    hero: true,
  },
  clients: {
    from: "#3d7bb3",
    to: "#265B93",
    glow: "61, 123, 179",
  },
  patients: {
    from: "#358f87",
    to: "#2a736d",
    glow: "53, 143, 135",
  },
  agenda: {
    from: "#4a8fc4",
    to: "#3578a8",
    glow: "74, 143, 196",
  },
  inventory: {
    from: "#2a5f8f",
    to: "#1e4a78",
    glow: "42, 95, 143",
  },
  billing: {
    from: "#3d9b8f",
    to: "#328278",
    glow: "61, 155, 143",
  },
  reports: {
    from: "#5b7fa8",
    to: "#466789",
    glow: "91, 127, 168",
  },
  tools: {
    from: "#6b8eae",
    to: "#547892",
    glow: "107, 142, 174",
  },
  settings: {
    from: "#64748b",
    to: "#475569",
    glow: "100, 116, 139",
  },
  "consultation-history": {
    from: "#4a6fa0",
    to: "#365a85",
    glow: "74, 111, 160",
  },
  membership: {
    from: "#5a8f7e",
    to: "#467564",
    glow: "90, 143, 126",
  },
  profile: {
    from: "#3d7bb3",
    to: "#2f6a9e",
    glow: "61, 123, 179",
  },
  admin: {
    from: "#b85454",
    to: "#943f3f",
    glow: "184, 84, 84",
  },
  "expert-consultation": {
    from: "#2f857a",
    to: "#267068",
    glow: "47, 133, 122",
    hero: true,
  },
  "medical-images": {
    from: "#265B93",
    to: "#1a4066",
    glow: "38, 91, 147",
  },
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
