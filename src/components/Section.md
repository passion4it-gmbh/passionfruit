---
component: Section
oneLiner: Frame primitive wrapping section archetypes with tone, padding, container
status: stable
tags: [primitive, section]
---

## Purpose

The single source of tone (background + text color), vertical padding, max-width container, and root tag for every page section. Every archetype in `src/components/sections/` composes on top of `<Section>`; pages compose on top of those archetypes. Centralising these decisions here keeps section spacing rhythm uniform and hex literals out of components.

## When to use

- As the outermost element of every new section archetype (`AsymmetricHero`, `MagazineGrid`, `StickyStory`, etc.).
- When migrating an older bespoke section to the design-floor stack — wrap it in `<Section>` and remove ad-hoc background/padding utilities.

## When NOT to use

- **Directly on pages.** Pages should compose archetypes (which already wrap themselves in `<Section>`), not raw sections. Reaching for `<Section>` on a page is a hint that the archetype is missing.
- For inline content blocks inside another section — use plain `<div>` or a content-specific component.
- As a card or tile wrapper — `Section` is page-level. Cards have their own components.

## Props

| Prop        | Type                                                 | Required | Default     | Notes                                                                                         |
| ----------- | ---------------------------------------------------- | -------- | ----------- | --------------------------------------------------------------------------------------------- |
| `tone`      | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Drives background + text color via `data-tone` attribute. `accent-wash` is an 8% accent tint. |
| `padding`   | `"sm" \| "md" \| "lg"`                               | no       | `"md"`      | Vertical padding via `var(--space-section-{padding})` tokens.                                 |
| `container` | `"narrow" \| "default" \| "wide" \| "full"`          | no       | `"default"` | Inner max-width: 48rem / 76rem (.container) / 88rem / none.                                   |
| `as`        | `"section" \| "article" \| "aside" \| "div"`         | no       | `"section"` | Root tag. Pick `article` when the section is the page's primary content body.                 |
| `class`     | `string`                                             | no       | —           | Extra classes on the root element.                                                            |

Horizontal padding comes from `.container` (1.25rem / 1.5rem / 2.5rem at the sm and lg breakpoints).

## Example

```astro
---
import Section from "~/components/Section.astro";
---

<!-- Default surface, default container -->
<Section>
  <h2>Inhalt</h2>
  <p>Standard-Rhythmus für eine normale Sektion.</p>
</Section>

<!-- Dark hero band with narrow column -->
<Section tone="dark" padding="lg" container="narrow">
  <h1>Großes Display-Heading</h1>
</Section>

<!-- Subtle accent tint to break up surface monotony -->
<Section tone="accent-wash" container="wide">
  <slot />
</Section>
```

## i18n keys

_None — this component does not render user-facing strings._

## Gotchas

- **`data-tone` drives the tone styling**, not utility classes. Don't add `bg-*` utilities — they'll fight the `[data-tone]` cascade and lose specificity wars in subtle ways.
- **Inner horizontal padding is always present**, even when `container="full"`. If you need an absolutely full-bleed media element, position it absolutely (see `AsymmetricHero` `--fullbleed` for the pattern).
- **Padding is exposed as `--pf-section-pad`** (inline `style`) and applied by the component CSS, so layout rules can extend it — e.g. `main[data-under-header] > .pf-section:first-child` adds the header height on dark-first pages.
- **`container="default"` is the site `.container`** — same max-width and side padding as the header and footer, so section content shares their left edge. `narrow`/`wide`/`full` only change the max-width.
- **`tone="dark"` remaps tokens** (`--color-text`, `--color-text-heading`, `--color-muted`, `--color-border`) to on-dark values for every descendant. Light cards (`TeamCard`, `BlogCard`, ...) inside a dark section inherit that remap and lose contrast — keep card grids on light tones.
