# Checklist día 1 — crear campaña en Google Ads

## Antes (tracking)

- [ ] Acciones de conversión creadas (Registro = primaria)
- [ ] Variables en Vercel configuradas y redeploy hecho
- [ ] Tag Assistant confirma `AW-...` en guiaa.vet
- [ ] Registro de prueba dispara conversión

## Crear campaña

- [ ] Nueva campaña → **Búsqueda**
- [ ] Objetivo: Conversiones / Leads
- [ ] Nombre: `GUIAA_Search_MX_MVZ_Registros`
- [ ] Conversiones: solo **Registro MVZ** como primaria
- [ ] Presupuesto: $20–35 USD/día
- [ ] Ubicación: México
- [ ] Idioma: Español
- [ ] Redes: **solo Búsqueda** (sin Display partners)
- [ ] Puja: Maximizar conversiones

## Ad groups + keywords

- [ ] Crear 4 ad groups (Software / Historia / CDS / Brand)
- [ ] Importar o pegar `keywords.csv`
- [ ] Match type: Phrase (Brand Exact)

## Anuncios RSA

- [ ] Pegar titulares/descripciones de `rsa-copy.csv` (máx. 30/90 caracteres — revisar en UI)
- [ ] Final URL de `final-urls.md`
- [ ] Paths: `software/veterinario` etc.

## Extensiones + negativos

- [ ] Sitelinks + callouts + snippet (`extensions.md`)
- [ ] Negativas de campaña (`negatives.csv`)

## Publicar

- [ ] Revisar estimación de impresiones
- [ ] Activar campaña
- [ ] Calendarizar revisión Search Terms: día 3 y día 7

## Métricas a mirar (primera semana)

| Métrica | Acción si fuera de rango |
|---------|--------------------------|
| CTR < 3% | Revisar RSA / relevance |
| CPC > $2.5 | Añadir negativas / bajar match amplio |
| 0 conversiones en 7d con >$150 gastados | Revisar tracking + landing |
| CPA registro > $40 | Pausar keywords caros, reforzar Brand + Historia |
