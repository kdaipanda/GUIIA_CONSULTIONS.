import {
  CONSULTATION_CATEGORY_ICONS,
  CONSULTATION_CATEGORY_LIST,
  CONSULTATION_CATEGORY_NAMES,
} from "../../lib/consultationCategories";

export const PREVIEW_CATEGORIES = CONSULTATION_CATEGORY_LIST.map(({ key }) => key);

export const PREVIEW_CATEGORY_LABELS = PREVIEW_CATEGORIES.reduce((acc, key) => {
  acc[key] = CONSULTATION_CATEGORY_NAMES[key] || key;
  return acc;
}, {});

export const PREVIEW_CATEGORY_ICONS = PREVIEW_CATEGORIES.reduce((acc, key) => {
  acc[key] = CONSULTATION_CATEGORY_ICONS[key] || "🐾";
  return acc;
}, {});

export const LANDING_SCREENSHOTS = [
  {
    id: "species",
    label: "Selección de especie",
    caption: "Flujo multiespecie con formularios adaptados por categoría.",
    src: "/landing/consultation-species.png",
    alt: "Pantalla de nueva consulta con selector de especie en GUIAA",
  },
  {
    id: "consultation",
    label: "Consulta clínica",
    caption: "Anamnesis estructurada con progreso visible durante la consulta.",
    src: "/landing/consultation-form.png",
    alt: "Pantalla de motivo de consulta con campos clínicos en GUIAA",
  },
  {
    id: "dashboard",
    label: "Panel MVZ",
    caption: "Resumen de consultas, membresía y accesos rápidos del consultorio.",
    src: "/landing/dashboard.png",
    alt: "Panel clínico del veterinario en GUIAA",
  },
];

export const HERO_PRODUCT_SCREENSHOT = LANDING_SCREENSHOTS[0];
