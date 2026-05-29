---
component: AsymmetricHero
oneLiner: 7/5 column hero with intentional vertical offset and three layout variants
status: stable
tags: [section]
---

## Purpose

Editorial hero with a deliberate 7/5 column split and a small vertical offset on the media column to break the grid. Comes in three variants: image-right (default), image-left, and fullbleed (text overlay with gradient scrim). Used for landing-style heroes and for character on error pages (404/500).

## When to use

- Top-of-page hero on landing pages where a single image carries the brand mood.
- 404 / 500 / other state pages — the asymmetry signals "something more deliberate than a system error".
- Any spot where a centered hero would feel too symmetrical for the brand voice.

## When NOT to use

- Blog post / case study / event hero — those have their own dark-surface hero patterns inside `BlogPost`, `CaseStudyDetail`, `EventDetail`.
- Sub-page hero where the content is mostly text — use `<Section tone="dark">` with a `text-display` heading directly.
- When you need a multi-column information layout — use `MagazineGrid` or `SplitFeature` instead.

## Props

Consumes `AsymmetricHeroProps` from `~/types/sections` (extends `SectionProps`).

| Prop            | Type                                                 | Required | Default     | Notes                                                                               |
| --------------- | ---------------------------------------------------- | -------- | ----------- | ----------------------------------------------------------------------------------- |
| `eyebrow`       | `string`                                             | no       | —           | Uppercase tracked label rendered above the headline in accent color.                |
| `headline`      | `string`                                             | yes      | —           | Rendered as `<h1>` with `text-display`.                                             |
| `lede`          | `string`                                             | no       | —           | Optional body paragraph capped at 40rem.                                            |
| `cta`           | `{ label: string; href: string }`                    | no       | —           | Renders a `<Button variant="primary">`; tone flips to `on-dark` for dark/fullbleed. |
| `image`         | `ImageMetadata`                                      | yes      | —           | Eager-loaded hero image.                                                            |
| `imageAlt`      | `string`                                             | yes      | —           | Alt text. ESLint `jsx-a11y/alt-text` is an error.                                   |
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

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **Fullbleed image escapes `<Section>` padding** via negative `inset` equal to `--space-section-lg`. If you change the section's `padding` to `sm` or `md`, the fullbleed image's escape distance will not match and you'll see a gap. Stick with `padding="lg"` (the default) for fullbleed.
- **Button tone is auto-resolved** from `tone === "dark" || fullbleed` — don't pass a `tone` to a child Button; this section owns it.
- **Vertical offset on desktop** uses `margin-block-start: 2rem` on the media column to create the asymmetric feel; this only kicks in at ≥ 768px.
