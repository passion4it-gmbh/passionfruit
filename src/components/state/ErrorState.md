---
component: ErrorState
oneLiner: Inline tone-tinted notice for warnings, errors, info with optional retry
status: stable
tags: [state, primitive]
---

## Purpose

Inline notice surface for three semantic tones: `warning`, `error`, `info`. Each tone picks its lucide icon (`AlertTriangle` / `AlertCircle` / `Info`) and tints the background and border via the matching `--color-state-*` token. Background uses `color-mix` at 10% of the tone over transparent so the surface stays calm; border is the full-opacity token. The optional `retry` is a plain `<a>` — no JS handlers, no hydration.

## When to use

- Form validation errors near the offending field.
- Server / network failure callouts inside a section.
- Non-blocking warnings ("Your session expires in 5 minutes").
- Info callouts ("Diese Seite ist in Vorbereitung").

## When NOT to use

- Full-page error states — combine with `<AsymmetricHero>` or a custom 404/500 layout.
- Toasts — this is inline, not floating. A toast component should manage its own placement and dismissal.
- Loading states — use `<Skeleton />`.
- Empty results — use `<EmptyState />`.

## Props

| Prop       | Type                              | Required | Default | Notes                                                               |
| ---------- | --------------------------------- | -------- | ------- | ------------------------------------------------------------------- |
| `tone`     | `"warning" \| "error" \| "info"`  | yes      | —       | Drives icon, color token, and ARIA live politeness.                 |
| `headline` | `string`                          | yes      | —       | Bold first line in the content column.                              |
| `body`     | `string`                          | yes      | —       | Paragraph under the headline.                                       |
| `retry`    | `{ label: string; href: string }` | no       | —       | Optional link-based retry. No JS handlers — uses normal navigation. |
| `class`    | `string`                          | no       | `""`    | Extra classes on the root wrapper.                                  |

## Example

```astro
---
import ErrorState from "~/components/state/ErrorState.astro";
---

<!-- Hard error: assertive live region -->
<ErrorState
  tone="error"
  headline="Etwas ist schiefgelaufen."
  body="Wir konnten dein Formular nicht senden. Bitte versuche es erneut."
  retry={{ label: "Erneut versuchen", href: "/kontakt" }}
/>

<!-- Warning: polite live region -->
<ErrorState
  tone="warning"
  headline="Diese Seite wird in Kürze archiviert."
  body="Inhalte verschwinden am 1. Juni. Lade dir alles vorher herunter."
/>

<!-- Info: polite live region -->
<ErrorState
  tone="info"
  headline="Diese Funktion ist im Beta-Stadium."
  body="Bitte gib uns Feedback, wenn du etwas Unerwartetes erlebst."
/>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **`tone="error"` sets `role="alert"` + `aria-live="assertive"`** — this _interrupts_ the screen reader. Use sparingly. `warning` and `info` get `role="status"` + `aria-live="polite"`.
- **`retry` is a link, not a button.** Use a URL the user can navigate to (or the same page to re-trigger SSR). If you genuinely need a JS retry handler, fork the component — wiring a button here means hydration and is intentionally out of scope.
- **Tone color comes from `--color-state-{warning,error,info}` tokens** mapped via the `data-tone` attribute and a CSS custom property (`--pf-state-tone`). If you change the state tokens in `global.css`, this component follows automatically — no hex literals to chase.
- **`:global(.pf-error-state__icon svg)`** is used because lucide-astro renders an inline SVG without scoped styles attaching to it. Don't move the sizing into a scoped block — it stops applying.
