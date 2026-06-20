export const PLATFORM_ADMIN_EMAIL = "carlos.hernandez@vetmed.com";

/** @deprecated No usar para autorización; el backend valida platform_admin con JWT. */
export function isPlatformAdminEmail(email) {
  return (email || "").toLowerCase().trim() === PLATFORM_ADMIN_EMAIL;
}
