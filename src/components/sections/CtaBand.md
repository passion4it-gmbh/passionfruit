---
component: CtaBand
oneLiner: Closing call-to-action band — display headline, short lede, one primary button
status: stable
tags: [section]
---

## Purpose

The single, centred "next step" at the bottom of a page: a display-sized question, one line of support copy, one primary button. On the default dark tone a soft accent light pool sits behind the headline so the eye lands on the ask.

## When to use

- As the last section before the footer on marketing pages (home, services, about).
- Anywhere a page should end in exactly one action.

## When NOT to use

- Mid-page — one CTA band per page; inline CTAs belong in the section they relate to.
- When you need two equal actions — use the hero's `cta` + `secondaryCta` instead.
- Forms or newsletter sign-ups — those need their own component.

## Props

Consumes `CtaBandProps` from `~/types/sections` (extends `SectionFrameProps`).

| Prop       | Type                                                 | Required | Default  | Notes                                    |
| ---------- | ---------------------------------------------------- | -------- | -------- | ---------------------------------------- |
| `headline` | `string`                                             | yes      | —        | `<h2>` in `text-display`, balanced wrap. |
| `lede`     | `string`                                             | no       | —        | Muted support line, capped at 36rem.     |
| `cta`      | `{ label: string; href: string }`                    | yes      | —        | Primary button with arrow.               |
| `tone`     | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"dark"` | The glow only renders on `dark`.         |
| `padding`  | `"sm" \| "md" \| "lg"`                               | no       | `"lg"`   | Passes through to `<Section>`.           |

## Example

```astro
---
import CtaBand from "~/components/sections/CtaBand.astro";
---

<CtaBand
  headline="Bereit für den nächsten Schritt?"
  lede="Lassen Sie uns gemeinsam Ihre digitale Zukunft gestalten."
  cta={{ label: "Kontakt aufnehmen", href: "/kontakt/" }}
/>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **Dark by default.** It usually sits directly above the dark footer; the light pool and generous padding keep the two from merging into one block.
- **Entrance is `<Motion effect="scale-in" duration="slow">`**, skipped under reduced motion.
