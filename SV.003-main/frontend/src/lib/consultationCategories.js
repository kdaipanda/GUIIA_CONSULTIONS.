export const CONSULTATION_CATEGORY_ICONS = {
  perros: "🐕",
  gatos: "🐈",
  conejos: "🐰",
  aves: "🦜",
  hamsters: "🐭",
  cuyos: "🐹",
  hurones: "🦡",
  erizos: "🦔",
  tortugas: "🐢",
  iguanas: "🦎",
  patos_pollos: "🐥",
};

export const CONSULTATION_CATEGORY_NAMES = {
  perros: "Perros",
  gatos: "Gatos",
  conejos: "Conejos",
  aves: "Aves",
  hamsters: "Hámsters",
  cuyos: "Cuyos",
  hurones: "Hurones",
  erizos: "Erizos",
  tortugas: "Tortugas",
  iguanas: "Iguanas",
  patos_pollos: "Patos y Pollos",
};

export const CONSULTATION_CATEGORY_LIST = Object.entries(CONSULTATION_CATEGORY_ICONS).map(
  ([key, icon]) => ({
    key,
    icon,
    name: CONSULTATION_CATEGORY_NAMES[key] || key,
  }),
);
