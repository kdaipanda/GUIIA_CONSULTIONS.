import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANDING_OG_IMAGE } from "./landingBrandAssets";

const LANDING_URL = "https://guiaa.vet/";

export function LandingSeo() {
  const { t, i18n } = useTranslation("landing");
  const lang = (i18n.language || "en").startsWith("es") ? "es" : "en";

  useEffect(() => {
    const title = t("seo.title");
    const description = t("seo.description");
    const previousTitle = document.title;
    document.title = title;

    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute("content") ?? "";

    if (descriptionTag) {
      descriptionTag.setAttribute("content", description);
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
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:locale", lang === "es" ? "es_MX" : "en_US");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", LANDING_OG_IMAGE);
    upsertLink("canonical", LANDING_URL);
    upsertLink("preload", "/brand/doctor-plumitas-hub.png");
    const preloadTag = document.querySelector('link[rel="preload"][href*="doctor-plumitas-hub"]');
    if (preloadTag) {
      preloadTag.setAttribute("as", "image");
      preloadTag.setAttribute("type", "image/png");
      preloadTag.setAttribute("fetchpriority", "high");
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://guiaa.vet/#website",
          url: LANDING_URL,
          name: "GUIAA",
          description,
          inLanguage: lang,
        },
        {
          "@type": "SoftwareApplication",
          "@id": "https://guiaa.vet/#application",
          name: "GUIAA",
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          description,
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/OnlineOnly",
            eligibleCustomerType: "https://schema.org/MedicalOrganization",
          },
          audience: {
            "@type": "Audience",
            audienceType: t("seo.audience"),
          },
        },
      ],
    };

    document.querySelectorAll('script[data-landing-seo="true"]').forEach((node) => node.remove());
    const structuredDataScript = document.createElement("script");
    structuredDataScript.type = "application/ld+json";
    structuredDataScript.setAttribute("data-landing-seo", "true");
    structuredDataScript.textContent = JSON.stringify(structuredData);
    document.head.appendChild(structuredDataScript);

    return () => {
      document.title = previousTitle;
      if (descriptionTag) {
        descriptionTag.setAttribute("content", previousDescription);
      }
      structuredDataScript.remove();
    };
  }, [t, lang]);

  return null;
}
