---
component: SplitFeature
oneLiner: Alternating image-and-text rows with auto-flipped layout on even children
status: stable
tags: [section]
---

## Purpose

A vertical list of feature rows, each splitting image and copy 6/6 on desktop. Even-indexed rows flip via `:nth-child(even)` so the visual rhythm alternates left/right without prop juggling. Optional per-row ghost-button CTA. Vertical gap between rows comes from `var(--space-section-md)`.

## When to use

- Product / service feature lists where each item benefits from supporting imagery.
- "How it works" walkthroughs with three to six steps.
- Marketing pages where alternating reads more deliberate than uniform cards.

## When NOT to use

- More than ~six rows — the alternation becomes monotonous; switch to `MagazineGrid` or a card grid.
- Rows without supporting imagery — the layout assumes an image; missing visuals leave a hole.
- When you need different CTAs per row in different styles — all CTAs render as `Button variant="ghost"`; mixed variants need a different component.

## Props

Consumes `SplitFeatureProps` from `~/types/sections` (extends `SectionProps`).

| Prop       | Type                                                 | Required | Default     | Notes                                                    |
| ---------- | ---------------------------------------------------- | -------- | ----------- | -------------------------------------------------------- |
| `eyebrow`  | `string`                                             | no       | —           | Uppercase tracked label above the section heading.       |
| `headline` | `string`                                             | yes      | —           | Section `<h2>` in the optional header block.             |
| `lede`     | `string`                                             | no       | —           | Body paragraph under the headline.                       |
| `features` | `SplitFeatureItem[]`                                 | yes      | —           | Each item: `{ headline, body, image, imageAlt, cta? }`.  |
| `align`    | `"start" \| "center"`                                | no       | `"start"`   | Aligns the header block only; rows alternate regardless. |
| `tone`     | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Passed to `<Section>`; drives child button tone.         |
| `padding`  | `"sm" \| "md" \| "lg"`                               | no       | `"lg"`      | Passed to `<Section>`.                                   |

## Example

```astro
---
import SplitFeature from "~/components/sections/SplitFeature.astro";
import discoveryImg from "~/assets/features/discovery.jpg";
import designImg from "~/assets/features/design.jpg";
---

<SplitFeature
  eyebrow="So arbeiten wir"
  headline="Drei Phasen, ein Ergebnis"
  features={[
    {
      headline: "Discovery",
      body: "Wir starten mit Zuhören. Eine Woche, in der wir Annahmen prüfen und Klarheit schaffen.",
      image: discoveryImg,
      imageAlt: "Workshop-Skizzen auf einem Whiteboard",
      cta: { label: "Mehr zur Discovery", href: "/leistungen/discovery" },
    },
    {
      headline: "Design",
      body: "Aus Erkenntnissen werden Oberflächen, die sich richtig anfühlen.",
      image: designImg,
      imageAlt: "Designerin bei der Arbeit am Laptop",
    },
  ]}
/>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **Alternation is index-based** via `:nth-child(even)` on `.pf-split__row`. Re-ordering features at runtime (e.g., from a filter) re-flips the alternation — usually fine, occasionally surprising.
- **Button tone is auto-resolved** from the section's `tone`. Don't pass a `tone` inside the feature `cta`; this section owns it.
- **Each row is an `<li>` inside an `<ol>`.** Use `ol` semantics intentionally — these are ordered steps. If your features are unordered, this is a small semantic mismatch you can live with, or fork the component.
