---
name: GUIAA
description: Plataforma clínica multiespecie CDS para MVZ certificados en Latinoamérica
colors:
  navy: "#0c2d4d"
  blue: "#265B93"
  green: "#3d9b8f"
  green-dark: "#2f857a"
  sky-soft: "#e8f4fc"
  sky-mist: "#d4ebf7"
  surface: "#ffffff"
  surface-muted: "#f8fafc"
  border: "#e2e8f0"
  ink: "#0f172a"
  ink-muted: "#64748b"
  ink-subtle: "#94a3b8"
  danger: "#ef4444"
  warning: "#f59e0b"
typography:
  display:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.85rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.blue}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-guiaa-green:
    backgroundColor: "{colors.green}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "14px 28px"
  card-clinic:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  stat-pill:
    backgroundColor: "rgba(255, 255, 255, 0.9)"
    rounded: "{rounded.md}"
    padding: "12px 14px"
---

## Overview

GUIAA combina **landing brand** (gradientes sky, tipografía bold, previews de producto) con **app clínica product** (layout denso, sidebar/drawer, KPIs, tablas). El sistema visual usa Tailwind tokens `guiaa-brand-*` y variables CSS `--clinic-navy`, `--clinic-blue`, `--clinic-green`. Espaciado en escala 4/8/12/16/24. Layout clínico: header fijo + toolbar móvil ≤1023px + contenido con `PageEnter` y motion en `styles/premiumMotion.css`.

## Colors

- **Primary (institucional):** `#265B93` — links, eyebrow labels, acentos UI.
- **Navy (ink brand):** `#0c2d4d` — títulos, nav activa, confianza.
- **Green (acción / salud):** `#3d9b8f` — CTAs landing, badges positivos, plan premium.
- **Neutrals:** fondos `#ffffff`, `#f8fafc`, `#e8f4fc`; bordes `rgba(38, 91, 147, 0.12)`.
- **Texto:** cuerpo `#64748b` sobre blanco; **no** gris claro sobre fondos tintados.
- **Dark mode:** `data-theme="dark"` + `darkModeOverrides.css` — mantener contraste al invertir superficies.

## Typography

- Familia: system stack (sin Inter forzado); antialiased global.
- **Landing h1:** clamp, `-0.02em`, `text-wrap: balance`.
- **Clínica h1:** 26px desktop → 22px tablet → bold 800, color navy.
- **Eyebrow:** 11px, uppercase, letter-spacing 0.12em, color blue.
- **Prose clínico:** max ~32–65ch en subtítulos de página; tablas pueden ser más anchas con scroll.

## Elevation

- Cards clínicas: sombra suave `0 2px 12px -6px rgba(12, 45, 77, 0.08)`, borde 1px tintado.
- Landing shell: `shadow-[0_24px_80px_-12px_rgba(0,0,0,0.35)]` en contenedor principal.
- Modales/dialogs: `clinic-dialog-guiaa` — radius 16px, sombra profunda.
- Toasts Sonner: `guiaa-toaster`, spring suave, sin bounce.
- z-index semántico: header 1000, nav dropdown 1200, drawer overlay 50 (Vaul), modales 99999.

## Components

- **Button (shadcn):** variantes `guiaaPrimary`, `guiaaSoft`, `guiaaDiagnosis` para flujos legacy; preferir `default`/`secondary` en clínica nueva.
- **ClinicPageUi:** `ClinicStatPill`, `ClinicEmptyState`, skeletons — usar en páginas `/app/*`.
- **ClinicShell:** sidebar desktop >1023px; `ClinicMobileNavDrawer` (Vaul) ≤1023px.
- **Header:** logo + campana + menú usuario; nav oculto hasta `.mobile-open` en compact.
- **Forms:** `form-section`, stepper consulta, `category-grid` 2→1 col en móvil.
- **Feedback:** Sonner vía `lib/appToast.js` — no banners inline `error-message`.

## Do's and Don'ts

**Do**

- Usar tokens `guiaa-brand-navy`, `guiaa-brand-blue`, `guiaa-brand-green`.
- Respetar breakpoint clínico **1023px** (`lib/clinicBreakpoints.js`).
- Añadir motion con `premiumMotion.css` + `prefers-reduced-motion`.
- Mantener copy en español LATAM, tono profesional MVZ.
- Tablas: wrapper con `overflow-x: auto`, min-width explícito.

**Don't**

- Purple gradients, font Inter por defecto, cards anidadas sin motivo.
- Gray `#9ca3af` on colored backgrounds.
- Mostrar `nav-menu` usuario fuera del panel hamburguesa en ≤1023px.
- `100vw` en modales (usar `100%` / `100dvh`).
- Bounce/elastic easing; animaciones que oculten contenido hasta scroll.
