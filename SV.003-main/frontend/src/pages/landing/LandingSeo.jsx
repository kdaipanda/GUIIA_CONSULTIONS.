import { useEffect } from "react";

const LANDING_TITLE = "GUIAA — Plataforma clínica CDS para MVZ";
const LANDING_DESCRIPTION =
  "Soporte a la decisión clínica CDS L4 y L5 para médicos veterinarios certificados. Multiespecie, expediente, inventario y ventas en Latinoamérica.";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://guiaa.vet/#website",
      url: "https://guiaa.vet/",
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
