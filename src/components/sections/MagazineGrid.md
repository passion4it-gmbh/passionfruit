---
component: MagazineGrid
oneLiner: 12-column editorial cell grid with small/medium/large size variants
status: stable
tags: [section]
---

## Purpose

A 12-column grid of editorial cells with three size variants (small = 4 cols, medium = 6 cols, large = 8 cols). Cells with an `href` become full-bleed anchor links with a focus-visible ring; cells without remain plain `<div>`s. Designed for asymmetric "magazine cover" compositions that mix scale on a single row.

## When to use

- Featured content showcases where a hero cell and supporting cells should share a single grid.
- Mixed-media editorial collections — feature stories, theme blocks, "what's new" overviews.
- Landing-page content blocks where uniform card grids would feel flat.

## When NOT to use

- Uniform collection listings (blog index, events index) — use a standard `<BlogCard>` / `<EventCard>` grid with equal cells, not this.
- Single-row marketing CTAs with two or three balanced columns — `SplitFeature` reads more deliberately.
- When the order or sizing must respond to data (e.g., grid sizes from CMS) — fine in principle, but author the size mapping carefully; mixed sizes that don't fill the 12-col row leave whitespace.

## Props

Consumes `MagazineGridProps` from `~/types/sections` (extends `SectionProps`).

| Prop       | Type                                                 | Required | Default     | Notes                                                                  |
| ---------- | ---------------------------------------------------- | -------- | ----------- | ---------------------------------------------------------------------- |
| `eyebrow`  | `string`                                             | no       | —           | Uppercase tracked label above the section heading.                     |
| `headline` | `string`                                             | yes      | —           | Section `<h2>`; rendered only inside the optional header block.        |
| `lede`     | `string`                                             | no       | —           | Body paragraph under the headline.                                     |
| `cells`    | `MagazineGridCell[]`                                 | yes      | —           | Array of cells; each has `size`, `headline`, optional `image`, `href`. |
| `align`    | `"start" \| "center"`                                | no       | `"start"`   | Aligns the header block; the grid itself is unaffected.                |
| `tone`     | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Passed to `<Section>`.                                                 |
| `padding`  | `"sm" \| "md" \| "lg"`                               | no       | `"md"`      | Passed to `<Section>`.                                                 |

`MagazineGridCell` shape: `{ size: "small" | "medium" | "large"; headline: string; lede?: string; image?: ImageMetadata; imageAlt?: string; href?: string }`.

## Example

```astro
---
import MagazineGrid from "~/components/sections/MagazineGrid.astro";
import featureImg from "~/assets/magazine/feature.jpg";
import sideImg from "~/assets/magazine/side.jpg";
---

<MagazineGrid
  eyebrow="Editorial"
  headline="Aus unserer Werkstatt"
  cells={[
    {
      size: "large",
      headline: "Wie wir die Reichweite eines Magazins verdoppelt haben",
      lede: "Eine Geschichte über Inhalte, die wirklich bewegen.",
      image: featureImg,
      imageAlt: "Magazin auf einem Tisch mit Kaffeetasse",
      href: "/magazin/reichweite-verdoppelt",
    },
    {
      size: "small",
      headline: "Drei kleine Editoren-Notizen",
      image: sideImg,
      imageAlt: "Notizbuch mit Stift",
    },
  ]}
/>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **Cell sizes don't auto-balance.** If your sizes don't sum to 12 across a row (e.g., one `large` + one `small` = 12; one `medium` + one `medium` = 12), expect uneven rows. Plan the layout up front.
- **Large cells get an `<h2>`, small/medium an `<h3>`.** Mind heading order — if a page already has an `<h2>` higher up, a `large` cell inside will still render `<h2>`; that's correct for hierarchy.
- **Linked cells use the entire cell as the anchor.** A second focusable element inside (e.g., a CTA button) would nest interactive elements — keep cells single-action.
- **Headline-less alts.** When a cell has `image` but no `imageAlt`, alt resolves to `""` (decorative). Pass `imageAlt` whenever the image carries meaning.
