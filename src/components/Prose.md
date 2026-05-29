---
component: Prose
oneLiner: Measure-capped wrapper for rendered Markdown with optional drop cap
status: stable
tags: [primitive, typography]
---

## Purpose

Wraps a rendered Markdown body so it sits inside a comfortable reading measure (60/70/80ch) and, optionally, leads with a `::first-letter` drop cap. The drop cap rule lives unscoped in `src/styles/typography.css` because slotted Markdown `<p>` elements don't inherit Astro's component-scope hash.

## When to use

- Any place a `<Content />` from `astro:content` is rendered — `BlogPost`, `CareerPost`, `EventDetail`, `CaseStudyDetail`, `PageContent`, `LegalDocument`, the contact page sidebar.
- Static long-form prose authored inline that should obey the same measure as Markdown bodies.
- When you want the optional drop cap on long editorial reads (`BlogPost` uses `dropCap`).

## When NOT to use

- Display copy (hero leads, lede paragraphs) — those live inside `Section` archetypes with their own type scale.
- Form inputs, cards, or any layout where the 60–80ch cap would be visually wrong.
- Short body strings that aren't paragraph prose — there is no styling benefit and the centering will feel arbitrary.

## Props

| Prop      | Type                             | Required | Default     | Notes                                                                       |
| --------- | -------------------------------- | -------- | ----------- | --------------------------------------------------------------------------- |
| `dropCap` | `boolean`                        | no       | `false`     | Adds `.has-drop-cap`; rule lives in `src/styles/typography.css` (unscoped). |
| `measure` | `"tight" \| "default" \| "wide"` | no       | `"default"` | Caps `max-inline-size` at 60ch / 70ch / 80ch on viewports ≥ 640px.          |

Under 640px the measure cap relaxes to 100% so mobile gutters take over.

## Example

```astro
---
import Prose from "~/components/Prose.astro";
import { render } from "astro:content";

const { Content } = await render(entry);
---

<!-- Editorial body with drop cap -->
<Prose dropCap>
  <Content />
</Prose>

<!-- Legal text — wider measure, regular paragraph start -->
<Prose measure="wide">
  <Content />
</Prose>
```

## i18n keys

_None — this component does not render user-facing strings._

## Gotchas

- **Drop cap selector is unscoped.** The `.has-drop-cap p:first-of-type::first-letter` rule sits in `src/styles/typography.css` because Astro's scoped style hash isn't applied to slotted Markdown HTML. Don't move it back into the component `<style>` block — it stops working.
- **Centered horizontally by `margin-inline: auto`.** Wrapping `<Prose>` inside a flex container with `align-items: stretch` can fight the centering — keep it as a normal block child.
- **`measure` does not affect typography size.** It only caps width. Type scale comes from the global `prose` styles applied by Tailwind's typography plugin or the bespoke typography layer in `global.css`.
