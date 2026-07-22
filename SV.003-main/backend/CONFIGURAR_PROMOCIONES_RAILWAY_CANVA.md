# Configurar promociones GUIAA (Railway + Canva + WhatsApp)

Guía paso a paso para activar campañas email/WhatsApp con imagen de oferta.

## 0. Migraciones Supabase (obligatorio)

En el SQL Editor de Supabase, ejecuta en orden:

1. `SV.003-main/backend/supabase_migrations/20260708_promotion_campaigns.sql`
2. `SV.003-main/backend/supabase_migrations/20260708b_trial_promo_automation.sql`

O con script local (si tienes `SUPABASE_DATABASE_URL` / `SUPABASE_DB_PASSWORD`):

```bash
cd SV.003-main/backend
python3 scripts/apply_supabase_migration.py --sql supabase_migrations/20260708_promotion_campaigns.sql
python3 scripts/apply_supabase_migration.py --sql supabase_migrations/20260708b_trial_promo_automation.sql
```

## 1. Railway — variables de entorno

1. Abre [Railway Dashboard](https://railway.app) → proyecto GUIAA → servicio **backend** (API).
2. Pestaña **Variables** → **Raw Editor** o añade una a una.
3. Copia el bloque de `backend/promotions.railway.vars.example` y pega tus valores reales.
4. Redeploy del servicio (Railway lo hace solo al guardar variables).

### Mínimo para empezar YA (sin Canva ni WhatsApp)

```bash
PROMO_OFFER_IMAGE_URL=https://guiaa.vet/promotions/premium-offer-1080.png
PROMO_AUTO_TRIAL_EXHAUSTED=true
PROMO_AUTO_TRIAL_CHANNELS=email
```

Con esto, al agotar la 3ª consulta de prueba se envía **solo email** con la imagen fallback ya publicada en el frontend.

### Completo (email + WhatsApp + Canva)

| Variable | Dónde obtenerla |
|----------|-----------------|
| `RESEND_API_KEY` / `RESEND_FROM` | Ya debería existir (emails transaccionales) |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta Business → WhatsApp Accounts → ID de la cuenta (WABA) |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta → WhatsApp → API Setup → Phone number ID |
| `WHATSAPP_ACCESS_TOKEN` | Token permanente del System User con permisos WhatsApp |
| `WHATSAPP_PROMO_TEMPLATE` | `guiaa_promo_oferta` |
| `CANVA_CLIENT_ID` / `CANVA_CLIENT_SECRET` | [developers.canva.com](https://www.canva.com/developers/) → tu app |
| `CANVA_REFRESH_TOKEN` | Flujo OAuth de Canva Connect (scope brand templates + export) |
| `CANVA_OFFER_TEMPLATE_ID` | ID del Brand Template (ver sección 3) |
| `PROMO_OFFER_IMAGE_URL` | Fallback: `https://guiaa.vet/promotions/premium-offer-1080.png` |
| `PROMO_AUTO_TRIAL_EXHAUSTED` | `true` |
| `PROMO_AUTO_TRIAL_CHANNELS` | `email,whatsapp` |

### Validar config localmente

```bash
cd SV.003-main/backend
python3 scripts/check_promo_config.py
```

## 2. WhatsApp — plantilla Meta (paso a paso)

### Opción A — script (si el token tiene permiso `whatsapp_business_management`)

```bash
cd SV.003-main/backend
# Pega WHATSAPP_* en .env local primero
python3 scripts/setup_whatsapp_template.py --create
python3 scripts/setup_whatsapp_template.py --list
```

### Opción B — manual en Meta Business Manager

1. Entra a [business.facebook.com](https://business.facebook.com) → **WhatsApp Manager**.
2. **Plantillas de mensajes** → **Crear plantilla**.
3. Categoría: **Marketing**.
4. Nombre: `guiaa_promo_oferta`.
5. Idioma: **Español (MX)**.
6. **Encabezado**: Imagen (Media).
7. **Cuerpo**:

```
¡Hola! Tenemos una oferta para ti:

{{1}}

Plan {{2}} — cupón: {{3}}

Contrata en guiaa.vet y sigue usando GUIAA en tu consulta.
```

8. **Pie**: `GUIAA — software clínico veterinario`
9. **Botón**: Tipo URL → texto `Ver oferta` → `https://guiaa.vet/app/membership`
10. Enviar a revisión. Cuando el estado sea **Approved**, ya puedes enviar.

Variables al enviar:
- `{{1}}` = headline (ej. Oferta exclusiva…)
- `{{2}}` = plan (Premium)
- `{{3}}` = cupón (FRIENDS40)

## 3. Canva — plantilla de marca (paso a paso)

### Archivos de referencia en el repo

| Archivo | Uso |
|---------|-----|
| `frontend/public/promotions/canva-reference-premium-offer.png` | Referencia visual para recrear en Canva |
| `frontend/public/promotions/premium-offer-1080.png` | Fallback listo en producción (`PROMO_OFFER_IMAGE_URL`) |

### Crear el diseño

1. Abre Canva → **Crear diseño** → tamaño personalizado **1080 × 1080**.
2. Abre la referencia `canva-reference-premium-offer.png` al lado y replica layout.
3. Colores:
   - Fondo: `#0c2d4d`
   - Acento azul: `#265B93`
   - Badge verde: `#3d9b8f`
4. Logo: `frontend/public/brand/GuiaaLogo-on-dark.png`
5. Crea textos editables y nómbralos exactamente así (autofill):

| Campo data | Contenido ejemplo |
|------------|-------------------|
| `headline` | Oferta exclusiva por completar tu prueba |
| `plan_name` | Premium |
| `promo_code` | FRIENDS40 |
| `message` | Acceso a oferta Premium al terminar tu prueba |
| `cta` | Contratar en guiaa.vet |

6. **Publicar como Brand Template** (requiere Canva Teams/Enterprise + Connect API habilitada).
7. Copia el **brand template ID** → `CANVA_OFFER_TEMPLATE_ID` en Railway.

### Conectar Canva Developers

1. [Canva Developers](https://www.canva.com/developers/) → Create integration.
2. Habilita scopes de Brand Templates + Design export.
3. Completa OAuth y guarda `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_REFRESH_TOKEN`.

### Probar

```bash
cd SV.003-main/backend
python3 scripts/setup_canva_offer_template.py --list-templates
python3 scripts/setup_canva_offer_template.py --test-image
```

## 4. Prueba de envío

```bash
cd SV.003-main/backend
# Solo email (recomendado primero)
python3 scripts/test_promotional_send.py --email tu@email.com --nombre Carlos

# Email + WhatsApp (plantilla ya aprobada)
python3 scripts/test_promotional_send.py --email tu@email.com --phone 5512345678
```

En Admin GUIAA (`/app/admin` → Promociones):
1. Segmento: **Prueba agotada**
2. Canales: Email (y WhatsApp si ya está listo)
3. **Solo simular** → Simular envío
4. Quitar simulación → Enviar promociones

## 5. Orden recomendado

```
Migraciones SQL
    ↓
Railway: PROMO_OFFER_IMAGE_URL + PROMO_AUTO_* + RESEND
    ↓
Probar email con test_promotional_send.py
    ↓
Crear plantilla WhatsApp → esperar Approved
    ↓
Añadir WHATSAPP_* y probar --phone
    ↓
Crear Brand Template Canva → CANVA_*
    ↓
Activar PROMO_AUTO_TRIAL_CHANNELS=email,whatsapp
```

## Troubleshooting

| Síntoma | Qué revisar |
|---------|-------------|
| Email no llega | `RESEND_API_KEY`, dominio verificado en Resend, spam |
| WhatsApp 400 / template | Plantilla no aprobada o nombre distinto a `WHATSAPP_PROMO_TEMPLATE` |
| WhatsApp teléfono inválido | Usar 10 dígitos MX o E.164 (`+5255…`) |
| Canva falla | `PROMO_OFFER_IMAGE_URL` sigue enviando la imagen fallback |
| Auto-promo no dispara | Migración `trial_promo_sent_at`, `PROMO_AUTO_TRIAL_EXHAUSTED=true`, usuario sin membresía |
