# Plan de lanzamiento — Google Ads GUIAA

Guía operativa para activar campañas de Google Search/Display después del merge de gtag + conversiones a `main`.

---

## 1. Checklist pre-lanzamiento (obligatorio)

### Variables de entorno (Vercel — frontend)

| Variable | Dónde obtenerla |
|----------|-----------------|
| `REACT_APP_GOOGLE_ADS_ID` | Google Ads → Herramientas → Conversiones → etiqueta global del sitio → ID `AW-XXXXXXXXX` |
| `REACT_APP_GOOGLE_ADS_REGISTRATION_LABEL` | Conversiones → acción "Registro MVZ" → etiqueta (sufijo tras `/`) |
| `REACT_APP_GOOGLE_ADS_CHECKOUT_LABEL` | (opcional) Acción "Inicio de checkout" |
| `REACT_APP_GOOGLE_ADS_PURCHASE_LABEL` | (opcional) Acción "Compra" |

### Crear acciones de conversión en Google Ads

1. Google Ads → **Objetivos** → **Conversiones** → **Nueva acción de conversión**.
2. Origen: **Sitio web**.
3. Crear al menos:
   - **Registro MVZ** — categoría "Registrarse" — URL contiene `/registro` o evento personalizado.
   - **Inicio de checkout** — categoría "Agregar al carrito" (opcional, fase 2).
   - **Compra** — categoría "Compra" — incluir valor y `transaction_id` (ID sesión Stripe).
4. Copiar el ID `AW-...` y cada etiqueta `.../AbCdEfGh` a las variables de Vercel.

### Verificación técnica

1. Instalar [Google Tag Assistant](https://tagassistant.google.com/) en Chrome.
2. Visitar `https://www.guiia.com.mx` → debe cargar gtag con `AW-...`.
3. Ir a `/pricing` → evento `view_item` (audiencias de remarketing).
4. Completar registro de prueba → conversión **Registro** en Google Ads (puede tardar hasta 24 h en reportes; usar "Diagnóstico de etiquetas" para validación inmediata).
5. En Google Ads → **Conversiones** → columna **Estado** debe mostrar "Sin conversiones recientes" → "Registrando conversiones" tras pruebas.

---

## 2. Estructura de campaña recomendada

### Fase 1 — Validación (Search)

| Campo | Valor |
|-------|-------|
| **Tipo** | Campaña de búsqueda |
| **Objetivo** | Leads / Registros en el sitio web |
| **Conversión principal** | Registro MVZ |
| **Presupuesto** | $20–35 USD/día |
| **Ubicación** | México (expandir a LATAM después) |
| **Idioma** | Español |
| **Estrategia de puja** | Maximizar conversiones (con target CPA cuando haya 30+ conversiones) |

**Palabras clave sugeridas (concordancia de frase):**

- `software veterinario`
- `historia clínica veterinaria`
- `sistema consultorio veterinario`
- `cds veterinario`
- `software clínica veterinaria méxico`

**Palabras clave negativas iniciales:**

- `gratis descargar` (si no hay plan free)
- `empleo veterinaria`
- `universidad veterinaria`
- `libro veterinaria`

### Fase 2 — Escala

- Añadir campaña **Performance Max** con creativos de los ángulos A/B/C (ver sección 4).
- Activar remarketing: visitantes 30 días + `view_item` en pricing sin registro.
- Subir presupuesto 15–20% cada 5 días si CPA se mantiene bajo target.

### Target CPA orientativo (México, B2B SaaS nicho)

| Métrica | Objetivo inicial |
|---------|------------------|
| CPC | $0.50–$2.00 USD |
| Costo por registro | $10–$30 USD |
| Registro → pago | 5–15% |

---

## 3. Audiencias

### Prospección (Search)

- Palabras clave de intención alta (software, sistema, plataforma).
- Excluir audiencia "Estudiantes" si aplica.

### Remarketing (Display / PMax)

- Visitantes del sitio (30 días).
- Usuarios que vieron pricing (`view_item`) sin registro.
- Usuarios con checkout iniciado sin compra (cuando `CHECKOUT_LABEL` esté activo).

---

## 4. Brief creativo — 3 ángulos para test

### Ángulo A — Eficiencia clínica (Search + Display)

**Titular:** Consultas veterinarias más rápidas con IA  
**Descripción:** CDS + historia clínica + recetas en un solo lugar. Hecho para MVZ en México.  
**CTA:** Regístrate gratis  

### Ángulo B — Confianza profesional

**Titular:** CDS veterinario para MVZ titulados  
**Descripción:** Verificación de cédula profesional. Herramienta clínica seria, no marketing genérico.  
**CTA:** Ver planes  

### Ángulo C — Remarketing

**Titular:** Completa tu registro en GUIAA  
**Descripción:** Ya conoces la plataforma — empieza en 2 minutos.  
**CTA:** Registrarse  

**Extensiones obligatorias en Search:**

- Enlaces de sitio: `/pricing`, `/registro`, blog o FAQ si existe.
- Fragmentos estructurados: "Verificación de cédula", "Soporte LATAM", "IA clínica".
- Llamada (si hay teléfono de ventas).

---

## 5. UTM para atribución

Usar en todos los enlaces finales de ads:

```
https://www.guiia.com.mx/?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}
```

Google Ads reemplaza `{campaignid}`, `{keyword}` y `{creative}` automáticamente con el seguimiento de plantilla.

---

## 6. Métricas a revisar (diario, primeros 14 días)

| Métrica | Dónde | Acción si mal |
|---------|-------|---------------|
| Impresiones / CTR | Google Ads | Revisar copy y extensiones |
| CPC | Google Ads | Ajustar pujas o palabras clave |
| Conversiones (registro) | Google Ads → Conversiones | Verificar etiqueta en Vercel |
| Calidad de anuncio | Google Ads | Mejorar relevancia keyword ↔ anuncio ↔ landing |
| CPA registro | Ads + Supabase | Pausar keywords/ads con CPA > 2× target |
| Estado de etiqueta | Conversiones → Diagnóstico | Revisar CSP y `REACT_APP_GOOGLE_ADS_ID` |

---

## 7. Orden de activación en Google Ads

1. Crear acciones de conversión y configurar variables en Vercel.
2. Desplegar frontend y verificar etiqueta con Tag Assistant.
3. Campaña **Búsqueda** → objetivo Leads → conversión Registro MVZ.
4. 1 grupo de anuncios por cluster de keywords (software / CDS / consultorio).
5. 2–3 anuncios responsivos por grupo (ángulos A y B).
6. Presupuesto $25/día; **no** cambiar estructura los primeros 7 días (aprendizaje).
7. Día 8+: pausar keywords sin impresiones; escalar ganadores.

---

## 8. Compliance (salud / profesionales)

- No prometer diagnósticos automáticos ni resultados clínicos garantizados.
- Usar "apoyo a la decisión clínica" / "herramienta para el profesional".
- Landing coherente con el anuncio; política de privacidad accesible (requerida por Google).
- Cumplir políticas de Google Ads para servicios de salud y software médico.

---

## 9. Contacto y escalamiento

- **Etiqueta / conversiones:** Google Ads → Diagnóstico de etiquetas; consola del navegador (`gtag`).
- **Documentación env vars:** `CHECKLIST_VERCEL.md`
- **Paridad con Meta:** `META_ADS_LAUNCH_PLAN.md` (mismos eventos de funnel)

---

*Última actualización: julio 2026 — integración gtag + conversiones Google Ads.*
