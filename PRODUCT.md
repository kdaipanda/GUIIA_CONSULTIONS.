# GUIAA — Product Context

## Register

**Primary:** product (app clínica veterinaria)  
**Secondary:** brand (landing pública en `/`, marketing en guiaa.vet)

Las pantallas `/app/*` son **producto**: la UI sirve flujos clínicos (consulta, agenda, inventario, ventas). La landing es **brand**: la presentación es parte del producto.

## Users & Purpose

- **Quién:** médicos veterinarios certificados (MVZ) en Latinoamérica, dueños de consultorio o clínicas pequeñas–medianas.
- **Contexto:** consulta en vivo, poco tiempo, mucha carga cognitiva clínica; también gestión administrativa entre citas.
- **Trabajo principal:** registrar consultas multiespecie con soporte CDS (L4/L5), gestionar dueños/mascotas, agenda, inventario y ventas.
- **Emoción (brand):** confianza clínica, profesionalismo, claridad — no “startup genérica” ni “app de IA flashy”.

## Brand Personality

**Preciso · Confiable · Humano**

- Preciso: jerarquía clara, datos legibles, sin ruido visual.
- Confiable: paleta institucional azul/verde, copy sobrio, accesibilidad real.
- Humano: tono cercano en español LATAM, micro-interacciones sutiles (Sonner, motion premium), no gamificación excesiva.

## Anti-References

- Plantillas SaaS morado–azul gradient, Inter everywhere, cards dentro de cards.
- Dashboards “AI slop” con icon tiles redondos sobre cada título.
- Texto gris `#9ca3af` sobre fondos tintados (bajo contraste).
- Bounce/elastic easing, dark glows genéricos.
- Copy hype de “IA mágica” en flujos clínicos serios.

## Strategic Design Principles

1. **Clínica primero:** densidad informativa útil > decoración.
2. **Una acción principal por pantalla** (CTA claro: nueva cita, nueva consulta, guardar).
3. **Mobile real ≤1023px:** drawer Vaul, header compacto, tablas con scroll horizontal controlado.
4. **Tokens GUIAA:** navy `#0c2d4d`, blue `#265B93`, green `#3d9b8f` — no inventar acentos nuevos.
5. **Motion con propósito:** entradas suaves, `prefers-reduced-motion` siempre; sin animar layout crítico.
6. **Accesibilidad:** contraste WCAG AA, touch targets ≥44px en controles principales, español claro.

## Stack (frontend)

- React 19 + CRA/craco, React Router
- Tailwind + CSS modules globales (`App.css`, páginas clínicas)
- shadcn/ui (Radix), Sonner, Vaul
- Código app en `SV.003-main/frontend/src/`

## Key Surfaces

| Superficie | Rutas / archivos |
|------------|------------------|
| Landing | `pages/LandingPage.jsx`, `pages/landing/*` |
| Auth | `layout/AuthPageShell.jsx`, vistas en `App.js` |
| Clínica | `layout/ClinicShell.jsx`, `pages/clinic/*` |
| Consulta | `App.js` (consultation flow), formularios por especie |
