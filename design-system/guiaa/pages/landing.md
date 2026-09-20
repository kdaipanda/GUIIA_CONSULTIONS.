# Landing — overrides

Extends `design-system/guiaa/MASTER.md`.

## Motion (animate skill)

**Thesis**

- Focal: hero clinical entrance — brand → title → CTAs → Diagnóstico lead block
- Continuity: proof stats · how-rail sequence · clinical steps · pricing set · trust line · final CTA settle
- Feedback: CTA/feature press · FAQ expand (opacity/transform) · nav drawer · CTA arrow nudge

**Rules:** MOTION 5 · no bounce · `prefers-reduced-motion` keeps opacity/state feedback · CSS only (`landingAnimate.css`) · stagger delays capped (~340ms max) · no `grid-template-rows` / `letter-spacing` transitions

## Accessibility (web-design-guidelines)

- Skip link → `#landing-main`
- Section anchors as `<a href>` (Cmd/Ctrl+click safe)
- Hero video: still under reduced-motion until opt-in play
- Modal: `overscroll-behavior: contain` + focus return
- Interactive: `touch-action: manipulation`, `theme-color`, `color-scheme: dark`

## Pricing (#pricing)

- Equal 3-column vertical cards (`lg:grid-cols-3`); no horizontal split on featured
- Featured = muted surface + green border + top accent; same internal structure as siblings
- CTA full-width, pinned to card bottom (`margin-top: auto`), min-height ≥44px
- Badge: short label only (“Más usado”); quota badges use blue soft chip
- Price in green; plan name in navy; features with green check icons (`aria-hidden`)
- Addon strip: flat surface (no heavy glass); trust banner below with compare link

## Interaction checklist

- `cursor-pointer` on all CTAs / nav / FAQ triggers
- `:focus-visible` ring on buttons and links
- Card hover: border/shadow only (no translate on touch-first)
- Section gaps respect density dial (spacious)
