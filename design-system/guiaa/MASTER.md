# GUIAA Design System (ui-ux-pro-max × DESIGN.md)

> Source of truth for tokens remains `DESIGN.md`. This file records the verified
> ui-ux-pro-max direction for marketing surfaces. Do not invent accents.

## Dials (landing)

- Variance: **5** — Balanced / Modern
- Motion: **5** — Standard scroll/stagger (no bounce on clinical UI)
- Density: **3** — Spacious marketing rhythm

## Pattern

**Trust & Authority + Pricing conversion**

- Hero (credibility) → Proof → Solution → Pricing (3 tiers) → FAQ → CTA
- Highlight the intended plan (Profesional) with brand border/surface only
- Transparent monthly + annual notes; trial callout near pricing headline
- Accent color only on CTAs and positive checks — navy/blue for trust

## Style (verified)

**Minimalism & Swiss** — clean, spacious, high contrast, geometric grid.
Avoid: Claymorphism, Neumorphism, AI purple gradients, glass stacks, emoji icons.

## Colors (locked — DESIGN.md)

| Role | Hex |
|------|-----|
| Navy | `#0c2d4d` |
| Blue | `#265B93` |
| Green / CTA | `#3d9b8f` |
| Green dark | `#2f857a` |
| Surface | `#ffffff` |
| Surface muted | `#f8fafc` |
| Border | `#e2e8f0` / `rgba(12,45,77,0.1)` |
| Ink | `#0f172a` |
| Muted | `#64748b` |

## Typography

- Display: Source Serif 4
- Body/UI: Source Sans 3
- Scale discipline: 12 / 14 / 16 / 18 / 24 / ~30 for prices
- Body measure ~34–65ch on leads

## Effects

- Subtle border + soft shadow only (`0 4px 20px -12px`)
- Hover: 200–250ms ease, cursor-pointer, no layout shift
- Focus: ≥2px ring, offset 2px, contrast ≥3:1
- `prefers-reduced-motion`: skip transforms / stagger

## Anti-patterns

- Split layout only on featured pricing card
- Random type sizes / mixed green hues on one card
- Hover-only critical actions
- Tight touch targets (<44px) or <8px gaps between controls
