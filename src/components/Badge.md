---
component: Badge
oneLiner: Small pill label with variant×tone color matrix for tagging content
status: stable
tags: [primitive]
---

## Purpose

Renders an inline pill-shaped label used to tag content items (e.g., job types, blog topics, case study categories). Provides two semantic variants (`default` and `status`) each adapted for light and dark backgrounds via the `tone` prop.

## When to use

- Tagging a blog post, case study, or career entry with a category or label.
- Indicating a status (e.g., "Open", "New") within a card or list.
- Rendering filter chip labels inside a collection listing.

## When NOT to use

- As an interactive element — `Badge` is a `<span>`, not a button or link. Use `Button` or a plain `<a>` for clickable chips.
- For long text — the pill shape breaks down beyond ~3 words.

## Props

| Prop      | Type                      | Required | Default      | Notes                                                           |
| --------- | ------------------------- | -------- | ------------ | --------------------------------------------------------------- |
| `variant` | `"default" \| "status"`   | no       | `"default"`  | `default` uses accent tones; `status` uses green (open/active). |
| `tone`    | `"on-light" \| "on-dark"` | no       | `"on-light"` | Switches color palette for dark backgrounds.                    |

Content is passed via the default slot.

## Example

```astro
---
import Badge from "~/components/Badge.astro";
---

<Badge>AI</Badge>
<Badge variant="status">Open</Badge>
<Badge variant="default" tone="on-dark">Remote</Badge>
```

## i18n keys

None

## Gotchas

- Content is slotted — no text prop. An empty slot renders an empty pill.
- `status` variant (`green-100/green-800` on light, `green-900/30/green-400` on dark) is purely visual. It carries no semantic ARIA role; add `aria-label` or surrounding context when the color conveys meaning.
- The `on-dark` palette uses `text-text-on-dark` (maps to `--color-text-on-dark` in `global.css`) — ensure the parent background is dark or the contrast will be insufficient.
