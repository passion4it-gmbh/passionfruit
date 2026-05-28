---
component: TrustSection
oneLiner: Logo strip with grayscale-to-color hover reveal and optional eyebrow heading
status: stable
tags: [section]
---

## Purpose

Renders a horizontal strip of partner or client logos. Each logo is grayscale and semi-opaque at rest; hovering restores full color and opacity. An optional eyebrow label can precede the logo row. The section is self-bordered (`border-y border-border`) and padded (`py-16`) — it is designed to sit between other page sections without additional wrappers.

## When to use

Use on home pages, landing pages, or service pages to signal credibility via partner/client logos. Place it as a direct sibling of other page sections, not nested inside another bordered section.

## When NOT to use

Do not use for team member profiles — use `TeamCard` instead. Do not use when logos must link to internal pages; the `href` prop always opens `target="_blank"`. Do not use when you need caption text under each logo — this component shows logos only.

## Props

| Prop      | Type                                                        | Required | Default | Notes                                                                      |
| --------- | ----------------------------------------------------------- | -------- | ------- | -------------------------------------------------------------------------- |
| `logos`   | `Array<{ src: ImageMetadata; alt: string; href?: string }>` | yes      | —       | Local image imports only. Pass meaningful `alt` — the logo name is enough. |
| `eyebrow` | `string`                                                    | no       | —       | Short label above the logo row (e.g., "Trusted by"). Sentence case.        |
| `class`   | `string`                                                    | no       | —       | Extra classes appended to the root `<section>`.                            |

## Example

```astro
---
import logoAcme from "~/assets/logos/acme.svg";
import logoWidget from "~/assets/logos/widget.png";
import TrustSection from "~/components/TrustSection.astro";
---

<TrustSection
  eyebrow="Trusted by"
  logos={[
    { src: logoAcme, alt: "Acme Corp", href: "https://acme.example.com" },
    { src: logoWidget, alt: "Widget GmbH" },
  ]}
/>
```

## i18n keys

None. The `eyebrow` string comes from the caller. There are no `t()` calls inside the component.

## Gotchas

- **Local images only.** The `src` field must be an `ImageMetadata` import (i.e., `import logo from "~/assets/..."`) — not a remote URL string. Remote URLs will cause an Astro build error.
- **Height is fixed at 40px.** Images are rendered via `<Image height={40} />`. Width is derived automatically from the source aspect ratio. Do not pass a `width` prop — it will conflict with the aspect-ratio calculation.
- **`href` flips alt text to `aria-label`.** When `href` is present, the `<a>` receives `aria-label={logo.alt}` and the `<Image>` gets `alt=""` (decorative role). When `href` is absent, `alt` goes directly on the image. Never pass an empty `alt` when `href` is absent.
- **The section already has `border-y` and `py-16`.** Do not wrap `TrustSection` in another `<section>` with the same treatment — the borders would double up.
- **`eyebrow` doubles as the `aria-label` on the logo list.** When eyebrow is absent the `<ul>` has no `aria-label`. Add an eyebrow when the logo list needs a visible heading for context.
- **Grayscale/color transition is CSS-only.** It uses `transition-all duration-300`. Honour `prefers-reduced-motion` by not adding additional CSS animations on top.
