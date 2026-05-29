---
component: Motion
oneLiner: IntersectionObserver-driven entrance animation with reduced-motion guard
status: stable
tags: [motion, primitive]
---

## Purpose

Wraps any block of content so it animates in when it enters the viewport. An `IntersectionObserver` toggles `data-motion-visible="true"` once the configured threshold is met; CSS attribute selectors in `src/styles/motion.css` drive the actual transition based on the chosen effect. Re-initializes on `astro:page-load` so view transitions don't strand elements pre-animation. Reduced motion skips the observer entirely — CSS handles the "target state immediately" fallback.

## When to use

- Section reveals on long marketing pages where entrance motion adds a sense of pace.
- One-off cards, callouts, or media inside otherwise static content.
- When you need a custom effect that the `FadeUp` / `FadeIn` sugar wrappers don't cover (e.g., `fade-down`, `scale-in`).

## When NOT to use

- Content above the fold that the user sees immediately — motion on initial paint feels janky. The component does flip `data-motion-visible` on init for already-visible elements, but you'd still pay the observer setup cost; just render statically.
- Critical UI affordances (nav, CTAs in viewport) — they should be visible without waiting for an animation frame.
- Inside `<Prose>` — Markdown bodies should breathe at their own rhythm; animating mid-paragraph reads as nervous.

## Props

Consumes `MotionProps` from `~/types/motion`.

| Prop        | Type                                               | Required | Default     | Notes                                                                 |
| ----------- | -------------------------------------------------- | -------- | ----------- | --------------------------------------------------------------------- |
| `effect`    | `"fade" \| "fade-up" \| "fade-down" \| "scale-in"` | no       | `"fade-up"` | Visual entrance effect.                                               |
| `delay`     | `number`                                           | no       | `0`         | Inline `transition-delay` in milliseconds. Zero stays attribute-free. |
| `duration`  | `"instant" \| "quick" \| "base" \| "slow"`         | no       | `"base"`    | Maps to a CSS duration token via attribute selector.                  |
| `threshold` | `number`                                           | no       | `0.15`      | IntersectionObserver threshold (0–1). Clamped to a valid range.       |
| `once`      | `boolean`                                          | no       | `true`      | When false, re-animates each time the element re-enters the viewport. |

## Example

```astro
---
import Motion from "~/components/motion/Motion.astro";
---

<!-- Fade-up section reveal with default settings -->
<Motion>
  <p>Diese Karte fadet von unten ein.</p>
</Motion>

<!-- Scale-in with custom delay -->
<Motion effect="scale-in" delay={120} duration="quick">
  <img src="/hero.jpg" alt="" />
</Motion>

<!-- Re-animate on every entry, low threshold -->
<Motion effect="fade-down" once={false} threshold={0.05}>
  <span class="badge">Neu</span>
</Motion>
```

## i18n keys

_None — this component does not render user-facing strings._

## Gotchas

- **Reduced motion skips the observer entirely.** CSS in `motion.css` keeps every `[data-motion-effect]` at the target state when `prefers-reduced-motion: reduce`. Don't rely on JS observers in tests under reduced motion — they won't run.
- **Elements already in viewport at load flip immediately.** No animation plays — the test runs `getBoundingClientRect` against `window.innerHeight * (1 - threshold)`. This prevents a "pop-in on first scroll" feel.
- **Initialization re-runs on `astro:page-load`.** Without this, view transitions strand elements at their initial (invisible) state. If you write a custom motion adapter, mirror this pattern.
- **The selector `[data-motion-effect]:not([data-motion-visible])`** avoids re-observing elements that already flipped. Don't manually remove `data-motion-visible` from a `once` element expecting it to re-init — it won't be picked up.
- **`delay` is inlined as `transition-delay` only when > 0.** A zero delay leaves the `style` attribute absent on the rendered element.
