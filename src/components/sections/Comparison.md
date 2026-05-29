---
component: Comparison
oneLiner: Responsive comparison table — semantic table on desktop, stacked cards on mobile
status: stable
tags: [section]
---

## Purpose

Renders a feature-vs-column comparison matrix two ways at once: a semantic `<table>` for desktop (≥ 768px) and a flex column of per-column cards for mobile. Both views render in the DOM and are toggled with CSS, so search engines and assistive tech see the table semantics. Migrated from `src/components/ComparisonTable.astro` to the section archetype — now wraps in `<Section>` and consumes `ComparisonProps` from `~/types/sections`.

## When to use

- Plan / package comparisons on pricing or services pages.
- Feature matrices that contrast offerings (e.g., DIY vs. Pro vs. Enterprise).
- "Why us" pages contrasting your approach against alternatives.

## When NOT to use

- Single-column feature lists — use plain `<ul>` or `SplitFeature`.
- Comparison data with more than ~5 columns — the desktop table compresses too tightly to read.
- When cells need rich content (images, CTAs) — `values` are limited to `boolean | string`; richer content needs a custom layout.

## Props

Consumes `ComparisonProps` from `~/types/sections` (extends `SectionProps`).

| Prop       | Type                                                 | Required | Default     | Notes                                                                                                        |
| ---------- | ---------------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `eyebrow`  | `string`                                             | no       | —           | Uppercase tracked label above the section heading.                                                           |
| `headline` | `string`                                             | no       | —           | Section `<h2>` inside the optional header block.                                                             |
| `lede`     | `string`                                             | no       | —           | Body paragraph under the headline.                                                                           |
| `columns`  | `ComparisonColumn[]`                                 | yes      | —           | Each column: `{ name: string; highlight?: boolean }`. Highlight tints the column with accent.                |
| `rows`     | `ComparisonRow[]`                                    | yes      | —           | Each row: `{ feature: string; values: (boolean \| string)[] }`. `values.length` must match `columns.length`. |
| `lang`     | `"de" \| "en"`                                       | no       | `"de"`      | Drives screen-reader labels for the Check/X icons via `t("comparison.*")`.                                   |
| `align`    | `"start" \| "center"`                                | no       | `"start"`   | Aligns the header block only.                                                                                |
| `tone`     | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Passed to `<Section>`.                                                                                       |
| `padding`  | `"sm" \| "md" \| "lg"`                               | no       | `"md"`      | Passed to `<Section>`.                                                                                       |

## Example

```astro
---
import Comparison from "~/components/sections/Comparison.astro";
---

<Comparison
  headline="Welches Paket passt?"
  columns={[
    { name: "Starter" },
    { name: "Pro", highlight: true },
    { name: "Enterprise" },
  ]}
  rows={[
    { feature: "Landingpage", values: [true, true, true] },
    { feature: "Blog & SEO", values: [false, true, true] },
    { feature: "Beratung", values: ["—", "2h / Monat", "Unbegrenzt"] },
  ]}
  lang="de"
/>
```

## i18n keys

The component calls `useTranslations(lang)` for screen-reader-only labels on the boolean icons.

| Key                  | Used for                                              |
| -------------------- | ----------------------------------------------------- |
| `comparison.feature` | `aria-label` / `sr-only` for the first column header. |
| `comparison.yes`     | `aria-label` on the Check icon when value is `true`.  |
| `comparison.no`      | `aria-label` on the X icon when value is `false`.     |

Defined in both `src/i18n/de.json` and `src/i18n/en.json`. Adding the component to a new locale means adding the same three keys.

## Gotchas

- **`values.length` must equal `columns.length`** — there is no padding or warning if they differ; missing values render as `undefined` cells (visually empty).
- **Both views render in the DOM**; only display is toggled. SEO sees the table, screen readers prefer it on desktop. Don't try to skip one for "performance" — the duplication is small and the accessibility win is large.
- **Highlight uses `color-mix` with the accent token.** If you change `--color-accent`, the highlight tint follows automatically — no hex literals to chase.
- **Mobile cards repeat the feature label per row.** That's intentional: each card is its own scannable list and shouldn't depend on a header row.
