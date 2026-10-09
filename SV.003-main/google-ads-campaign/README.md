# Kit Google Ads — GUIAA (listo para pegar)

Archivos para crear la campaña de búsqueda en Google Ads UI o Editor.

| Archivo | Uso |
|---------|-----|
| [keywords.csv](./keywords.csv) | Palabras clave por ad group |
| [negatives.csv](./negatives.csv) | Negativas a nivel campaña |
| [rsa-copy.csv](./rsa-copy.csv) | Titulares + descripciones RSA |
| [final-urls.md](./final-urls.md) | URLs finales con UTM |
| [extensions.md](./extensions.md) | Sitelinks, callouts, snippets |
| [day1-checklist.md](./day1-checklist.md) | Checklist día 1 en la UI |

Plan completo: [`../GOOGLE_ADS_LAUNCH_PLAN.md`](../GOOGLE_ADS_LAUNCH_PLAN.md)

## Configuración mínima en Vercel

```bash
REACT_APP_GOOGLE_ADS_ID=AW-XXXXXXXXX
REACT_APP_GOOGLE_ADS_REGISTRATION_LABEL=AbCdEfGhIjK
# opcionales fase 2:
# REACT_APP_GOOGLE_ADS_CHECKOUT_LABEL=...
# REACT_APP_GOOGLE_ADS_PURCHASE_LABEL=...
```
