"""
Catálogo comercial de membresías GUIAA.
Editar precios, consultas y listas `features` aquí — el frontend las consume vía API.
"""

FEATURED_PLAN_KEY = "professional"

SHARED_CORE_FEATURES = [
    "GUIAA Diagnóstico con soporte CDS L4 · L5",
    "Expediente e historial clínico",
    "Clientes, pacientes y agenda",
    "Panel clínico con métricas de consulta",
    "Exportación PDF de consultas",
]

MEMBERSHIP_PACKAGES = {
    "basic": {
        "name": "Básica",
        "price_monthly": 950.00,
        "price_annual": 9500.00,
        "consultations": 30,
        "consultations_annual": 300,
        "currency": "mxn",
        "species_scope": "perros y gatos",
        "features": [
            "30 consultas CDS al mes",
            "Especies: perros y gatos",
            *SHARED_CORE_FEATURES,
        ],
        "features_annual": [
            "300 consultas CDS al año",
            "Especies: perros y gatos",
            *SHARED_CORE_FEATURES,
        ],
    },
    "professional": {
        "name": "Profesional",
        "price_monthly": 1250.00,
        "price_annual": 12500.00,
        "consultations": 35,
        "consultations_annual": 350,
        "currency": "mxn",
        "species_scope": "11+ categorías multiespecie",
        "featured": True,
        "features": [
            "35 consultas CDS al mes",
            "Todas las especies (11+ categorías)",
            *SHARED_CORE_FEATURES,
            "Inventario con alertas de stock",
            "Ventas, recibos y facturación",
            "Reportes de actividad clínica",
            "Soporte prioritario por correo",
        ],
        "features_annual": [
            "350 consultas CDS al año",
            "Todas las especies (11+ categorías)",
            *SHARED_CORE_FEATURES,
            "Inventario con alertas de stock",
            "Ventas, recibos y facturación",
            "Reportes de actividad clínica",
            "Soporte prioritario por correo",
        ],
    },
    "premium": {
        "name": "Premium",
        "price_monthly": 2200.00,
        "price_annual": 22000.00,
        "consultations": 150,
        "consultations_annual": 1500,
        "currency": "mxn",
        "species_scope": "todas las especies",
        "features": [
            "150 consultas CDS al mes",
            "Todas las especies (11+ categorías)",
            *SHARED_CORE_FEATURES,
            "Inventario, ventas y reportes",
            "Manejo Experto (consulta acelerada)",
            "Interpretación de laboratorio (PDF)",
            "Onboarding guiado prioritario",
        ],
        "features_annual": [
            "1500 consultas CDS al año",
            "Todas las especies (11+ categorías)",
            *SHARED_CORE_FEATURES,
            "Inventario, ventas y reportes",
            "Manejo Experto (consulta acelerada)",
            "Interpretación de laboratorio (PDF)",
            "Onboarding guiado prioritario",
        ],
    },
}

CONSULTATION_CREDIT_PACKAGES = {
    "credits_10": {
        "name": "10 consultas extra",
        "price": 350.00,
        "credits": 10,
        "currency": "mxn",
        "description": "Recarga de consultas CDS sin cambiar de plan. Se suman a tu saldo actual.",
    },
}

def get_membership_consultations(package: dict, billing_cycle: str) -> int:
    """Consultas incluidas según ciclo de facturación (mensual o anual)."""
    cycle = (billing_cycle or "monthly").strip().lower()
    if cycle == "annual":
        return int(package.get("consultations_annual", package["consultations"]))
    return int(package["consultations"])


MEMBERSHIP_INFO_ITEMS = [
    {
        "id": "cds",
        "title": "CDS estructurado",
        "description": "Anamnesis, hallazgos y razonamiento clínico L4 · L5 en un solo flujo.",
    },
    {
        "id": "clinic",
        "title": "Consultorio integrado",
        "description": "Expediente, agenda, inventario y ventas conectados entre consultas.",
    },
    {
        "id": "species",
        "title": "Multiespecie real",
        "description": "Desde perros y gatos hasta exóticos, según tu plan activo.",
    },
    {
        "id": "evidence",
        "title": "Basado en evidencia",
        "description": "Referencias bibliográficas y planes terapéuticos documentados.",
    },
]
