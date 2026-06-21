---
name: guiaa-taste
description: Orquestador Taste Skill para GUIAA. Define qué skill usar según el contexto (landing vs clínica), los dials del proyecto y la prioridad de DESIGN.md/PRODUCT.md sobre defaults genéricos.
---

# GUIAA — Taste Skill (proyecto)

Este skill complementa **Impeccable** y **Taste Skill**. No reemplaza `DESIGN.md` ni `PRODUCT.md`; los respeta siempre.

## Fuente de verdad (orden de prioridad)

1. `DESIGN.md` — tokens, colores, tipografía, componentes GUIAA
2. `PRODUCT.md` — registro producto vs brand, anti-referencias, principios
3. Impeccable (`/impeccable …`) — flujo clínico, auditoría, comandos de pulido
4. Taste Skill — anti-slop y calidad visual según el área

## Qué skill usar

| Área | Ruta / pantalla | Skill principal | Dials GUIAA |
|------|-----------------|-----------------|-------------|
| Landing pública | `/`, marketing | `design-taste-frontend` | VARIANCE **5**, MOTION **5**, DENSITY **3** |
| Rediseño UI existente | cualquier | `redesign-existing-projects` | preservar tokens GUIAA |
| Clínica / dashboard | `/app/*` | **Impeccable** (no design-taste landing) | DENSITY **6–7**, MOTION **4–5** |
| Consulta multistep | flujo consulta | Impeccable + `consultationFlow.css` | VARIANCE **3**, MOTION **4**, DENSITY **6** |
| Output completo | refactors, App.js | `full-output-enforcement` | — |
| Soft / premium landing | hero, pricing | `high-end-visual-design` | solo si no rompe paleta GUIAA |

## Paleta obligatoria (no inventar acentos)

- Navy: `#0c2d4d`
- Blue: `#265B93`
- Green: `#3d9b8f`
- Superficies: `#ffffff`, `#f8fafc`
- Ink: `#0f172a`, muted `#64748b`

## Anti-patrones GUIAA (refuerzo)

- Gradientes morado–azul “AI slop”, Inter como única fuente, cards dentro de cards
- Bounce/elastic en UI clínica; dark glows genéricos
- Tipografía gris `#9ca3af` sobre fondos tintados
- `design-taste-frontend` en tablas, dashboards o flujos multistep de producto

## Design Read (plantilla GUIAA)

Antes de generar UI, declarar:

*"Reading this as: [landing B2B clínica | app clínica MVZ | redesign] for [MVZ LATAM | visitante landing], with a [confiable / preciso / humano] language, leaning toward [DESIGN.md tokens | Impeccable product register]."*

## Breakpoint móvil clínico

Compacto clínico: **≤1023px** (`CLINIC_COMPACT_MEDIA_QUERY`). Drawer Vaul, header compacto, touch ≥44px.

## Actualizar Taste Skill

```bash
npx skills update
```

Luego volver a copiar `.agents/skills/*` → `.cursor/skills/` (excepto `impeccable`).
