---
name: passionfruit-perf
description: Use when editing any media component (`<Image>`, `YouTubeFacade`, `SpotifyFacade`), `BaseLayout.astro`, files under `src/pages/`, or adding new client scripts. Loads image-loading discipline, no-JS-when-CSS-suffices, third-party host CSP rules.
---

# passionfruit performance rules

passionfruit is a static-output Astro site. Performance comes from disciplined defaults: lazy-load below the fold, facades for heavy embeds, CSS over JS for behavior, no third-party host without a CSP update. Most regressions come from skipping one of these — don't.

## Hard rules

1. **Astro `<Image>` from `astro:assets`, never raw `<img>` for project assets.** Astro generates AVIF + WebP, picks responsive sizes, and handles `width`/`height` to prevent CLS. A raw `<img>` skips all of it.
2. **`loading="eager"` only for above-the-fold imagery** — hero image, first card row, anything in the LCP candidate set. Everything below uses the `loading="lazy"` default. Eager loading off-screen images steals from the LCP budget.
3. **Heavy embeds use facade components.** YouTube, Spotify, Vimeo, etc. go through the facades in `src/components/` (`YouTubeFacade.astro`, `SpotifyFacade.astro`). Never embed the third-party iframe directly — facades respect cookie consent and defer the real embed until the user interacts.
4. **CSS over JS for animation and behavior.** CSS transitions, keyframes, `:hover`, `:focus-visible`, and `IntersectionObserver` cover the vast majority of cases. Don't reach for a JS animation library when CSS does the job.
5. **Update `public/_headers` CSP before adding any third-party host.** Scripts, fonts, iframes, images from a new origin all need the CSP updated first. Violations show up silently in PostHog when reporting is enabled (`PUBLIC_POSTHOG_API_KEY` set at build time triggers the `report-to` directive).
6. **Prefer `client:idle` or `client:visible` over `client:load`** on Astro components. `client:load` blocks the main thread during hydration; `client:idle` waits for idle time and `client:visible` waits until the component is on-screen. Use `client:load` only when the component must be interactive on first paint.

## Common mistakes

- **Raw `<img src="...">`** instead of `<Image>` — loses AVIF/WebP, loses responsive sizing, often causes CLS.
- **YouTube iframe embedded directly** — bloats LCP by hundreds of kilobytes, ignores cookie consent, drags in third-party JS before the user has shown intent.
- **`client:load` on a component that only needs a CSS hover state.** Hydration cost for nothing — strip the directive and use CSS.
- **Adding a third-party script, font, or embed and forgetting the CSP.** The browser blocks it silently in production. Open DevTools → Console to see the CSP violation; better, update `public/_headers` first.
- **Heavy `<script>` blocks in component templates** — Astro ships them as-is. Keep client scripts small and intentional; if it grows, move it to a real file and hydrate a small island.
- **Importing a large library to use one function.** Tree-shaking helps but rarely fully. Prefer the standard-library equivalent or the small focused package.

## Where to look

- This skill auto-loads on perf-touching edits — read it first.
- **`public/_headers`** — CSP directives and cache rules (long-cache `/_astro/*`, short-revalidate HTML). Update the CSP here before adding any third-party host.
- **`src/components/YouTubeFacade.astro`** and **`src/components/SpotifyFacade.astro`** — the canonical facade patterns. Copy the shape if you need a new facade.
- **`scripts/postbuild-headers.mjs`** — wires up CSP violation reporting to PostHog (opt-in via `PUBLIC_POSTHOG_API_KEY`).
- **`BaseLayout.astro`** — head-level perf knobs (preloads, font-display, locale-specific OG image).
