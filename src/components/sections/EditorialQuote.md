---
component: EditorialQuote
oneLiner: Display-sized pull-quote section with attribution and optional avatar
status: stable
tags: [section]
---

## Purpose

Single, focal pull-quote rendered at display scale with a giant opacity-15 quotation mark, a bottom rule, and an attribution block (name, optional role, optional avatar). The quote IS the section's focal text, so the inherited `SectionProps.headline` is loosened to optional via `Omit<SectionProps, "headline">`. Wraps in `<Section padding="lg" container="narrow">` internally.

## When to use

- Customer testimonials promoted to their own section between marketing blocks.
- Editorial pull-quotes in long-form pages where a paragraph deserves a pause.
- Manifesto-style statements that should stop the page.

## When NOT to use

- Inline quotes inside body prose — use a styled `<blockquote>` inside `<Prose>` instead.
- Lists of multiple testimonials — build a dedicated `TestimonialGrid`; one quote per section is the point.
- When the attribution has more than a name + role — the layout doesn't accommodate company logos, dates, or links cleanly.

## Props

Consumes `EditorialQuoteProps` from `~/types/sections` (extends `SectionFrameProps` — visual frame only; no `eyebrow`, `headline`, or `lede`).

| Prop          | Type                                                 | Required | Default     | Notes                                                                    |
| ------------- | ---------------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------ |
| `quote`       | `string`                                             | yes      | —           | Rendered as `<blockquote>` with `text-h1` size.                          |
| `attribution` | `EditorialQuoteAttribution`                          | yes      | —           | `{ name, role?, avatar?, avatarAlt? }`.                                  |
| `tone`        | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Passed to `<Section>`.                                                   |
| `padding`     | `"sm" \| "md" \| "lg"`                               | no       | `"lg"`      | Passed to `<Section>`.                                                   |
| `align`       | `"start" \| "center"`                                | no       | —           | Forwarded via `SectionFrameProps`; not currently consumed by the layout. |

`EditorialQuoteAttribution`: `{ name: string; role?: string; avatar?: ImageMetadata; avatarAlt?: string }`. Avatar renders only when both `avatar` and `avatarAlt` are present (alt-text guard).

## Example

```astro
---
import EditorialQuote from "~/components/sections/EditorialQuote.astro";
import portrait from "~/assets/quotes/anna.jpg";
---

<EditorialQuote
  quote="Sie haben nicht nur eine Website gebaut — sie haben unsere Arbeit verstanden und sichtbar gemacht."
  attribution={{
    name: "Anna Beck",
    role: "Geschäftsführerin, Beck & Söhne",
    avatar: portrait,
    avatarAlt: "Porträtfoto von Anna Beck",
  }}
  tone="accent-wash"
/>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **Type is `SectionFrameProps`, not `SectionProps`.** EditorialQuote intentionally does not carry `eyebrow`, `headline`, or `lede` — the quote IS the focal text. If you need a heading-led section that also includes a quote, compose `EditorialQuote` inside another archetype or page instead of overloading the type.
- **Avatar requires `avatarAlt`.** If you pass `avatar` without `avatarAlt`, the image is skipped — both must be present. This is the alt-text guard, not a bug.
- **Quote glyph is `\201C` (left double quote)** rendered via `::before` with opacity 0.15 and accent color. It scales to `--text-display` — on very narrow viewports it can crowd the quote text; consider tightening copy if you see overlap.
