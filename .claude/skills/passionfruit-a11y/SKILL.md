---
name: passionfruit-a11y
description: Use when adding or modifying any element with `aria-*`, `role=`, `alt=`, or any `<img>`, `<button>`, `<a>`, `<form>` element, or when touching motion-related files. Loads WCAG essentials, alt-text discipline, focus-visible patterns, touch-target rules, and the reduced-motion contract.
---

# passionfruit accessibility rules

Accessibility is enforced at build time — `jsx-a11y/alt-text` is error-level lint, so a missing alt blocks the build — and by convention everywhere else. These rules are non-negotiable. When in doubt, prefer the more accessible option.

## Hard rules

1. **Alt text on every image.** Every `<img>` and Astro `<Image>` requires an `alt` attribute. `alt=""` is correct ONLY when the image is purely decorative — it carries no information not already in surrounding text. Otherwise, describe what the image conveys, not what it visually looks like.
2. **Touch targets ≥ 44px.** Interactive elements (buttons, links, form inputs) must have at least 44×44px hit area, via CSS sizing or padding. This is a hard floor, not a target.
3. **`:focus-visible` ring on every interactive element.** Never suppress the default focus ring without providing a custom one. Keyboard users must be able to see where focus is.
4. **Reduced-motion contract.** Any CSS animation or transition exceeding 100ms must be wrapped in `@media (prefers-reduced-motion: no-preference)`. The default (outside that block) is the target state, applied instantly. No parallax. Ever.
5. **Landmark roles for top-level structure.** `<main>`, `<nav>`, `<header>`, `<footer>` for top-level page structure — not generic `<div>` walls. State pages (404, 500) must wrap their content in `<main>` so screen readers can land on it.
6. **Labelled form fields.** Every `<input>`, `<select>`, `<textarea>` has a `<label>` — visible or `class="sr-only"`. Error messages link to the field via `aria-describedby`. No placeholder-as-label tricks.

## Common mistakes

- **`<img>` with no `alt`.** Build fails. If decorative, `alt=""` — not the absence of the attribute.
- **Button-styled `<div>`** with no `role="button"`, no `tabindex`, no keyboard handler. Use `<button>` instead — you get keyboard, ARIA semantics, and focus styles for free.
- **Icon-only `<button>` or `<a>`** with no `aria-label`. The accessible name is missing — screen readers announce "button" with no purpose. Add `aria-label="Open menu"` (or similar).
- **Animation without a reduced-motion gate.** Users with `prefers-reduced-motion: reduce` get the unmitigated animation — motion-sickness territory. Wrap the keyframes in the media query; let the static end-state stand on its own.
- **Suppressing `outline` without replacing it.** `outline: none` on `:focus` strips the only visible focus signal. If you must restyle, do it under `:focus-visible` with a clearly visible ring.
- **Skipped heading levels** (`<h2>` then `<h4>`). Heading hierarchy is the screen-reader's outline. Don't pick a level for size — pick the size token from `--text-*`.

## Where to look

- This skill auto-loads on a11y-touching edits — read it first.
- **`STYLE_GUIDE.md` §8 (Accessibility)** — fuller coverage including focus-ring tokens and the full touch-target rationale.
- **`passionfruit-content` skill** — content-side accessibility (heading hierarchy in markdown, link text discipline, bilingual screen-reader copy).
- **`pnpm lint:a11y`** — runs the dedicated a11y ESLint pass locally. Run it when you've added a non-trivial interactive component.
