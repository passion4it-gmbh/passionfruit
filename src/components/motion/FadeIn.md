---
component: FadeIn
oneLiner: Sugar wrapper for the simplest Motion preset — pure opacity fade-in
status: stable
tags: [motion]
---

## Purpose

Thin wrapper around `<Motion effect="fade">`. Use it when fade-up's vertical motion is too active for the moment — a hover-revealed detail, a calm cross-fade, a logo strip. All other `MotionProps` pass through unchanged.

## When to use

- Content where vertical motion would feel distracting (logos, gallery thumbnails, decorative imagery).
- Calmer reveals where you want the user to barely notice the entrance.

## When NOT to use

- The default section / card entrance — `FadeUp` is the house style.
- Above-the-fold content — see `Motion`'s "When NOT to use".

## Props

Consumes `Omit<MotionProps, "effect">` from `~/types/motion`. Same shape as `Motion`, minus `effect`.

| Prop        | Type                                       | Required | Default  | Notes                                          |
| ----------- | ------------------------------------------ | -------- | -------- | ---------------------------------------------- |
| `delay`     | `number`                                   | no       | `0`      | Pass-through; inline `transition-delay` in ms. |
| `duration`  | `"instant" \| "quick" \| "base" \| "slow"` | no       | `"base"` | Pass-through.                                  |
| `threshold` | `number`                                   | no       | `0.15`   | Pass-through.                                  |
| `once`      | `boolean`                                  | no       | `true`   | Pass-through.                                  |

## Example

```astro
---
import FadeIn from "~/components/motion/FadeIn.astro";
---

<FadeIn>
  <img src="/partner-logo.svg" alt="Partner Logo" />
</FadeIn>

<!-- Calmer reveal for a decorative caption -->
<FadeIn duration="slow">
  <p class="caption">Foto: Anna Beck</p>
</FadeIn>
```

## i18n keys

_None — this component does not render user-facing strings._

## Gotchas

- **No `effect` prop.** It's hardcoded to `"fade"` and stripped from the type. Reach for `<Motion />` if you need other effects.
- **All gotchas from `Motion` apply here** — reduced motion, viewport-at-load flip, `astro:page-load` re-init.
