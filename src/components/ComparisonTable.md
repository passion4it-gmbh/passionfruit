---
component: ComparisonTable
oneLiner: Responsive comparison grid — semantic table on desktop, stacked cards on mobile
status: stable
tags: [section]
---

## Purpose

Renders a two-or-three-column feature comparison grid (e.g., "Us vs. Them" or "Free vs. Pro vs. Enterprise"). On desktop it renders as a semantic `<table>` with a feature column on the left and one column per plan/option. On mobile the table collapses into per-column stacked cards so no horizontal scrolling is required. Boolean row values render as Check/X icons; string values render as plain text.

## When to use

Use on pricing pages, service comparison sections, or any context where readers need to evaluate multiple options side by side. Supply the `columns` and `rows` data from the caller — no content lives inside the component.

## When NOT to use

Do not use for tables with more than four or five columns — the mobile card layout becomes unwieldy. Do not use as a data table for tabular records (use a plain `<table>` instead). Do not use when rows need rich content beyond plain strings.

## Props

| Prop      | Type                                                        | Required | Default | Notes                                                                                            |
| --------- | ----------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------ |
| `columns` | `Array<{ name: string; highlight?: boolean }>`              | yes      | —       | Column headers. Set `highlight: true` on the column to visually call out.                        |
| `rows`    | `Array<{ feature: string; values: (boolean \| string)[] }>` | yes      | —       | `values` must have the same length as `columns`. `boolean` renders icons; `string` renders text. |
| `lang`    | `Locale`                                                    | no       | `"de"`  | Drives screen-reader labels for Check/X icons (`comparison.yes` / `comparison.no`).              |
| `class`   | `string`                                                    | no       | —       | Extra classes on the root `<div>`.                                                               |

## Example

```astro
---
import ComparisonTable from "~/components/ComparisonTable.astro";
---

<ComparisonTable
  lang={lang}
  columns={[
    { name: "Basis" },
    { name: "Pro", highlight: true },
    { name: "Konkurrenz" },
  ]}
  rows={[
    { feature: "SSL-Zertifikat", values: [true, true, true] },
    { feature: "Eigene Domain", values: [false, true, true] },
    { feature: "Support", values: ["E-Mail", "24/7", "E-Mail"] },
    { feature: "Speicher", values: ["1 GB", "50 GB", "10 GB"] },
  ]}
/>
```

## i18n keys

Feature and value strings come entirely from the caller. The only template-owned keys are:

| Key                  | DE      | EN      |
| -------------------- | ------- | ------- |
| `comparison.feature` | Merkmal | Feature |
| `comparison.yes`     | Ja      | Yes     |
| `comparison.no`      | Nein    | No      |

`comparison.feature` is rendered as a screen-reader-only label on the feature column header. `comparison.yes` / `comparison.no` are `aria-label` values on icon spans.

## Gotchas

- **`values` array length must match `columns` length.** There is no runtime guard — a length mismatch will silently render undefined values as empty cells. Validate data at the caller.
- **`highlight` column styling.** A highlighted column gets `bg-accent/5` cells and `ring-1 ring-inset ring-accent/20` borders on both desktop and mobile. Only one column should be highlighted at a time for clear visual hierarchy.
- **Boolean `true` → `<Check>` in `text-accent`; `false` → `<X>` in `text-muted`.** String values render as `text-sm text-text` (desktop) or `text-sm text-muted text-right` (mobile).
- **Responsive breakpoint is `md` (768px).** The desktop table is `hidden md:block`; the mobile cards are `md:hidden`. There is no intermediate view.
- **No i18n for content.** All `feature` strings and `column.name` strings must be provided in the correct locale by the caller.
- **`lang` defaults to `"de"`.** Always pass `lang` explicitly when the surrounding page is locale-aware to ensure correct screen-reader labels.
