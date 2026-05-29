---
component: Skeleton
oneLiner: Content-shaped loading placeholder with reduced-motion-gated shimmer
status: stable
tags: [state, primitive]
---

## Purpose

A loading placeholder that mirrors the shape of the real content — text lines, card silhouettes, image rectangles, circles — rather than generic gray bars. A subtle gradient shimmer plays on viewports where `prefers-reduced-motion: no-preference` is true; everywhere else the gradient renders static so the structural cue survives. `role="status"` + visually-hidden "Loading…" announces the wait to assistive tech.

## When to use

- Async data fetches where the final layout is known and the user shouldn't see a layout shift.
- Above-the-fold media that takes a moment to decode — render the image variant at the final aspect ratio.
- Optimistic UI for forms (replace inputs with text-line skeletons during submit).

## When NOT to use

- For requests that complete in under ~200ms — a flash of skeleton reads as a glitch. Show nothing, or a quiet spinner.
- When the eventual content shape is unknown — a generic spinner is more honest.
- Inside `<Section>` headers where the user expects copy — skeletons in headings feel jarring.

## Props

| Prop      | Type                                      | Required | Default | Notes                                                                                                                                                                                     |
| --------- | ----------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant` | `"text" \| "card" \| "image" \| "circle"` | yes      | —       | Drives the placeholder silhouette via `.pf-skeleton--{variant}`.                                                                                                                          |
| `lines`   | `number`                                  | no       | `1`     | Only used when `variant === "text"`. Floored to int, min 1.                                                                                                                               |
| `width`   | `string`                                  | no       | —       | Optional CSS length applied as inline `style` (`200px`, `50%`, etc.).                                                                                                                     |
| `height`  | `string`                                  | no       | —       | Optional CSS length applied as inline `style`.                                                                                                                                            |
| `class`   | `string`                                  | no       | `""`    | Extra classes on the root wrapper.                                                                                                                                                        |
| `lang`    | `Locale` (`"de" \| "en"`)                 | no       | auto    | Locale for the screen-reader "Loading" label. Auto-detected from `Astro.url.pathname` (`/en/*` → `"en"`, else `"de"`); pass explicitly when the prefix doesn't match the rendered locale. |

## Example

```astro
---
import Skeleton from "~/components/state/Skeleton.astro";
---

<!-- 3 text lines, last one 70% width -->
<Skeleton variant="text" lines={3} />

<!-- Square avatar placeholder -->
<Skeleton variant="circle" width="48px" height="48px" />

<!-- Card silhouette while a blog list loads -->
<div class="grid">
  {Array.from({ length: 6 }).map(() => <Skeleton variant="card" />)}
</div>
```

## i18n keys

- `state.loading` — single string ("Wird geladen" / "Loading"). Used for the visually-hidden screen-reader text and the wrapper's `aria-label`. Locale resolved from the `lang` prop or auto-detected from `Astro.url.pathname`.

## Gotchas

- **Locale auto-detection is pathname-based.** Pages under `/en/*` resolve to English; everything else falls back to German. If the component renders on a page whose locale doesn't match its URL prefix (rare — page-builder previews, embedded fragments), pass `lang` explicitly.
- **Multi-line text shrinks the last line to 70%.** That's intentional — it mimics how real prose ends mid-measure. If you want uniform lines, pass `lines={1}` per line manually.
- **`role="status" aria-live="polite" aria-busy="true"`** is set on the wrapper. Don't nest skeletons inside `role="alert"` containers — the politeness levels conflict and screen readers will pick the more aggressive one.
- **Shimmer animation is in `src/styles/state.css` (or equivalent)**, gated on `@media (prefers-reduced-motion: no-preference)`. Don't move the keyframes into a scoped style — Astro will hash the class and the animation won't find its target.
