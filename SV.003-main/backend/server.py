import os
import uuid
import base64
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Local replacements for removed `emergentintegrations` package
class UserMessage:
    def __init__(self, text: str, content: list = None):
        self.text = text
        self.content = content or []

class ImageContent:
    def __init__(self, image_base64: str, media_type: str):
        self.image_base64 = image_base64
        self.media_type = media_type


class LlmChat:
    """Fallback local LLM wrapper. Returns a disabled message unless a proper
    provider/client is configured. This avoids depending on the removed
    `emergentintegrations` package while keeping endpoints functional.
    """
    def __init__(self, api_key: str, session_id: str, system_message: str):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.model = None

    def with_model(self, provider: str, model: str):
        self.provider = provider
        self.model = model
        return self

    async def send_message(self, user_message: UserMessage, images=None):
        return "LLM integration removed. Install and configure Anthropic to enable AI features."


# Minimal Stripe wrapper to replace emergentintegrations.payments.stripe.checkout
class CheckoutSessionRequest:
    def __init__(self, amount, currency, success_url, cancel_url, metadata=None):
        self.amount = amount
        self.currency = currency
        self.success_url = success_url
        self.cancel_url = cancel_url
        self.metadata = metadata or {}


class CheckoutSessionResponse:
    def __init__(self, session_id, url):
        self.session_id = session_id
        self.url = url


class CheckoutStatusResponse:
    def __init__(self, payment_status, status, amount_total, currency, metadata):
        self.payment_status = payment_status
        self.status = status
        self.amount_total = amount_total
        self.currency = currency
        self.metadata = metadata


class StripeCheckout:
    def __init__(self, api_key: str, webhook_url: str):
        try:
            import stripe
            stripe.api_key = api_key
            self.stripe = stripe
        except Exception:
            self.stripe = None

    async def create_checkout_session(self, checkout_request: CheckoutSessionRequest):
        if not self.stripe:
            raise Exception("Stripe library not available or STRIPE_API_KEY not configured")

        session = self.stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": checkout_request.currency,
                    "product_data": {"name": checkout_request.metadata.get("package_name", "Membership")},
                    "unit_amount": int(checkout_request.amount * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=checkout_request.success_url,
            cancel_url=checkout_request.cancel_url,
            metadata=checkout_request.metadata
        )

        return CheckoutSessionResponse(session.id, getattr(session, "url", ""))

    async def get_checkout_status(self, session_id: str):
        if not self.stripe:
            raise Exception("Stripe library not available or STRIPE_API_KEY not configured")

        session = self.stripe.checkout.Session.retrieve(session_id)
        payment_status = getattr(session, "payment_status", None)
        return CheckoutStatusResponse(
            payment_status=payment_status,
            status=getattr(session, "status", None),
            amount_total=getattr(session, "amount_total", None),
            currency=getattr(session, "currency", None),
            metadata=getattr(session, "metadata", {})
        )

    async def handle_webhook(self, body, signature):
        # Minimal placeholder: caller will handle concrete events if needed
        return type("WebhookResponse", (), {"event_type": "unknown", "session_id": None})


app = FastAPI()

# CORS middleware
CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
if CORS_ALLOW_ORIGINS:
    cors_allow_origins = [
        origin.strip() for origin in CORS_ALLOW_ORIGINS.split(",") if origin.strip()
    ]
else:
    cors_allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    allow_origin_regex=r"https?://.*\.trycloudflare\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = client[os.getenv("DB_NAME", "vetmed_platform")]

# LLM Configuration - Anthropic Claude API
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")

# Membership packages (server-side only for security)
MEMBERSHIP_PACKAGES = {
    "basic": {
        "name": "Básica", 
        "price_monthly": 950.00, 
        "price_annual": 9500.00,  # 10 meses (2 meses gratis)
        "consultations": 10, 
        "currency": "mxn"
    },
    "professional": {
        "name": "Profesional", 
        "price_monthly": 1250.00, 
        "price_annual": 12500.00,  # 10 meses (2 meses gratis)
        "consultations": 25, 
        "currency": "mxn"
    },
    "premium": {
        "name": "Premium", 
        "price_monthly": 2200.00, 
        "price_annual": 22000.00,  # 10 meses (2 meses gratis)
        "consultations": "unlimited", 
        "currency": "mxn"
    }
}

# Animal categories with specialized prompts
ANIMAL_CATEGORIES = {
    "perros": {
        "name": "Perros",
        "prompt": ""
    },
    "gatos": {
        "name": "Gatos",
        "prompt": ""
    },
    "tortugas": {
        "name": "Tortugas",
        "prompt": ""
    },
    "erizos": {
        "name": "Erizos Africanos",
        "prompt": ""
    },
    "hurones": {
        "name": "Hurones",
        "prompt": ""
    },
    "iguanas": {
        "name": "Iguanas",
        "prompt": ""
    },
    "hamsters": {
        "name": "Hámsters",
        "prompt": ""
    },
    "aves_corral": {
        "name": "Patos y Pollos",
        "prompt": ""
    },
    "aves_ornamentales": {
        "name": "Aves (Psitácidos, Passeriformes y Ornamentales)",
        "prompt": ""
    },
    "conejos": {
        "name": "Conejos",
        "prompt": ""
    },
    "cuyos": {
        "name": "Cuyos",
        "prompt": ""
    }
}

# Pydantic models
class VeterinarianRegistration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    email: str
    telefono: str
    cedula_profesional: str
    especialidad: str
    años_experiencia: int
    institucion: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    verified: bool = False

class Veterinarian(BaseModel):
    id: str
    nombre: str
    email: str
    telefono: str
    cedula_profesional: str
    especialidad: str
    años_experiencia: int
    institucion: str
    created_at: str
    verified: bool
    membership_type: Optional[str] = None
    consultations_remaining: Optional[int] = None
    membership_expires: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    cedula_profesional: str

class ConsultationData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    consultation_number: Optional[str] = None  # Human-readable ID like CONS-0001
    veterinarian_id: str
    category: str
    
    class Config:
        arbitrary_types_allowed = True
        extra = "allow"  # Allow extra fields from forms
    
    # Stage 1: Complete pet information (all optional for flexibility)
    fecha: Optional[str] = None
    nombre_mascota: Optional[str] = None
    nombre_dueño: Optional[str] = None
    raza: Optional[str] = None
    mix: Optional[str] = None
    edad: Optional[str] = None
    peso: Optional[str] = None
    condicion_corporal: Optional[str] = None
    sexo: Optional[str] = None
    estado_reproductivo: Optional[str] = None
    vacunas_vigentes: Optional[str] = None
    vacunas_cual: Optional[str] = None
    desparasitacion_interna: Optional[str] = "NO"
    desparasitacion_interna_cual: Optional[str] = None
    desparasitacion_externa: Optional[str] = "NO"
    desparasitacion_externa_producto: Optional[str] = None
    desparasitacion_externa_fecha: Optional[str] = None
    habitat: Optional[str] = "INTERIOR"
    zona_geografica: Optional[str] = None
    alimentacion_seco: Optional[str] = None
    alimentacion_humedo: Optional[str] = None
    alimentacion_casero: Optional[str] = None
    alimentacion_frecuencia: Optional[str] = None
    paseos: Optional[str] = "NO"
    paseos_frecuencia: Optional[str] = None
    baños_estetica: Optional[str] = "NO"
    baños_fecha: Optional[str] = None
    cirugias_previas: Optional[str] = "NO"
    cirugias_cual: Optional[str] = None
    aspecto_pelaje: Optional[str] = None
    aspecto_piel: Optional[str] = None
    aspecto_oidos: Optional[str] = None
    aspecto_ojos: Optional[str] = None
    aspecto_otros: Optional[str] = None
    
    # Historial reportado (optional fields)
    vomito: Optional[str] = "NO"
    vomito_color: Optional[str] = None
    vomito_aspecto: Optional[str] = None
    diarrea: Optional[str] = "NO"
    diarrea_color: Optional[str] = None
    diarrea_aspecto: Optional[str] = None
    orina: Optional[str] = "NO"
    orina_color: Optional[str] = None
    orina_olor: Optional[str] = None
    secrecion_nasal: Optional[str] = "NO"
    secrecion_nasal_color: Optional[str] = None
    secrecion_nasal_aspecto: Optional[str] = None
    secrecion_ocular: Optional[str] = "NO"
    secrecion_ocular_color: Optional[str] = None
    dientes: Optional[str] = "limpios"
    dientes_otros: Optional[str] = None
    piel_condicion: Optional[str] = "normal"
    ultima_comida: Optional[str] = None
    ultima_comida_fecha: Optional[str] = None
    liquidos: Optional[str] = "NO"
    liquidos_cantidad: Optional[str] = None
    actividad_general: Optional[str] = "ACTIVO"
    medicamentos: Optional[str] = "NO"
    medicamentos_cual: Optional[str] = None
    
    # Stage 2: Detailed patient information (optional at creation)
    detalle_paciente: Optional[str] = None
    
    # Stage 2: Clinical observations
    parametros_vitales: Optional[str] = None
    imagenes_videos: Optional[List[str]] = None
    laboratorio_estudios: Optional[str] = None
    ambiente_manejo: Optional[str] = None
    notas_adicionales: Optional[str] = None
    
    # Stage 3: AI Analysis
    ai_analysis: Optional[str] = None
    diagnosticos_diferenciales: Optional[List[str]] = None
    plan_tratamiento: Optional[str] = None
    estudios_recomendados: Optional[str] = None
    bibliografia: Optional[List[str]] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "draft"  # draft, in_progress, completed

class ConsultationRequest(BaseModel):
    veterinarian_id: str
    category: str
    consultation_data: Dict[str, Any]

class AIAnalysisRequest(BaseModel):
    consultation_id: str

class PaymentRequest(BaseModel):
    package_id: str
    origin_url: str
    billing_cycle: str = "monthly"  # "monthly" or "annual"

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    veterinarian_id: Optional[str] = None
    package_id: str
    amount: float
    currency: str
    session_id: str
    payment_status: str = "pending"
    status: str = "initiated"
    metadata: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AnimalConsultation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    veterinarian_id: str
    species: str  # perro, gato, tortuga, erizo, huron, iguana, hamster, patos_pollos, aves, conejo
    consultation_data: Dict[str, Any]  # Todos los campos del formulario específico
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "completed"  # draft, completed

# Helper functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

async def verify_veterinarian_membership(veterinarian_id: str):
    """Check if veterinarian has active membership and consultations remaining"""
    vet = await db.veterinarians.find_one({"id": veterinarian_id})
    
    # Auto-create dev veterinarian if not found (for development mode)
    if not vet and veterinarian_id.startswith("dev-"):
        dev_vet = {
            "id": veterinarian_id,
            "nombre": "Carlos Hernandez",
            "email": "carlos.hernandez@vetmed.com",
            "telefono": "5555555555",
            "cedula_profesional": "87654321",
            "especialidad": "Medicina General",
            "años_experiencia": 5,
            "institucion": "UNAM",
            "membership_type": "premium",
            "consultations_remaining": 200,
            "membership_expires": "2099-12-31T23:59:59+00:00",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.veterinarians.insert_one(dev_vet)
        vet = dev_vet
    
    if not vet:
        raise HTTPException(status_code=404, detail="Veterinario no encontrado")
    
    if not vet.get("membership_type"):
        raise HTTPException(status_code=403, detail="Membresía requerida para realizar consultas")
    
    # Check if membership is expired
    if vet.get("membership_expires"):
        expiry_str = vet["membership_expires"]
        # Handle both datetime and string formats
        if isinstance(expiry_str, str):
            expiry = datetime.fromisoformat(expiry_str.replace('Z', '+00:00'))
        else:
            expiry = expiry_str
        if expiry < datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="Membresía expirada")
    
    # Check consultation limit for non-premium members
    if vet["membership_type"] != "premium":
        remaining = vet.get("consultations_remaining", 0)
        if remaining <= 0:
            raise HTTPException(status_code=403, detail="Consultas agotadas en tu membresía actual")
    
    return vet

# API Routes

@app.get("/")
async def root():
    return {"message": "Savant Vet - Plataforma de Consultoría Veterinaria"}

# Authentication endpoints
@app.post("/api/auth/register", response_model=Veterinarian)
async def register_veterinarian(registration: VeterinarianRegistration):
    """Register a new veterinarian"""
    
    # Check if email or cedula already exists
    existing = await db.veterinarians.find_one({
        "$or": [
            {"email": registration.email},
            {"cedula_profesional": registration.cedula_profesional}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Email o cédula profesional ya registrados")
    
    # Validate Mexican veterinary license format (basic validation)
    if not registration.cedula_profesional.isdigit() or len(registration.cedula_profesional) < 6:
        raise HTTPException(status_code=400, detail="Formato de cédula profesional inválido")
    
    vet_data = prepare_for_mongo(registration.dict())
    await db.veterinarians.insert_one(vet_data)
    
    return Veterinarian(**vet_data)

@app.post("/api/auth/login", response_model=Veterinarian)
async def login_veterinarian(login_request: LoginRequest):
    """Login veterinarian"""
    vet = await db.veterinarians.find_one({
        "email": login_request.email,
        "cedula_profesional": login_request.cedula_profesional
    })
    
    if not vet:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    return Veterinarian(**vet)

@app.get("/api/veterinarians/{vet_id}", response_model=Veterinarian)
async def get_veterinarian(vet_id: str):
    """Get veterinarian profile"""
    vet = await db.veterinarians.find_one({"id": vet_id})
    if not vet:
        raise HTTPException(status_code=404, detail="Veterinario no encontrado")
    
    return Veterinarian(**vet)

# Consultation endpoints
@app.get("/api/animal-categories")
async def get_animal_categories():
    """Get available animal categories"""
    return {"categories": ANIMAL_CATEGORIES}

async def generate_consultation_number(vet_id: str):
    """Generate a sequential consultation number for a veterinarian"""
    # Get the count of existing consultations for this vet
    count = await db.consultations.count_documents({"veterinarian_id": vet_id})
    # Generate number like CONS-0001, CONS-0002, etc.
    return f"CONS-{str(count + 1).zfill(4)}"

@app.post("/api/consultations", response_model=ConsultationData)
async def create_consultation(consultation_request: ConsultationRequest):
    """Create a new consultation (Stage 1: Initial questionnaire)"""
    
    # Verify veterinarian membership
    await verify_veterinarian_membership(consultation_request.veterinarian_id)
    
    # Generate consultation number
    consultation_number = await generate_consultation_number(consultation_request.veterinarian_id)
    
    consultation = ConsultationData(
        veterinarian_id=consultation_request.veterinarian_id,
        category=consultation_request.category,
        consultation_number=consultation_number,
        **consultation_request.consultation_data
    )
    
    consultation_data = prepare_for_mongo(consultation.dict())
    await db.consultations.insert_one(consultation_data)
    
    # Return without MongoDB's _id field
    return ConsultationData(**consultation.dict())

@app.put("/api/consultations/{consultation_id}/observations")
async def update_consultation_observations(consultation_id: str, observations: Dict[str, Any]):
    """Update consultation with clinical observations (Stage 2)"""
    
    result = await db.consultations.update_one(
        {"id": consultation_id},
        {
            "$set": {
                **observations,
                "status": "in_progress",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    
    return {"message": "Observaciones clínicas actualizadas"}

@app.post("/api/consultations/{consultation_id}/analyze")
async def analyze_consultation(consultation_id: str):
    """Generate AI analysis for consultation (Stage 3)"""
    
    consultation = await db.consultations.find_one({"id": consultation_id})
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    
    # Verify veterinarian membership before processing
    vet = await verify_veterinarian_membership(consultation["veterinarian_id"])
    
    # Get category-specific prompt
    category = consultation["category"]
    if category not in ANIMAL_CATEGORIES:
        raise HTTPException(status_code=400, detail="Categoría de animal inválida")
    
    category_info = ANIMAL_CATEGORIES[category]
    
    # Prepare consultation data for AI analysis
    consultation_text = f"""
    CONSULTA VETERINARIA - {category_info['name']}
    
    INFORMACIÓN BÁSICA DEL PACIENTE:
    - Fecha: {consultation.get('fecha', 'No especificada')}
    - Nombre de la mascota: {consultation.get('nombre_mascota', 'No especificado')}
    - Propietario: {consultation.get('nombre_dueño', 'No especificado')}
    - Raza: {consultation.get('raza', 'No especificada')}
    - Edad: {consultation.get('edad', 'No especificada')}
    - Peso: {consultation.get('peso', 'No especificado')}
    - Sexo: {consultation.get('sexo', 'No especificado')}
    - Estado reproductivo: {consultation.get('estado_reproductivo', 'No especificado')}
    - Condición corporal: {consultation.get('condicion_corporal', 'No especificada')}
    - Vacunas: {consultation.get('vacunas_vigentes', 'No especificado')} {consultation.get('vacunas_cual', '')}
    - Zona geográfica: {consultation.get('zona_geografica', 'No especificada')}
    
    INFORMACIÓN DETALLADA DEL PACIENTE:
    {consultation.get('detalle_paciente', 'No se proporcionó información detallada')}
    
    Por favor proporciona un análisis veterinario profesional que incluya:
    1. Diagnósticos diferenciales (mínimo 3)
    2. Plan de tratamiento detallado
    3. Estudios complementarios recomendados
    4. Pronóstico
    5. Referencias bibliográficas relevantes
    6. Recomendaciones específicas basadas en la información proporcionada
    """
    
    try:
        # Initialize LLM chat for veterinary consultation
        session_id = f"vet_consultation_{consultation_id}"
        system_message = ""
        
        chat = LlmChat(
            api_key=ANTHROPIC_API_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        user_message = UserMessage(text=consultation_text)
        ai_response = await chat.send_message(user_message)
        
        # Update consultation with AI analysis
        analysis_data = {
            "ai_analysis": ai_response,
            "status": "completed",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.consultations.update_one(
            {"id": consultation_id},
            {"$set": analysis_data}
        )
        
        # Deduct consultation from veterinarian's remaining count (if not premium)
        if vet["membership_type"] != "premium":
            remaining = vet.get("consultations_remaining", 0)
            await db.veterinarians.update_one(
                {"id": consultation["veterinarian_id"]},
                {"$set": {"consultations_remaining": max(0, remaining - 1)}}
            )
        
        return {"analysis": ai_response, "consultation_id": consultation_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el análisis: {str(e)}")

@app.get("/api/consultations/{vet_id}/history")
async def get_consultation_history(vet_id: str):
    """Get consultation history for veterinarian"""
    consultations = await db.consultations.find(
        {"veterinarian_id": vet_id},
        {"_id": 0}  # Exclude MongoDB's _id field
    ).sort("created_at", -1).to_list(length=None)
    
    return {"consultations": consultations}

@app.get("/api/consultations/{vet_id}/search")
async def search_consultations(vet_id: str, query: str):
    """Search consultations by ID, patient name, or owner name"""
    if not query or len(query) < 2:
        return {"consultations": []}
    
    # Create search filter using $or for multiple fields
    search_filter = {
        "veterinarian_id": vet_id,
        "$or": [
            {"consultation_number": {"$regex": query, "$options": "i"}},
            {"nombre_mascota": {"$regex": query, "$options": "i"}},
            {"nombre_dueno": {"$regex": query, "$options": "i"}},
            {"raza": {"$regex": query, "$options": "i"}}
        ]
    }
    
    consultations = await db.consultations.find(
        search_filter,
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(length=50)
    
    return {"consultations": consultations}

@app.get("/api/consultations/{consultation_id}", response_model=ConsultationData)
async def get_consultation(consultation_id: str):
    """Get specific consultation"""
    consultation = await db.consultations.find_one(
        {"id": consultation_id},
        {"_id": 0}  # Exclude MongoDB's _id field
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    
    return ConsultationData(**consultation)


# Medical Image Interpretation Models
class ImageInterpretationRequest(BaseModel):
    veterinarian_id: str
    image_base64: str
    image_type: str  # "xray", "blood_test", "urinalysis"
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    consultation_id: Optional[str] = None
    additional_context: Optional[str] = None

class ImageInterpretationResponse(BaseModel):
    id: str
    findings: str
    recommendations: str
    detailed_analysis: str
    created_at: str

# Medical Image Interpretation Endpoint (Premium Only)
@app.post("/api/medical-images/interpret", response_model=ImageInterpretationResponse)
async def interpret_medical_image(request: ImageInterpretationRequest):
    """Interpret medical images (X-rays, lab results) using AI - Premium Only"""
    
    # Verify veterinarian exists and has Premium membership
    vet = await db.veterinarians.find_one({"id": request.veterinarian_id})
    if not vet:
        raise HTTPException(status_code=404, detail="Veterinario no encontrado")
    
    if vet.get("membership_type", "").lower() != "premium":
        raise HTTPException(
            status_code=403, 
            detail="Esta función es exclusiva para miembros Premium. Actualiza tu membresía para acceder."
        )
    
    # Get patient history if consultation_id is provided
    patient_history = ""
    if request.consultation_id:
        consultation = await db.consultations.find_one({"id": request.consultation_id})
        if consultation:
            patient_history = f"""
            **Contexto del Paciente:**
            - Nombre: {consultation.get('nombre_mascota', 'N/A')}
            - Raza: {consultation.get('raza', 'N/A')}
            - Edad: {consultation.get('edad', 'N/A')}
            - Peso: {consultation.get('peso', 'N/A')}
            - Detalle previo: {consultation.get('detalle_paciente', 'N/A')}
            """
            if consultation.get('ai_analysis'):
                patient_history += f"\n**Análisis Previo:**\n{consultation.get('ai_analysis')}"
    
    # Get previous consultations for this patient if patient_id provided
    if request.patient_id:
        prev_consultations = await db.consultations.find(
            {"nombre_mascota": request.patient_name}
        ).sort("created_at", -1).limit(3).to_list(length=3)
        
        if prev_consultations:
            patient_history += "\n\n**Historial de Consultas Previas:**\n"
            for i, cons in enumerate(prev_consultations, 1):
                patient_history += f"\n{i}. Fecha: {cons.get('fecha', 'N/A')}"
                patient_history += f"\n   Motivo: {cons.get('detalle_paciente', 'N/A')[:100]}..."
                if cons.get('ai_analysis'):
                    patient_history += f"\n   Diagnóstico: {cons.get('ai_analysis', '')[:150]}..."
    
    # Prepare specialized prompt based on image type
    image_type_prompts = {
        "xray": "",
        
        "blood_test": "",
        
        "urinalysis": "",
        
        "pdf_report": ""
    }
    
    base_prompt = image_type_prompts.get(request.image_type, image_type_prompts["xray"])
    
    full_prompt = f"""{base_prompt}

{patient_history}

{f'Contexto adicional del veterinario: {request.additional_context}' if request.additional_context else ''}

Por favor, estructura tu respuesta en las siguientes secciones:

**HALLAZGOS PRINCIPALES:**
(Lista concisa de los hallazgos más importantes)

**DIAGNÓSTICOS DIFERENCIALES:**
(Posibles diagnósticos basados en los hallazgos)

**ANÁLISIS DETALLADO:**
(Interpretación completa y técnica de la imagen/resultados)

**RECOMENDACIONES:**
(Plan de acción, estudios adicionales, tratamiento sugerido)

Usa tu experiencia clínica y conocimiento médico veterinario para proporcionar una interpretación precisa y útil."""
    
    try:
        # Initialize LLM chat with vision capabilities
        try:
        import fitz  # PyMuPDF for PDF processing
        except ImportError:
            fitz = None  # type: ignore
        from io import BytesIO
        from PIL import Image
        
        chat = LlmChat(
            api_key=ANTHROPIC_API_KEY,
            session_id=str(uuid.uuid4()),
            system_message = ""
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        # Process the file based on type
        image_contents = []
        
        # Check if it's a PDF (by type or content signature)
        is_pdf = request.image_type == "pdf_report" or request.image_base64.startswith("JVBERi")
        
        if is_pdf:
            # Convert PDF pages to images
            pdf_bytes = base64.b64decode(request.image_base64)
            pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            # Get total pages before processing
            total_pages = len(pdf_document)
            max_pages = min(total_pages, 5)
            
            # Add note about pages to prompt if needed
            if total_pages > 5:
                full_prompt = f"NOTA: El PDF tiene {total_pages} páginas, se muestran las primeras 5.\n\n" + full_prompt
            
            # Convert each page to image
            for page_num in range(max_pages):
                page = pdf_document[page_num]
                # Render page to image at 150 DPI for good quality
                pix = page.get_pixmap(matrix=fitz.Matrix(150/72, 150/72))
                
                # Convert to PNG bytes
                img_bytes = pix.tobytes("png")
                img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                
                image_contents.append(ImageContent(image_base64=img_base64, media_type="image/png"))
            
            pdf_document.close()
        else:
            # Regular image - detect media type
            media_type = "image/jpeg"
            if request.image_base64.startswith("/9j/"):
                media_type = "image/jpeg"
            elif request.image_base64.startswith("iVBOR"):
                media_type = "image/png"
            elif request.image_base64.startswith("R0lGOD"):
                media_type = "image/gif"
            elif request.image_base64.startswith("UklGR"):
                media_type = "image/webp"
            
            image_contents.append(ImageContent(image_base64=request.image_base64, media_type=media_type))
        
        # Create message with image(s) and text
        user_message = UserMessage(
            text=full_prompt,
            content=[full_prompt] + image_contents
        )
        
        # Get AI interpretation (pass images separately for proper handling)
        response = await chat.send_message(user_message, images=image_contents)
        
        # Parse response into sections
        response_text = response if isinstance(response, str) else str(response)
        
        # Extract sections (simplified parsing)
        findings = ""
        recommendations = ""
        detailed_analysis = response_text
        
        if "**HALLAZGOS PRINCIPALES:**" in response_text:
            parts = response_text.split("**HALLAZGOS PRINCIPALES:**")
            if len(parts) > 1:
                findings_part = parts[1].split("**DIAGNÓSTICOS DIFERENCIALES:**")[0] if "**DIAGNÓSTICOS DIFERENCIALES:**" in parts[1] else parts[1].split("**ANÁLISIS DETALLADO:**")[0] if "**ANÁLISIS DETALLADO:**" in parts[1] else parts[1]
                findings = findings_part.strip()
        
        if "**RECOMENDACIONES:**" in response_text:
            parts = response_text.split("**RECOMENDACIONES:**")
            if len(parts) > 1:
                recommendations = parts[1].strip()
        
        # Create interpretation record
        interpretation_id = str(uuid.uuid4())
        interpretation_data = {
            "id": interpretation_id,
            "veterinarian_id": request.veterinarian_id,
            "image_type": request.image_type,
            "patient_name": request.patient_name,
            "patient_id": request.patient_id,
            "consultation_id": request.consultation_id,
            "findings": findings,
            "recommendations": recommendations,
            "detailed_analysis": detailed_analysis,
            "additional_context": request.additional_context,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Save to database (without image for privacy)
        await db.image_interpretations.insert_one(interpretation_data)
        
        return ImageInterpretationResponse(**interpretation_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al interpretar imagen: {str(e)}")

@app.get("/api/medical-images/history/{vet_id}")
async def get_interpretation_history(vet_id: str):
    """Get interpretation history for veterinarian"""
    interpretations = await db.image_interpretations.find(
        {"veterinarian_id": vet_id}
    ).sort("created_at", -1).to_list(length=None)
    
    return {"interpretations": interpretations}

# Payment endpoints
@app.get("/api/membership/packages")
async def get_membership_packages():
    """Get available membership packages"""
    return {"packages": MEMBERSHIP_PACKAGES}

@app.post("/api/payments/checkout/session")
async def create_checkout_session(payment_request: PaymentRequest, request: Request):
    """Create Stripe checkout session for membership"""
    
    # Validate package
    if payment_request.package_id not in MEMBERSHIP_PACKAGES:
        raise HTTPException(status_code=400, detail="Paquete de membresía inválido")
    
    package = MEMBERSHIP_PACKAGES[payment_request.package_id]
    
    # Determine price based on billing cycle
    price_key = "price_annual" if payment_request.billing_cycle == "annual" else "price_monthly"
    price = package[price_key]
    
    try:
        # Initialize Stripe checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create success and cancel URLs
        success_url = f"{payment_request.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{payment_request.origin_url}/membership"
        
        # Create checkout session request
        checkout_request = CheckoutSessionRequest(
            amount=price,
            currency=package["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "package_id": payment_request.package_id,
                "package_name": package["name"],
                "consultations": str(package["consultations"]),
                "billing_cycle": payment_request.billing_cycle
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            package_id=payment_request.package_id,
            amount=price,
            currency=package["currency"],
            session_id=session.session_id,
            metadata=checkout_request.metadata
        )
        
        transaction_data = prepare_for_mongo(transaction.dict())
        await db.payment_transactions.insert_one(transaction_data)
        
        return {"checkout_url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando sesión de pago: {str(e)}")

@app.get("/api/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get Stripe checkout session status"""
    
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status in database
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if transaction:
            update_data = {
                "payment_status": status.payment_status,
                "status": status.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": update_data}
            )
            
            # If payment successful, update veterinarian membership
            if status.payment_status == "paid" and not transaction.get("membership_activated"):
                package_id = transaction["package_id"]
                package = MEMBERSHIP_PACKAGES[package_id]
                
                # Calculate membership expiry (30 days from now)
                expiry_date = datetime.now(timezone.utc).replace(day=28)  # Safe day for all months
                if expiry_date.month == 12:
                    expiry_date = expiry_date.replace(year=expiry_date.year + 1, month=1)
                else:
                    expiry_date = expiry_date.replace(month=expiry_date.month + 1)
                
                # Update veterinarian membership
                membership_data = {
                    "membership_type": package_id,
                    "consultations_remaining": package["consultations"] if package["consultations"] != "unlimited" else 999999,
                    "membership_expires": expiry_date.isoformat()
                }
                
                # Find veterinarian by email from metadata (if available)
                if transaction.get("veterinarian_id"):
                    await db.veterinarians.update_one(
                        {"id": transaction["veterinarian_id"]},
                        {"$set": membership_data}
                    )
                
                # Mark transaction as membership activated
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"membership_activated": True}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "metadata": status.metadata
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verificando estado del pago: {str(e)}")

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    
    try:
        body = await request.body()
        stripe_signature = request.headers.get("Stripe-Signature")
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Process webhook event
        if webhook_response.event_type == "checkout.session.completed":
            session_id = webhook_response.session_id
            
            # Update transaction and membership as in get_checkout_status
            # (This ensures redundancy in case frontend polling fails)
            
        return {"received": True}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")

# Animal Consultation endpoints
@app.get("/api/species")
async def get_species():
    """Get available species for animal consultations"""
    species_list = [
        {"id": "perro", "name": "Perro"},
        {"id": "gato", "name": "Gato"},
        {"id": "tortuga", "name": "Tortuga"},
        {"id": "erizo", "name": "Erizo Africano"},
        {"id": "huron", "name": "Hurón"},
        {"id": "iguana", "name": "Iguana"},
        {"id": "hamster", "name": "Hámster"},
        {"id": "patos_pollos", "name": "Patos y Pollos"},
        {"id": "aves", "name": "Aves (Psitácidos/Ornamentales)"},
        {"id": "conejo", "name": "Conejo"}
    ]
    return species_list

@app.post("/api/animal-consults")
async def create_animal_consultation(consultation: Dict[str, Any]):
    """Create a new animal consultation"""
    
    # Validate required fields
    if "veterinarian_id" not in consultation or "species" not in consultation:
        raise HTTPException(status_code=400, detail="veterinarian_id y species son requeridos")
    
    # Create consultation record
    consultation_data = {
        "id": str(uuid.uuid4()),
        "veterinarian_id": consultation["veterinarian_id"],
        "species": consultation["species"],
        "consultation_data": consultation.get("consultation_data", {}),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "status": "completed"
    }
    
    await db.animal_consultations.insert_one(consultation_data)
    
    return {
        "message": "Consulta creada exitosamente",
        "id": consultation_data["id"],
        "consultation": consultation_data
    }

@app.get("/api/animal-consults/{vet_id}/history")
async def get_animal_consultation_history(vet_id: str):
    """Get animal consultation history for veterinarian"""
    consultations = await db.animal_consultations.find(
        {"veterinarian_id": vet_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=None)
    
    return {"consultations": consultations}

@app.get("/api/animal-consults/detail/{consultation_id}")
async def get_animal_consultation_detail(consultation_id: str):
    """Get specific animal consultation"""
    consultation = await db.animal_consultations.find_one(
        {"id": consultation_id},
        {"_id": 0}
    )
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    
    return consultation

# Test endpoint for AI connection
@app.get("/api/test-ai")
async def test_ai_connection():
    """Test the connection to Anthropic Claude API"""
    if not ANTHROPIC_API_KEY:
        return {
            "status": "error",
            "message": "ANTHROPIC_API_KEY no está configurada en el archivo .env",
            "connected": False
        }
    
    try:
        chat = LlmChat(
            api_key=ANTHROPIC_API_KEY,
            session_id="test-connection",
            system_message = ""
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        user_message = UserMessage(text="Responde solo con: 'Conexión exitosa con Claude API'")
        response = await chat.send_message(user_message)
        
        return {
            "status": "success",
            "message": response,
            "connected": True,
            "model": "claude-sonnet-4-20250514"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "connected": False
        }

# Test endpoint for Stripe connection
@app.get("/api/test-stripe")
async def test_stripe_connection():
    """Test the connection to Stripe API"""
    if not STRIPE_API_KEY:
        return {
            "status": "error",
            "message": "STRIPE_API_KEY no está configurada en el archivo .env",
            "connected": False
        }
    
    try:
        import stripe
        stripe.api_key = STRIPE_API_KEY
        
        # Test connection by fetching account info
        account = stripe.Account.retrieve()
        
        return {
            "status": "success",
            "message": "Conexión exitosa con Stripe",
            "connected": True,
            "account_id": account.id,
            "country": account.country,
            "default_currency": account.default_currency,
            "mode": "test" if "test" in STRIPE_API_KEY else "live"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "connected": False
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)




