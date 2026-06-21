/** Viewport compacto: sidebar oculto, drawer Vaul + toolbar clínica */
export const CLINIC_COMPACT_MAX_PX = 1023;
export const CLINIC_COMPACT_MEDIA_QUERY = `(max-width: ${CLINIC_COMPACT_MAX_PX}px)`;

export function isClinicCompactViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(CLINIC_COMPACT_MEDIA_QUERY).matches;
}
