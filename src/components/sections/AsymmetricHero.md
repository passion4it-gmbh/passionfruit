---
component: AsymmetricHero
oneLiner: Page hero — 7/5 image split, fullbleed, or text-only headline/lede split
status: stable
tags: [section]
---

## Purpose

Editorial hero with a deliberate 7/5 column split and a small vertical offset on the media column to break the grid. Comes in four variants: image-right (default), image-left, fullbleed (text overlay with gradient scrim), and text-only (no `image`: headline left, lede and CTAs right, sharing a baseline). It is the hero for every top-level page — home, services, about, contact, all collection indexes — and for 404/500.

## When to use

- Top-of-page hero on any top-level page. Use `tone="dark"` with `headerVariant="on-dark"` on `BaseLayout`.
- Text-only page heroes (indexes): omit `image`.
- 404 / 500 / other state pages — the asymmetry signals "something more deliberate than a system error".
- Any spot where a centered hero would feel too symmetrical for the brand voice.

## When NOT to use

- Blog post / case study / event hero — those have their own dark-surface hero patterns inside `BlogPost`, `CaseStudyDetail`, `EventDetail`.
- When you need a multi-column information layout — use `MagazineGrid` or `SplitFeature` instead.

## Props

Consumes `AsymmetricHeroProps` from `~/types/sections` (extends `SectionProps`).

| Prop            | Type                                                 | Required | Default     | Notes                                                                               |
| --------------- | ---------------------------------------------------- | -------- | ----------- | ----------------------------------------------------------------------------------- |
| `eyebrow`       | `string`                                             | no       | —           | Uppercase tracked label rendered above the headline in accent color.                |
| `headline`      | `string`                                             | yes      | —           | Rendered as `<h1>` with `text-display`.                                             |
| `lede`          | `string`                                             | no       | —           | Optional body paragraph capped at 40rem.                                            |
| `cta`           | `{ label: string; href: string }`                    | no       | —           | Renders a `<Button variant="primary">`; tone flips to `on-dark` for dark/fullbleed. |
| `secondaryCta`  | `{ label: string; href: string }`                    | no       | —           | Secondary button next to `cta`. Only rendered when `cta` is set.                    |
| `image`         | `ImageMetadata`                                      | no       | —           | Eager-loaded hero image. Omit for the text-only layout.                             |
| `imageAlt`      | `string`                                             | no       | `""`        | Defaults to decorative. Pass real alt text when the image carries information.      |
| `imagePosition` | `"right" \| "left" \| "fullbleed"`                   | no       | `"right"`   | Layout variant.                                                                     |
| `tone`          | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Passes through to underlying `<Section>`.                                           |
| `padding`       | `"sm" \| "md" \| "lg"`                               | no       | `"lg"`      | Hero-default override on `<Section>`.                                               |

## Example

```astro
---
import AsymmetricHero from "~/components/sections/AsymmetricHero.astro";
import heroImage from "~/assets/hero/landing.jpg";
---

<AsymmetricHero
  eyebrow="Werkstatt für digitale Produkte"
  headline="Wir bauen Software, die Menschen wirklich nutzen."
  lede="Strategie, Design und Entwicklung aus einer Hand — von der ersten Skizze bis zum Live-Release."
  cta={{ label: "Projekt anfragen", href: "/kontakt" }}
  image={heroImage}
  imageAlt="Designerin am Whiteboard mit Skizzen"
  imagePosition="right"
  tone="surface"
/>
```

Override the headline markup (e.g. to highlight a word) with the `headline` slot:

```astro
<AsymmetricHero tone="dark" headline={title}>
  <Fragment slot="headline"
    >Digital solutions with <span class="gradient-text">passion</span></Fragment
  >
</AsymmetricHero>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **Fullbleed image escapes `<Section>` padding** via negative `inset` equal to `--space-section-lg`. If you change the section's `padding` to `sm` or `md`, the fullbleed image's escape distance will not match and you'll see a gap. Stick with `padding="lg"` (the default) for fullbleed.
- **Button tone is auto-resolved** from `tone === "dark" || fullbleed` — don't pass a `tone` to a child Button; this section owns it.
- **Vertical offset on desktop** uses `margin-block-start: 2rem` on the media column to create the asymmetric feel; this only kicks in at ≥ 768px. The text-only headline/lede split starts at ≥ 1024px; below that the lede stacks under the headline.
- **Long single words hyphenate** (`hyphens: auto`, language from `html[lang]`), so a German index title like „Veranstaltungen“ breaks instead of clipping on phones.
- **`tone="dark"` adds the hero glow** (accent and warm radial light pools) via a `::before` on the section. Other tones stay flat.
- **Under an on-dark header** the layout adds the header height to the first section's top padding (`main[data-under-header]` in `global.css`), so don't add extra top spacing yourself.
- **Text and media enter with `.hero-stagger`** (time-based, not scroll-based); reduced motion shows them immediately.
