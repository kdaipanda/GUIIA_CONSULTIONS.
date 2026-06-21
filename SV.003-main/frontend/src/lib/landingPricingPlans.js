/**
 * Construye las tarjetas de precios de la landing desde el catálogo del backend.
 */
export function buildLandingPricingPlans(catalog) {
  const packages = catalog?.packages || {};
  const featuredKey = catalog?.featuredPlan || "professional";
  const featured = packages[featuredKey] || packages.professional;
  const basic = packages.basic;
  const premium = packages.premium;

  const featuredFeatures = featured?.features?.slice(0, 5) || [
    "GUIAA Diagnóstico CDS L4 · L5",
    "Expediente, clientes, pacientes y agenda",
    "Inventario, ventas y reportes clínicos",
    "Multiespecie según plan contratado",
    "Export PDF de consultas",
  ];

  const tierNames = [basic, packages[featuredKey], premium]
    .filter(Boolean)
    .map((pkg) => pkg.name)
    .join(" · ");

  const creditPrice = catalog?.creditPackages?.credits_10?.price;

  return [
    {
      name: featured?.name || "Profesional",
      price: featured?.price_monthly
        ? `$${Number(featured.price_monthly).toLocaleString("es-MX")}/mes`
        : "Consultar",
      priceNote: featured?.species_scope
        ? `${featured.species_scope} · facturación mensual o anual`
        : "Tarifa según volumen de consulta",
      description:
        "Diagnóstico CDS, expediente, inventario, ventas y multiespecie para consultorios activos.",
      highlighted: true,
      features: featuredFeatures,
      cta: "Comenzar registro",
      action: "register",
    },
    {
      name: "Membresía",
      price: basic?.price_monthly
        ? `Desde $${Number(basic.price_monthly).toLocaleString("es-MX")}/mes`
        : "Desde $950/mes",
      priceNote: tierNames || "Básica · Profesional · Premium",
      description:
        "Consultas mensuales o anuales con funciones Premium: Manejo Experto e interpretación de análisis.",
      highlighted: false,
      features: [
        tierNames ? `Planes ${tierNames}` : "Planes Básica, Profesional y Premium",
        creditPrice
          ? `Recarga de 10 consultas extra ($${Number(creditPrice).toLocaleString("es-MX")})`
          : "Recarga de 10 consultas extra",
        premium?.features?.includes("Manejo Experto (consulta acelerada)")
          ? "Premium: Manejo Experto e interpretación de análisis"
          : "Premium: IA avanzada y estudios clínicos",
        "Facturación mensual o anual",
        "Verificación MVZ incluida",
      ],
      cta: "Ver membresía",
      action: "membership",
    },
  ];
}
