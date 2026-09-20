---
name: animate
description: "Add purposeful animations, micro-interactions, and motion that improve usability and delight. Use when the user asks to animate, add motion, micro-interactions, scroll reveals, hover feedback, transitions, or /animate on a page, component, or feature. Respects prefers-reduced-motion and project design tokens."
---

# Animate

Review a feature and enhance it with purposeful animations and micro-interactions that improve understanding, feedback, and delight — not decoration.

Compatible with Impeccable `/impeccable animate`. Prefer this skill when the user invokes `/animate` or asks to “agregar animación / motion”.

## When to use

- Missing visual feedback on actions
- Jarring state changes
- Unclear spatial / hierarchical relationships
- Functional but joyless interactions
- Guiding attention at a meaningful moment

## Parameters

- `target` (optional): component, section, or page (e.g. `hero`, `#pricing`, `LandingNavbar`)

## Context gathering (mandatory)

Infer from the codebase when possible; ask only if a material constraint cannot be inferred:

- Audience and register (landing B2B vs clinical app)
- Brand personality (calm clinical vs playful)
- Existing motion language (CSS files, Framer, GSAP, etc.)
- Performance budget and target devices

**GUIAA defaults** (when in this repo):

- Landing: MOTION **5** — standard scroll/stagger; one focal moment over repeated reveals
- Clínica / operate: MOTION **4–5** — feedback and continuity only; no page-load choreography
- Tokens: `DESIGN.md` / `design-system/guiaa/MASTER.md` — do not invent accent colors for glow trails
- Never bounce/elastic on clinical UI

## Workflow

### 1. Find the job

Inspect existing motion, interaction states, and budget. Only animate where motion would:

- acknowledge an action;
- make a state or spatial relationship legible;
- preserve continuity through navigation/layout change;
- direct attention at a meaningful moment;
- embody the selected visual world.

Do **not** animate a static area merely because it exists.

### 2. Set the motion thesis (before coding)

Write a short plan:

- **Focal moment:** the one sequence that deserves authorship (if any)
- **Continuity:** state/layout/nav changes that need explanation
- **Feedback:** controls and outcomes that need acknowledgment
- **Budget:** which effects may be expensive and how often they run

A generic fade-and-rise, hover lift, parallax layer, or scroll reveal is **not** a thesis.

### 3. Choose material by meaning

Prefer `transform` + `opacity`. Choose properties for what they communicate:

| Intent | Techniques |
|--------|------------|
| Continuity / relationship | FLIP, view transitions, shared-element, deliberate spatial move |
| Focus / depth | bounded blur, shadow, light (isolated regions) |
| Reveal | masks, clip-path, controlled occlusion |
| Feedback | smallest change that makes cause → result clear |

One strong material idea beats stacked spectacle. Sibling stagger is OK for lists; cap total delay; do not re-stagger every scrolled section.

### 4. Timing and easing

| Duration | Use |
|----------|-----|
| 100–150 ms | instant feedback (press, toggle) |
| 150–300 ms | routine state (hover, menu) |
| 300–500 ms | layout, overlay, view transition |
| 500–800 ms | authored focal entrance only |

Exit ~75% of enter duration. Prefer:

```css
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
```

**Never** use bounce or elastic by default.

### 5. Implement to the runtime

- CSS transitions/keyframes for declarative state
- WAAPI or the project’s existing motion lib for sequencing
- View Transitions when continuity across states is the point
- Scroll-driven only when scroll itself carries meaning + fallback
- Do **not** add a dependency the stack can already express
- Keep content visible in the default state (no JS-hidden hero)
- Avoid animating `width` / `height` / `top` / `left` / margins — use transform or FLIP
- `will-change` only during known animation windows

### 6. Accessibility (mandatory)

Every web animation needs a `prefers-reduced-motion` path:

- Reduce or remove spatial movement
- Keep opacity/color/state feedback that confirms actions
- Stop nonessential loops when offscreen/hidden
- Do not block interaction unless intentional

```css
@media (prefers-reduced-motion: reduce) {
  .your-motion-class {
    animation: none;
    transition: none;
    transform: none;
  }
}
```

Prefer scoped selectors over global `*` overrides that break intentional micro-feedback.

## Critical don'ts

- Bounce / elastic easing by reflex
- Layout-property animation without FLIP
- Feedback durations > 500 ms
- Animating everything / decoration-only motion
- Ignoring `prefers-reduced-motion`
- Blocking interaction during cosmetic motion

## Categories (pick what the thesis needs)

**Entrance** — staggered reveals (100–150 ms delays), hero focal, modal entry  
**Micro-interactions** — button hover/press, focus, toggle 200–300 ms  
**State** — show/hide fade+slide, expand/collapse, loading → success  
**Navigation** — tab indicators, crossfades, carousel transforms  
**Delight** — only if the surface earned it (empty states, completion) — sparingly on clinical

## Verify before done

- [ ] Focal motion is specific to this product/surface
- [ ] Supporting motion explains feedback, state, or relationship
- [ ] Interruption and repeated use behave correctly
- [ ] Desktop, mobile, keyboard usable
- [ ] `prefers-reduced-motion` path reduces movement without erasing feedback
- [ ] Smooth on target devices; expensive effects bounded
- [ ] Removing an animation would lose meaning, not just decoration

When motion earns its place, optionally hand off to polish (`/impeccable polish` or project polish skill).

## Example invocations

```text
/animate
/animate target="hero"
/animate target="#pricing"
Animate the landing CTA buttons with purposeful feedback
```
