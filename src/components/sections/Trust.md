---
component: Trust
oneLiner: Logo strip with grayscale-to-color hover reveal and optional eyebrow heading
status: stable
tags: [section]
---

## Purpose

A horizontal logo strip used to surface client trust marks, press mentions, or technology partners. Logos render desaturated at 50% opacity by default and animate to full color on hover (or focus, when wrapped in a link). Migrated from `src/components/TrustSection.astro` to the section archetype — now wraps in `<Section>` and consumes `TrustProps` from `~/types/sections`.

## When to use

- "Trusted by" / "Featured in" bands on landing pages.
- Technology partner strips on services pages.
- Press mentions on about / company pages.

## When NOT to use

- When logo recognition is the goal — full-color always-on logos read more clearly; consider a custom grid.
- For testimonials with copy — use `EditorialQuote` or a dedicated testimonial section.
- More than ~8 logos per row — wraps inelegantly on midsize viewports.

## Props

Consumes `TrustProps` from `~/types/sections` (extends `SectionProps`).

| Prop       | Type                                                 | Required | Default     | Notes                                                                             |
| ---------- | ---------------------------------------------------- | -------- | ----------- | --------------------------------------------------------------------------------- |
| `eyebrow`  | `string`                                             | no       | —           | Uppercase tracked label above the logo strip. Also used as fallback `aria-label`. |
| `headline` | `string`                                             | no       | —           | `<h2>` inside the header block. Optional — many trust strips have eyebrow only.   |
| `lede`     | `string`                                             | no       | —           | Body paragraph under the headline.                                                |
| `logos`    | `TrustLogo[]`                                        | yes      | —           | Each logo: `{ src: ImageMetadata; alt: string; href?: string }`.                  |
| `align`    | `"start" \| "center"`                                | no       | `"center"`  | Center is the default — most trust strips read better centered.                   |
| `tone`     | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Passed to `<Section>`.                                                            |
| `padding`  | `"sm" \| "md" \| "lg"`                               | no       | `"md"`      | Passed to `<Section>`.                                                            |

## Example

```astro
---
import Trust from "~/components/sections/Trust.astro";
import betaCorp from "~/assets/logos/betacorp.svg";
import gammaInc from "~/assets/logos/gamma.svg";
---

<Trust
  eyebrow="Vertraut von"
  logos={[
    { src: betaCorp, alt: "BetaCorp", href: "https://betacorp.example" },
    { src: gammaInc, alt: "Gamma Inc." },
  ]}
/>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **Linked logos use `aria-label={logo.alt}` on the `<a>` and `alt=""` on the `<Image>`** to avoid the screen reader double-announcing the brand. Unlinked logos use the alt directly. Pass meaningful `alt` text in both cases.
- **`opacity: 0.5` + `filter: grayscale(100%)` is the resting state.** Strong-color logos can still feel loud — pre-process logos to a single color silhouette for the cleanest read.
- **`role="list"`** is set explicitly on the `<ul>` because Safari removes implicit list semantics when `list-style: none` is applied.
- **Height is fixed at 2.5rem.** Pass logos with adequate horizontal padding in their artwork so the strip rhythm reads evenly.
