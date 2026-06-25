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
  },
};

export const LANDING_HERO_VIDEO = "/VG1.mp4";
export const LANDING_HERO_VIDEO_MOBILE = "/VG1-mobile.mp4";
export const LANDING_HERO_VIDEO_POSTER = LANDING_IMAGES.heroHub;
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
