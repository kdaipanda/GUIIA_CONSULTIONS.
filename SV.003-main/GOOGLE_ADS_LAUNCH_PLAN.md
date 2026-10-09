# Plan de lanzamiento — Google Ads GUIAA

Guía operativa para activar campañas de **Google Search** (y luego PMax/remarketing) hacia veterinarios MVZ en México / LATAM.

**Dominio de destino:** `https://guiaa.vet` (no usar guiia.com.mx).

**Kit listo para pegar en la UI:** `SV.003-main/google-ads-campaign/`

---

## 1. Checklist pre-lanzamiento (obligatorio)

### Variables de entorno (Vercel — frontend)

| Variable | Dónde obtenerla |
|----------|-----------------|
| `REACT_APP_GOOGLE_ADS_ID` | Google Ads → Objetivos → Conversiones → etiqueta global → ID `AW-XXXXXXXXX` |
| `REACT_APP_GOOGLE_ADS_REGISTRATION_LABEL` | Acción "Registro MVZ" → etiqueta (sufijo tras `/`) |
| `REACT_APP_GOOGLE_ADS_CHECKOUT_LABEL` | (opcional) "Inicio de checkout" |
| `REACT_APP_GOOGLE_ADS_PURCHASE_LABEL` | (opcional) "Compra" |

### Crear acciones de conversión en Google Ads

1. Google Ads → **Objetivos** → **Conversiones** → **Nueva acción**.
2. Origen: **Sitio web**.
3. Crear:
   - **Registro MVZ** — categoría "Registrarse" — **primaria**
   - **Inicio de checkout** — secundaria (fase 2)
   - **Compra** — secundaria, con valor + `transaction_id`
4. Pegar `AW-...` y etiquetas en Vercel → Redeploy.

### Verificación técnica

1. [Google Tag Assistant](https://tagassistant.google.com/)
2. Abrir `https://guiaa.vet` → debe cargar gtag `AW-...`
3. Scroll a pricing → `view_item`
4. Registro de prueba → conversión **Registro MVZ**
5. En Conversiones → Diagnóstico de etiquetas: estado activo

---

## 2. Estructura de campaña (Fase 1 — Search)

| Campo | Valor |
|-------|-------|
| **Nombre** | `GUIAA_Search_MX_MVZ_Registros` |
| **Tipo** | Búsqueda |
| **Objetivo** | Leads / Conversiones web |
| **Conversión principal** | Registro MVZ |
| **Presupuesto** | $20–35 USD/día |
| **Ubicación** | México (personas en o que muestran interés) |
| **Idioma** | Español |
| **Redes** | Solo Búsqueda (desactiva Display partners al inicio) |
| **Puja** | Maximizar conversiones → luego tCPA tras ~30 conversiones |

### Grupos de anuncios

| Ad group | Intención | Keywords (ver CSV) |
|----------|-----------|--------------------|
| `AG_Software_Veterinario` | Software / sistema | software veterinario, sistema consultorio… |
| `AG_Historia_Clinica` | Historia clínica digital | historia clínica veterinaria… |
| `AG_CDS_Clinico` | Apoyo decisión / CDS | cds veterinario, software cds veterinaria… |
| `AG_Brand` | Marca | guiaa, guiaa.vet, guiia… |

Landing: `https://guiaa.vet/?utm_source=google&utm_medium=cpc&utm_campaign=search_mx_mvz&utm_term={keyword}&utm_content={creative}`

---

## 3. Fase 2 — Escala

- **Remarketing / Demand Gen:** visitantes 30 días + pricing viewers
- **Performance Max:** reutilizar ángulos A/B/C + screenshots de `frontend/public/landing/`
- Subir presupuesto **15–20% cada 5 días** si CPA ≤ target

### Targets orientativos (MX, B2B nicho)

| Métrica | Objetivo inicial |
|---------|------------------|
| CPC | $0.50–$2.00 USD |
| Costo por registro | $10–$30 USD |
| Registro → pago | 5–15% |

---

## 4. Brief creativo (RSA + Display)

### Ángulo A — Eficiencia

- Hook: ¿Sigues armando el historial en papel o WhatsApp?
- Promesa: consulta multiespecie + apoyo clínico en un solo lugar
- CTA: 3 consultas de prueba gratis

### Ángulo B — Autoridad

- Hook: Hecho para MVZ certificados en LATAM
- Promesa: cédula, tono clínico, planes claros
- CTA: Regístrate en guiaa.vet

### Ángulo C — Oferta / remarketing

- Hook: Ya viste GUIAA — completa tu registro
- Promesa: prueba gratis + cupón si aplica
- CTA: Continuar registro

Copy RSA listo: `google-ads-campaign/rsa-copy.csv`

---

## 5. Extensiones (día 1)

| Tipo | Contenido |
|------|-----------|
| Sitelinks | Precios, Registro, Funciones, Contacto/WhatsApp |
| Callouts | 3 consultas gratis · Multiespecie · CDS clínico · Español LATAM |
| Snippet estructurado | Tipos: Historia clínica, Agenda, Inventario, CDS |

Ver `google-ads-campaign/extensions.md`

---

## 6. Negativos iniciales

Importar `google-ads-campaign/negatives.csv`:

empleo, universidad, libro, gratis descargar, plantilla word, pdf, curso, facultad…

---

## 7. Orden de activación

```
1. Merge + deploy frontend con googleAds.js
2. Crear conversiones en Google Ads + vars Vercel
3. Tag Assistant OK
4. Importar keywords + negatives + RSA
5. Presupuesto $20–35/día, solo Search MX
6. Revisar Search Terms a día 3 y 7
7. Añadir remarketing / PMax cuando haya ≥30 registros
```

## 8. Qué NO hacer

- No apuntar a `#guia-consultas` (landing de anunciantes, no MVZ)
- No optimizar por Purchase en semana 1
- No mezclar Display partners con Search al inicio
- No usar dominio antiguo en UTMs ni final URL
