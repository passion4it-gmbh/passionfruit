---
name: passionfruit-design
description: Use when editing any file under `src/components/`, `src/components/sections/`, or `src/styles/`, or any `.astro`/`.css` file outside `src/content/` and `src/i18n/`. Loads design tokens, primitive selection rules, and the no-hex-in-components rule. Pairs with the existing per-component sidecars for per-component intent.
---

# passionfruit design rules

Design tokens and patterns live in `STYLE_GUIDE.md`. The decision shortcuts at the bottom of that file are the fastest path to the right answer. Per-component intent — what each component is for, when to reach for it — lives in the sidecar `.md` next to each component. Read this skill first, then jump to STYLE_GUIDE for depth or to the sidecar for component specifics.

## Hard rules

1. **No raw hex literals in components.** Every color comes from a `--color-*` token defined in `@theme` (`src/styles/global.css`). If you need a new color, add the token to `@theme` first, then use it.
2. **No inline `font-size: Xrem` literals.** Use a `--text-*` token or its matching utility class (`text-h1`, `text-body-lg`, etc.). The clamps are fluid by design — don't break them.
3. **No emojis as iconography.** Icons come from `@lucide/astro`. Emojis are content-only (and even there: rarely).
4. **Update `public/_headers` CSP before adding any third-party host.** Scripts, fonts, iframes, images from a new origin all need the CSP updated first or they get silently blocked in production.

## Decision shortcuts

When you reach one of these decision points, take the shortcut.

- **Need a CTA?** `<Button variant="..." tone="...">`.
- **Need a color?** Check `@theme` in `src/styles/global.css` first. If missing, add a token, then use it.
- **Need a font size?** Use a `--text-*` token or its matching utility class. Never raw `font-size: Xrem`.
- **Need to display a blog/team/career/case-study/event entry as a card?** Use the per-type card (`BlogCard`, `TeamCard`, etc.). passionfruit deliberately has one card per content type, not a generic frame.
- **Need to embed a YouTube or Spotify video?** Use the facade (`<YouTubeFacade>` / `<SpotifyFacade>`). Never embed the third-party iframe directly.
- **Need long-form Markdown rendering?** Reuse the existing `BlogPost` / `PageContent` / `LegalDocument` patterns.
- **Need an icon?** Import from `@lucide/astro`. Never an emoji.
- **Need to add a third-party host?** Update `public/_headers` CSP, then add the resource.
- **Need to add a translation string?** Update both `src/i18n/de.json` and `src/i18n/en.json` together (the `passionfruit-content` skill auto-loads to remind you).
- **Need an animation?** CSS keyframes inside a `prefers-reduced-motion: no-preference` block. No JS animation libraries.
- **Need a section frame?** `<Section tone="..." padding="..." container="...">` or pick the right archetype from `sections/` (`AsymmetricHero`, `MagazineGrid`, `StickyStory`, `EditorialQuote`, `SplitFeature`, `Trust`, `Comparison`, `FAQ`). Don't compose a generic `<section>` ad-hoc.
- **Need an entrance animation primitive?** `<Motion effect="fade-up" duration="base">` or the `<FadeUp>` / `<FadeIn>` sugars. Reduced-motion handled for you. Don't author per-element keyframes.
- **Need a loading skeleton, empty state, or error surface?** `<Skeleton variant="...">`, `<EmptyState>` (CTA is required — no dead-end empties), `<ErrorState tone="warning|error|info">`. Don't roll your own gray box or red-text-with-asterisk.

If you don't see your situation here, ask. Don't guess.

## Token namespaces

One-line summaries — full definitions live in `src/styles/global.css` `@theme`.

- **`--color-*`** — surfaces (`surface`, `surface-elevated`, `surface-dark`), text (`text`, `text-heading`, `text-on-dark`, `muted`), accent (`accent`, `accent-hover`, `accent-glow`), warm (`warm`, `warm-muted`), borders, state surfaces, overlay scrim (`--color-overlay-scrim-*`), shadow lift (`--color-shadow-lift`). Never reach for raw `rgba(...)` when a scrim/shadow token exists.
- **`--text-*` and `--leading-*`** — fluid `clamp()` type scale (`text-display`, `text-h1`...`text-h3`, `text-body-lg`) with matching leading tokens. Use the utility class or the var; never hardcode a rem value.
- **`--space-*` and `--space-section-*`** — base spacing scale (`space-1`...`space-16`) and section-padding scale (narrow/default/wide). Use these instead of arbitrary `padding: 4rem`.
- **`--radius-*`** — corner radii (`sm`, `md`, `lg`, `xl`, `2xl`) plus semantic aliases (`--radius-button`, `--radius-card`).
- **`--duration-*` and `--ease-*`** — motion timings and easings (`ease-default`, `ease-spring`, `ease-bounce`). Pair them — don't pick raw cubic-bezier values inline.
- **`--grid-cols-12`** — the canonical 12-column layout grid. Use it instead of ad-hoc `grid-template-columns`.

## Where to look

- **`STYLE_GUIDE.md`** — canonical reference for every section above. Decision Shortcuts cheat sheet lives at the bottom.
- **`src/styles/global.css` `@theme`** — token definitions. Source of truth.
- **The sidecar `.md` next to any component** — per-component intent: what it is for, when to reach for it, what props it expects.
- **`src/components/CLAUDE.md`** — auto-generated catalog of every component and its sidecar summary.
