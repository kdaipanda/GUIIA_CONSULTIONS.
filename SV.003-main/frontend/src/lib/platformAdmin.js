/** Único admin de plataforma GUIAA en UI (salvo PLATFORM_ADMIN_EMAILS en backend). */
export const PLATFORM_ADMIN_EMAIL = "carlos.hernandez@vetmed.com";

export function isPlatformAdminEmail(email) {
  return (email || "").toLowerCase().trim() === PLATFORM_ADMIN_EMAIL;
}
