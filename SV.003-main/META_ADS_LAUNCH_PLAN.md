# Plan de lanzamiento — Meta Ads GUIAA

Guía operativa para activar campañas de Facebook/Instagram después del merge de Pixel + CAPI a `main`.

---

## 1. Checklist pre-lanzamiento (obligatorio)

### Variables de entorno

| Plataforma | Variable | Dónde obtenerla |
|------------|----------|-----------------|
| **Vercel** (frontend) | `REACT_APP_META_PIXEL_ID` | Meta Events Manager → Data Sources → tu Pixel → Settings |
| **Railway** (backend) | `META_PIXEL_ID` | Mismo ID que arriba |
| **Railway** (backend) | `META_CAPI_ACCESS_TOKEN` | Events Manager → Pixel → Settings → Conversions API → Generate access token |
| **Railway** (opcional) | `META_CAPI_TEST_EVENT_CODE` | Test Events tab — solo para pruebas |

### Base de datos

Ejecutar en Supabase SQL Editor:

```sql
-- Archivo: backend/supabase_migrations/20260702_meta_capi_purchase_sent.sql
```

### Verificación técnica

1. Instalar [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper) en Chrome.
2. Visitar `https://www.guiia.com.mx` → debe disparar **PageView**.
3. Ir a `/pricing` → **ViewContent**.
4. Completar registro de prueba → **CompleteRegistration** (navegador + CAPI en Events Manager).
5. En [Events Manager](https://business.facebook.com/events_manager) → **Test Events**: pegar `META_CAPI_TEST_EVENT_CODE` y repetir registro.
6. Confirmar **Event Match Quality** > 6/10 (email hasheado mejora el score).

### Dominio verificado

En Business Manager → Brand Safety → Domains: verificar `guiia.com.mx` (requerido para optimización de conversiones).

---

## 2. Estructura de campaña recomendada

### Fase 1 — Validación (semana 1–2)

| Campo | Valor |
|-------|-------|
| **Objetivo** | Ventas → Conversiones en el sitio web |
| **Evento de optimización** | `CompleteRegistration` |
| **Presupuesto** | $20–30 USD/día (CBO a nivel campaña) |
| **Ubicación** | México (expandir a LATAM después) |
| **Edad** | 24–55 |
| **Intereses** | Veterinaria, medicina veterinaria, clínica veterinaria, animales de compañía |
| **Exclusiones** | Estudiantes de veterinaria (si el producto es solo MVZ titulados) |
| **Placement** | Advantage+ (dejar que Meta optimice) |

**Por qué CompleteRegistration y no Purchase:** el funnel es registro → verificación cédula → pago. Optimizar por registro da más volumen de señal mientras el checkout madura.

### Fase 2 — Escala (cuando tengas 50+ registros/semana)

- Duplicar campaña optimizando por **InitiateCheckout** o **Purchase** (cuando CAPI de compra esté estable).
- Subir presupuesto 20% cada 3 días si CPA se mantiene bajo target.

### Target CPA orientativo (México, B2B SaaS nicho)

| Métrica | Objetivo inicial |
|---------|------------------|
| CPC | $0.40–$1.20 USD |
| Costo por registro | $8–$25 USD |
| Registro → pago | 5–15% (mejorar con onboarding) |

---

## 3. Audiencias

### Audiencia fría (prospecting)

- Intereses apilados: veterinaria + software médico + emprendimiento
- Lookalike 1% de **CompleteRegistration** (crear después de 100+ eventos)

### Audiencia tibia

- Visitantes web 30 días (`PageView`) — retargeting con creativo de prueba social
- `ViewContent` en `/pricing` sin registro — urgencia / demo

### Audiencia caliente

- `InitiateCheckout` sin `Purchase` — remarketing 7 días
- Registrados sin pago — email + ads (si tienes Custom Audience por email)

---

## 4. Brief creativo — 3 ángulos para test A/B/C

### Ángulo A — Dolor / eficiencia (recomendado para frío)

**Hook (3 s):** "¿Sigues escribiendo recetas a mano en 2026?"

**Cuerpo:**
- CDS veterinario con IA para consultas en minutos, no horas
- Historia clínica, recetas y seguimiento en un solo lugar
- Hecho para MVZ en México y LATAM

**CTA:** Regístrate gratis — `guiia.com.mx`

**Formato:** Video vertical 9:16 (Reels/Stories) 15–30 s, o carrusel 3 slides.

**Texto principal (≤125 caracteres visible):**
> La plataforma clínica que los MVZ usan para consultar más rápido. IA + historia clínica + recetas. Prueba GUIAA.

---

### Ángulo B — Autoridad / confianza

**Hook:** "Diseñado con médicos veterinarios, no con marketers."

**Cuerpo:**
- Verificación de cédula profesional
- Soporte para normativa y práctica clínica en LATAM
- Planes desde acceso básico hasta consultorio completo

**CTA:** Ver planes — landing `/pricing`

**Formato:** Imagen estática 1080×1080 o video con pantallazos reales del producto (blur datos sensibles).

**Texto principal:**
> GUIAA: CDS veterinario serio para consultas reales. Verifica tu cédula y empieza hoy.

---

### Ángulo C — Urgencia / oferta (retargeting)

**Hook:** "Tu próxima consulta puede ser más rápida."

**Cuerpo:**
- Ya viste GUIAA — completa tu registro en 2 minutos
- Membresía con acceso a herramientas clínicas con IA

**CTA:** Completar registro

**Formato:** Story 9:16 con sticker de enlace.

---

## 5. Copy para anuncios (español LATAM)

### Titular corto (headline)
- "Consultas veterinarias más rápidas con IA"
- "CDS para MVZ en México"
- "Menos papeleo, más pacientes"

### Descripción larga (opcional)
> GUIAA centraliza historia clínica, apoyo diagnóstico con IA y documentación para médicos veterinarios. Registro con verificación de cédula profesional. Ideal para consultorio y telemedicina veterinaria.

### Hashtags (orgánico / algunos placements)
`#veterinaria #medicinaveterinaria #MVZ #clinicaveterinaria #softwareveterinario`

---

## 6. UTM para atribución cruzada

Usar en todos los enlaces de ads:

```
https://www.guiia.com.mx/?utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```

Meta reemplaza `{{campaign.name}}` y `{{ad.name}}` automáticamente en Ads Manager.

---

## 7. Métricas a revisar (diario, primeros 14 días)

| Métrica | Dónde | Acción si mal |
|---------|-------|---------------|
| CTR link | Ads Manager | Cambiar creativo/hook |
| CPC | Ads Manager | Ajustar audiencia o puja |
| Registros (Pixel) | Events Manager | Revisar funnel landing |
| Registros (CAPI) | Events Manager | Verificar token Railway |
| Deduplicación | Events Manager | `event_id` debe coincidir browser/server |
| CPA registro | Ads + Supabase | Pausar ad sets con CPA > 2× target |

---

## 8. Orden de activación en Ads Manager

1. Crear campaña **Ventas** → sitio web → evento **CompleteRegistration**.
2. Conjunto de anuncios: México, 24–55, intereses veterinaria, presupuesto $25/día.
3. Subir 3 anuncios (ángulos A, B, C) — mismo conjunto para que Meta compare.
4. Publicar en horario laboral MX (7:00–22:00) si usas programación; si no, 24/7 con Advantage+.
5. **No tocar** la campaña los primeros 3 días (fase de aprendizaje).
6. Día 4–7: apagar el anuncio con peor CTR; duplicar el ganador con variación de hook.

---

## 9. Compliance Meta (salud / profesionales)

- No prometer curas ni resultados clínicos garantizados.
- Decir "apoyo a la decisión clínica" / "herramienta para el profesional", no "diagnóstico automático".
- Landing debe coincidir con el anuncio (misma propuesta de valor).
- Política de privacidad y términos accesibles desde la landing (ya en sitio).

---

## 10. Contacto y escalamiento

- **Pixel / CAPI issues:** revisar logs Railway `meta_capi` y Events Manager Test Events.
- **PR técnico:** #16 en repo `GUIIA_CONSULTIONS.`
- **Documentación env vars:** `CHECKLIST_VERCEL.md`

---

*Última actualización: julio 2026 — post-merge Pixel + CAPI a main.*
