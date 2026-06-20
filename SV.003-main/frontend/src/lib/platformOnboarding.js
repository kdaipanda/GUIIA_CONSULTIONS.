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
    title: "Bienvenido a GUIAA",
    body:
      "Tu consultorio veterinario con soporte a la decisión clínica (CDS). Este recorrido te muestra lo esencial en un minuto.",
  },
  {
    id: "diagnosis",
    icon: "🩺",
    title: "GUIAA Diagnóstico",
    body:
      "Aquí inicias consultas clínicas: captura signos, motivo y datos de la mascota. El sistema genera análisis CDS de apoyo (no sustituye tu criterio profesional).",
    hint: "N",
    actionView: "new-consultation",
    actionLabel: "Ir a GUIAA Diagnóstico",
  },
  {
    id: "patients",
    icon: "🐾",
    title: "Dueños y Mascotas",
    body:
      "Registra dueños y mascotas para vincular historial clínico, antecedentes y consultas previas en un solo lugar.",
  },
  {
    id: "agenda",
    icon: "📅",
    title: "Agenda",
    body:
      "Organiza citas del día, confirma estados y recibe solicitudes de cita en línea desde tu consultorio.",
  },
  {
    id: "inventory-sales",
    icon: "📦",
    title: "Inventario y Ventas",
    body:
      "Controla stock de insumos y medicamentos, con alertas de stock bajo. En Ventas emites recibos clínicos vinculados al inventario (sin CFDI).",
  },
  {
    id: "reports",
    icon: "📈",
    title: "Reportes e Historial",
    body:
      "Consulta KPIs del consultorio, ingresos y productos más vendidos. En Historial revisas todas tus consultas CDS anteriores.",
  },
  {
    id: "support",
    icon: "💬",
    title: "Membresía, soporte y atajos",
    body:
      "Administra tu plan en Membresía. Usa el chat de soporte (esquina inferior) para dudas de la plataforma. Pulsa Ctrl+K (o ⌘K) para buscar cualquier módulo al instante.",
  },
];
