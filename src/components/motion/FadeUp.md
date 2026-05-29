---
component: FadeUp
oneLiner: Sugar wrapper for the most common Motion preset — fade-up entrance
status: stable
tags: [motion]
---

## Purpose

Thin wrapper around `<Motion effect="fade-up">`. Exists because fade-up is the design system's default entrance effect and call sites read better as `<FadeUp>` than `<Motion effect="fade-up">`. All other `MotionProps` pass through unchanged.

## When to use

- The default reach when adding entrance motion — fade-up is the house style.
- Section reveals, card lists, hero copy entering on scroll.

## When NOT to use

- When you need a different effect — use `<Motion effect="fade" />`, `<FadeIn />`, or `<Motion effect="scale-in" />` directly.
- Content above the fold — see `Motion`'s "When NOT to use".

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
import FadeUp from "~/components/motion/FadeUp.astro";
---

<FadeUp>
  <h2>Wir bauen Software für Menschen.</h2>
</FadeUp>

<!-- Stagger a card grid by stepping the delay -->
{
  cards.map((card, i) => (
    <FadeUp delay={i * 80}>
      <Card {...card} />
    </FadeUp>
  ))
}
```

## i18n keys

_None — this component does not render user-facing strings._

## Gotchas

- **No `effect` prop.** It's hardcoded to `"fade-up"` and stripped from the type. Reach for `<Motion />` if you need other effects.
- **All gotchas from `Motion` apply here** — reduced motion, viewport-at-load flip, `astro:page-load` re-init.
