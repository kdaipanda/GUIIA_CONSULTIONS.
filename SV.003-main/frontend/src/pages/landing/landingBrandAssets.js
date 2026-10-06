/** Imágenes de marca GUIAA para la landing (public/) */

export const LANDING_IMAGES = {
  /** Mascota en vuelo — ideal para hero (dinámica, encuadre vertical) */
  heroMascot: "/brand/doctor-plumitas-flying.png",
  /** Plumitas volando sin fondo — banda de marca animada */
  mascotFlyingCutout: "/brand/doctor-plumitas-flying-cutout.png",
  /** Hub con iconos del producto — poster de video y vista del ecosistema */
  heroHub: "/brand/doctor-plumitas-hub.png",
  /** Mascota HD transparente — bandas, avatares y CTAs */
  mascotHd: "/brand/doctor-plumitas-hd.png",
  /** Sticker con contorno — acentos decorativos */
  mascotSticker: "/brand/doctor-plumitas-sticker.png",
  /** Capturas reales del producto */
  screenshots: {
    species: "/landing/consultation-species.png",
    consultation: "/landing/consultation-form.png",
    dashboard: "/landing/dashboard.png",
  },
  pets: {
    dogGolden: "/landing/pets/dog-golden.png",
    catTabby: "/landing/pets/cat-tabby.png",
    puppy: "/landing/pets/puppy.png",
    corgi: "/landing/pets/corgi.png",
    catGinger: "/landing/pets/cat-ginger.png",
    catBlack: "/landing/pets/cat-black.png",
    exoticMacaw: "/landing/pets/exotic-macaw.png",
    owlClinical: "/landing/pets/owl-clinical-stethoscope.png",
    speciesPerros: "/landing/pets/species-perros.jpg",
    speciesGatos: "/landing/pets/species-gatos.jpg",
    speciesConejos: "/landing/pets/species-conejos.jpg",
    speciesAves: "/landing/pets/species-aves.jpg",
    speciesHamsters: "/landing/pets/species-hamsters.jpg",
    speciesCuyos: "/landing/pets/species-cuyos.jpg",
    speciesHurones: "/landing/pets/species-hurones.jpg",
    speciesErizos: "/landing/pets/species-erizos.jpg",
    speciesTortugas: "/landing/pets/species-tortugas.jpg",
    speciesIguanas: "/landing/pets/species-iguanas.jpg",
    speciesPatosPollos: "/landing/pets/species-patos-pollos.jpg",
  },
};

/**
 * Video cinematográfico del hero: mezcla Veterinarian3 + guiaa-launch-raw
 * (hook / producto / diferenciador con crossfades). Fallback: VG1.
 */
export const LANDING_HERO_VIDEO_CINEMATIC = "/landing/guiaa-hero-mix.mp4";

/** Preferir el cine del hero; si falla, usamos VG1 local. */
export const LANDING_HERO_VIDEO_USE_CINEMATIC = true;

export const LANDING_HERO_VIDEO = "/VG1.mp4";
export const LANDING_HERO_VIDEO_MOBILE = "/VG1-mobile.mp4";
/** Upscale 2× (2520×2160) — solo si el archivo está desplegado en /public. */
export const LANDING_HERO_VIDEO_4K = "/VG1-4k.mp4";
/** En producción aún no siempre está VG1-4k; no lo elegir como src primario. */
export const LANDING_HERO_VIDEO_4K_ENABLED = false;
export const LANDING_HERO_VIDEO_POSTER = "/landing/hero-cinematic-vet.jpg";

/**
 * Fuente según viewport:
 * - cinematic (Prisma) si está habilitado
 * - móvil / tablet estrecha → VG1-mobile
 * - escritorio → VG1
 * - 4K / ultra-wide (opcional) → VG1-4k si LANDING_HERO_VIDEO_4K_ENABLED
 */
export function resolveLandingHeroVideoSrc({
  mobileMaxWidth = 1023,
  largeMinWidth = 1600,
} = {}) {
  if (typeof window === "undefined") {
    return LANDING_HERO_VIDEO_USE_CINEMATIC
      ? LANDING_HERO_VIDEO_CINEMATIC
      : LANDING_HERO_VIDEO;
  }

  if (LANDING_HERO_VIDEO_USE_CINEMATIC) {
    return LANDING_HERO_VIDEO_CINEMATIC;
  }

  const isNarrow = window.matchMedia(`(max-width: ${mobileMaxWidth}px)`).matches;
  if (isNarrow) return LANDING_HERO_VIDEO_MOBILE;

  if (LANDING_HERO_VIDEO_4K_ENABLED) {
    const isLarge =
      window.matchMedia(`(min-width: ${largeMinWidth}px)`).matches ||
      (typeof window.devicePixelRatio === "number" &&
        window.devicePixelRatio >= 2 &&
        window.matchMedia("(min-width: 1280px)").matches);
    if (isLarge) return LANDING_HERO_VIDEO_4K;
  }

  return LANDING_HERO_VIDEO;
}

/** Siguiente fuente si el video actual falla (mix → Veterinarian3 → VG1 → móvil → null). */
export function nextLandingHeroVideoSrc(currentSrc) {
  if (currentSrc === LANDING_HERO_VIDEO_CINEMATIC) return "/landing/Veterinarian3.mp4";
  if (currentSrc === "/landing/Veterinarian3.mp4") return LANDING_HERO_VIDEO;
  if (currentSrc === LANDING_HERO_VIDEO_4K) return LANDING_HERO_VIDEO;
  if (currentSrc === LANDING_HERO_VIDEO) return LANDING_HERO_VIDEO_MOBILE;
  return null;
}

/**
 * Video de lanzamiento local (public/landing).
 */
export const LANDING_PRESENTATION_VIDEO = "/landing/guiaa-launch.mp4";
export const LANDING_PRESENTATION_POSTER = "/landing/guiaa-launch-poster.jpg";

/** Presentación YouTube del producto (inicio en 0:39). */
export const LANDING_PRESENTATION_YOUTUBE = {
  id: "cvg2wl_QuU8",
  startSeconds: 39,
  watchUrl: "https://www.youtube.com/watch?v=cvg2wl_QuU8&t=39s",
};

export const LANDING_OG_IMAGE = "https://guiaa.vet/brand/doctor-plumitas-hub.png";

/** Redes sociales GUIAA — sobreescribir con REACT_APP_SOCIAL_* en producción si aplica. */
export const LANDING_SOCIAL_LINKS = [
  {
    id: "instagram",
    label: "Instagram",
    href:
      process.env.REACT_APP_SOCIAL_INSTAGRAM?.trim() ||
      "https://www.instagram.com/guiaacds/",
  },
  {
    id: "tiktok",
    label: "TikTok",
    href:
      process.env.REACT_APP_SOCIAL_TIKTOK?.trim() ||
      "https://www.tiktok.com/@guiaacds",
  },
  {
    id: "youtube",
    label: "YouTube",
    href:
      process.env.REACT_APP_SOCIAL_YOUTUBE?.trim() ||
      "https://www.youtube.com/@GUIAAAPOYODECISI%C3%93NCL%C3%8DNICAVETER",
  },
  {
    id: "facebook",
    label: "Facebook",
    href:
      process.env.REACT_APP_SOCIAL_FACEBOOK?.trim() ||
      "https://www.facebook.com/profile.php?id=61586482517880",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href:
      process.env.REACT_APP_SOCIAL_LINKEDIN?.trim() ||
      "https://www.linkedin.com/in/guiaa-0266363a8",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    subtitle: "+52 56 2069 0369",
    href:
      process.env.REACT_APP_SOCIAL_WHATSAPP?.trim() ||
      "https://wa.me/525620690369",
  },
].filter((item) => item.href);

export const LANDING_NEWSLETTER_EMAIL =
  process.env.REACT_APP_NEWSLETTER_EMAIL?.trim() || "soporte@guiaa.vet";
