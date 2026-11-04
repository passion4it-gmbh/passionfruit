---
component: FeatureList
oneLiner: Numbered editorial rows (index, title, body, checklist) split by hairlines
status: stable
tags: [section]
---

## Purpose

Presents a short list of offerings (services, packages, process steps) as full-width numbered rows: a large `01`/`02`/`03` index, the title, then the body and an optional two-column checklist. Typography and hairlines carry the layout, so it needs no images or icon tiles — which is exactly what a fresh site usually lacks.

## When to use

- Services or offerings on the home page and the services page.
- Any 3–6 item list where each item deserves a sentence and a few bullet points.
- When you have no imagery for the items. With good images, prefer `SplitFeature`.

## When NOT to use

- Collection entries (posts, case studies, team) — use their per-type cards.
- More than ~6 items: the rows get long; use a card grid or `MagazineGrid`.
- Side-by-side feature comparison — use `Comparison`.

## Props

Consumes `FeatureListProps` from `~/types/sections` (extends `SectionProps`).

| Prop       | Type                                                 | Required | Default     | Notes                                                |
| ---------- | ---------------------------------------------------- | -------- | ----------- | ---------------------------------------------------- |
| `eyebrow`  | `string`                                             | no       | —           | Uppercase label above the headline.                  |
| `headline` | `string`                                             | yes      | —           | Section `<h2>` in `text-h1`.                         |
| `lede`     | `string`                                             | no       | —           | Muted intro paragraph.                               |
| `items`    | `FeatureListItem[]`                                  | yes      | —           | `{ title, body, bullets? }`. Numbered in order.      |
| `cta`      | `{ label: string; href: string }`                    | no       | —           | Ghost button under the list, e.g. "All services".    |
| `tone`     | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Passes through to `<Section>`.                       |
| `padding`  | `"sm" \| "md" \| "lg"`                               | no       | `"lg"`      | Passes through to `<Section>`.                       |
| `align`    | `"start" \| "center"`                                | no       | `"start"`   | Header alignment only; rows are always left-aligned. |

## Example

```astro
---
import FeatureList from "~/components/sections/FeatureList.astro";
import { getServices } from "~/data/services";
---

<FeatureList
  eyebrow="Leistungen"
  headline="Was wir bieten"
  items={getServices("de")}
  cta={{ label: "Alle Leistungen", href: "/leistungen/" }}
/>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **Numbers are decorative** (`aria-hidden`); the `<ol>` already conveys order to assistive tech.
- **Each row fades in via `<Motion>`** with an 80ms stagger. Reduced motion renders them immediately.
- **On `tone="dark"`** the index and check icons switch to `--color-accent-glow`; everything else follows the dark-tone token remap in `<Section>`.
