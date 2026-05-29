---
component: EmptyState
oneLiner: Centered empty-results placeholder with mandatory CTA so users never dead-end
status: stable
tags: [state, primitive]
---

## Purpose

Renders when a list, collection, or query returned nothing. Always includes a CTA — the design rule is "no dead-end empties": a user got here for a reason, and "nothing here" without a way forward is worse than an error. An `illustration` slot accepts custom artwork; the fallback is a calm lucide `Inbox` icon.

## When to use

- Empty collection / search-result pages ("Keine Beiträge gefunden").
- Filtered list views where the current filter combination has no matches.
- Onboarding states where the user hasn't created anything yet.

## When NOT to use

- For loading states — use `<Skeleton />`.
- For error states (network failure, server error) — use `<ErrorState tone="error" />`.
- When you genuinely have no useful CTA — fix the UX so there is one; if you can't, this component is not the right call.

## Props

| Prop       | Type                              | Required | Default | Notes                                                                      |
| ---------- | --------------------------------- | -------- | ------- | -------------------------------------------------------------------------- |
| `headline` | `string`                          | yes      | —       | Rendered as `<h3>` with `text-h2` style.                                   |
| `body`     | `string`                          | yes      | —       | Paragraph under the headline, capped at 32rem.                             |
| `cta`      | `{ label: string; href: string }` | yes      | —       | Renders `<Button variant="primary" tone="on-light">`. Mandatory by design. |
| `class`    | `string`                          | no       | `""`    | Extra classes on the root wrapper.                                         |

Optional `illustration` slot — pass any element to override the default `Inbox` icon (e.g., a custom SVG or a project-specific illustration).

## Example

```astro
---
import EmptyState from "~/components/state/EmptyState.astro";
import { findPageByKey } from "~/lib/page-registry";

const blogIndex = findPageByKey("blog-index");
---

<!-- Default Inbox icon -->
<EmptyState
  headline="Noch keine Beiträge"
  body="Hier erscheinen unsere Artikel, sobald die ersten veröffentlicht sind."
  cta={{ label: "Zur Startseite", href: "/" }}
/>

<!-- Custom illustration via slot -->
<EmptyState
  headline="No results for your filter"
  body="Try clearing one of the active filters to see more posts."
  cta={{ label: "Clear all filters", href: blogIndex?.en ?? "/en/blog" }}
>
  <svg slot="illustration" width="64" height="64" viewBox="0 0 64 64">
    <!-- bespoke artwork -->
  </svg>
</EmptyState>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **The CTA is required.** TypeScript will reject an EmptyState without a `cta`. This is the dead-end-prevention rule baked into the type.
- **The Button is locked to `variant="primary" tone="on-light"`.** If you need a different style (e.g., on dark surfaces), wrap the EmptyState in a `<Section tone="dark">` will not be enough — the Button tone doesn't follow. Fork the component if you need that flexibility.
- **The wrapper is `<div>`, not a section.** Compose it inside the page or section that owns the empty state.
- **Max content width is 36rem on the wrapper; body caps at 32rem inside.** Don't expect this to fill a wide layout — center it inside a larger container.
