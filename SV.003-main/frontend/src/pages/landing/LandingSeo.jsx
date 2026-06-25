import { useEffect } from "react";
import { LANDING_OG_IMAGE } from "./landingBrandAssets";

const LANDING_URL = "https://guiaa.vet/";
const LANDING_TITLE = "GUIAA — Plataforma clínica CDS para MVZ";
const LANDING_DESCRIPTION =
  "Soporte a la decisión clínica CDS L4 y L5 para médicos veterinarios certificados. Multiespecie, expediente, inventario y ventas en Latinoamérica.";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://guiaa.vet/#website",
      url: LANDING_URL,
      name: "GUIAA",
      description: LANDING_DESCRIPTION,
      inLanguage: "es",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://guiaa.vet/#application",
      name: "GUIAA",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      description: LANDING_DESCRIPTION,
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/OnlineOnly",
        eligibleCustomerType: "https://schema.org/MedicalOrganization",
      },
      audience: {
        "@type": "Audience",
        audienceType: "Médicos veterinarios certificados",
      },
    },
  ],
};

export function LandingSeo() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = LANDING_TITLE;

    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute("content") ?? "";

    if (descriptionTag) {
      descriptionTag.setAttribute("content", LANDING_DESCRIPTION);
    }

    const upsertMeta = (attr, key, value) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", value);
    };

    const upsertLink = (rel, href) => {
      let tag = document.querySelector(`link[rel="${rel}"]`);
      if (!tag) {
        tag = document.createElement("link");
        tag.setAttribute("rel", rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute("href", href);
    };

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", LANDING_URL);
    upsertMeta("property", "og:image", LANDING_OG_IMAGE);
    upsertMeta("property", "og:title", LANDING_TITLE);
    upsertMeta("property", "og:description", LANDING_DESCRIPTION);
    upsertMeta("property", "og:locale", "es_MX");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", LANDING_TITLE);
    upsertMeta("name", "twitter:description", LANDING_DESCRIPTION);
    upsertMeta("name", "twitter:image", LANDING_OG_IMAGE);
    upsertLink("canonical", LANDING_URL);
    upsertLink("preload", "/brand/doctor-plumitas-hub.png");
    const preloadTag = document.querySelector('link[rel="preload"][href*="doctor-plumitas-hub"]');
    if (preloadTag) {
      preloadTag.setAttribute("as", "image");
      preloadTag.setAttribute("type", "image/png");
      preloadTag.setAttribute("fetchpriority", "high");
    }

    const structuredDataScript = document.createElement("script");
    structuredDataScript.type = "application/ld+json";
    structuredDataScript.setAttribute("data-landing-seo", "true");
    structuredDataScript.textContent = JSON.stringify(STRUCTURED_DATA);
    document.head.appendChild(structuredDataScript);

    return () => {
      document.title = previousTitle;
      if (descriptionTag) {
        descriptionTag.setAttribute("content", previousDescription);
      }
      structuredDataScript.remove();
    };
  }, []);

  return null;
}
