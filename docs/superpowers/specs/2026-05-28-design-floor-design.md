# Spec 1 — Design floor

**Status:** approved design, ready for implementation plan
**Date:** 2026-05-28
**Author:** Claude (Linus persona)
**Sequenced before:** Spec 2 — Claude-grade docs

## 1. Context

passionfruit is a template that turns Claude Code into a web developer for non-technical users. The template's design quality is the floor under everything Claude produces — a generic floor produces generic sites no matter how good the AI is.

This spec raises that floor across four coordinated chapters: editorial typography, a section archetype library, a motion language, and deliberate state design. All four extend the existing `@theme` token system in `src/styles/global.css`; no new runtime, no edge code, no AI primitives.

Spec 2 (Claude-grade docs) follows because it documents what we actually build here, not what we planned to build.

## 2. Goals

- Editorial-grade craft from token foundation through page-level state surfaces.
- Zero new npm dependencies as the default. Add a dep only when a chapter forces it.
- Bilingual-clean by construction. CSP-safe. Builds cleanly with existing quality gates (`pnpm build`, `pnpm check:all`).
- Every primitive shipped is reusable and consumed by at least one in-tree consumer.

## 3. Non-goals

- AI / edge runtime primitives (deliberately deferred — user steered away from this in brainstorm).
- Documentation rewrite — that's Spec 2.
- New Form primitive (deferred; ErrorState awaits a future form consumer).
- New typeface or display face (Inter Variable's optical-sizing axis is enough).
- Per-route bespoke motion choreography.
- Section-level CMS authoring, Lottie / SVG animation pipelines, Sentry-style error reporting integration.
- Refactoring unrelated components.

## 4. Architecture

Four layers, all share one token foundation.

**L1 — Tokens.** Extend the `@theme` block in `src/styles/global.css`. Additive only; existing token names keep their slots, values may be regenerated (e.g., type scale derived from a ratio). Possibly split into `src/styles/typography.css` and `src/styles/motion.css` if `@theme` outgrows itself.

**L2 — Primitives.** Small Astro components and CSS layers that consume L1 tokens. The primitives are the API the rest of the template builds against: `<Prose>`, `<Section>`, `<Motion>`, `<Skeleton>`, `<EmptyState>`, `<ErrorState>`.

**L3 — Archetypes.** Opinionated section layouts in a new `src/components/sections/` directory, each consuming L2 primitives via a normalized prop shape.

**L4 — State surfaces.** Redesigned 404, new 500, plus skeleton / empty / error usage inside in-tree consumers like `CollectionFilter`.

Bilingual safety is structural: design is locale-agnostic, user-facing strings flow through `useTranslations(locale)`, both `de.json` and `en.json` are updated in lockstep. CSP safety is structural: no inline scripts without nonces, no new third-party hosts (no CSP additions needed).

Implementation will fan out across subagents per chapter. Token foundation lands first (everything depends on it), then Chapters 2 / 3 / 4 run in parallel; the parent agent integrates and runs quality gates.

## 5. Chapter 1 — Editorial type system

**What ships:**

1. Modular scale derivation from a perfect-fourth ratio (1.333). Token names stay (`--text-display` through `--text-body-lg`); values regenerated from the ratio with a documenting comment.
2. Optical sizing wired through Inter Variable's `opsz` axis (14–32). Display sizes pull from higher opsz (crisper at headline scale); body uses defaults (more readable).
3. OpenType features per role:
   - Body: `liga`, `calt`, `kern`, `onum` (oldstyle figures in flowing prose).
   - Headings: `liga`, `calt`, `kern`, `ss01`.
   - Data / tables: `tnum`, `lnum` (tabular lining figures for numeric alignment).
   - Code blocks: ligatures off.
4. Semantic vertical-rhythm tokens: `--leading-display`, `--leading-heading`, `--leading-body`, `--leading-caption`. Paragraph margins tuned so prose lands on a rhythm grid.
5. `<Prose>` primitive at `src/components/Prose.astro`. Optional `dropCap` variant; `hanging-punctuation: first` where supported (progressive enhancement); measure capped at 65–75ch with mobile reflow. Consumed by `BlogPost.astro`, `LegalDocument.astro`, `PageContent.astro`.
6. Heading hierarchy refinement: distinct tracking per level (display `-0.05em` → h3 `-0.02em`) so stacked headings have visual rhythm without weight changes.

**Files:** extend `src/styles/global.css` (optionally split a `src/styles/typography.css`); new `src/components/Prose.astro`; wrap the three Markdown-rendering components.

**Out of scope for this chapter:** animated text reveals (Chapter 3), state-page typography polish (Chapter 4), display-font swap.

## 6. Chapter 2 — Section archetype library

**What ships:**

1. New directory `src/components/sections/` for all archetype components.
2. `<Section>` frame primitive owning padding scale tokens (`section-sm/md/lg`), max-width container variants (narrow/default/wide), and background tone variants (surface/elevated/dark/accent-wash). Single tuning surface for section spacing site-wide.
3. Normalized prop shape across every archetype: `eyebrow`, `headline`, `lede`, `tone`, `padding`, `align`.
4. Archetypes:
   - **AsymmetricHero** — 7/5 column split (editorial, not flat 50/50), intentional vertical offset; variants: image-right (default), image-left, fullbleed-with-overlay.
   - **MagazineGrid** — editorial 12-col grid, cells sized small/medium/large; large cells get headline + image + lede, small cells are linkable summaries.
   - **StickyStory** — pinned copy column + scrolling visuals beside it; mobile falls back to stacked; sticky behavior implemented in Chapter 3's motion adapter.
   - **EditorialQuote** — display-sized pull-quote with attribution + optional avatar.
   - **SplitFeature** — alternating image+text rows consuming Chapter 1's vertical-rhythm tokens.
5. 12-col grid utilities in `@theme` (subgrid where supported, graceful fallback).
6. Migrations (rename + harmonize props; no back-compat shims, internal API):
   - `TrustSection.astro` → `sections/Trust.astro`
   - `ComparisonTable.astro` → `sections/Comparison.astro`
   - `FAQs.astro` → `sections/FAQ.astro`
7. Page-level imports updated where they reference the moved components.

**Files:** new `src/components/sections/` (5 archetypes + 3 migrated); new `src/components/Section.astro`; page-level import updates.

**Out of scope for this chapter:** entrance / scroll animations (Chapter 3), variant explosion (max 2–3 per archetype; want more → new archetype).

## 7. Chapter 3 — Motion language

**What ships:**

1. Semantic duration tokens: `--duration-instant` (80ms), `--duration-quick` (150ms, alias of existing `--transition-fast`), `--duration-base` (240ms), `--duration-slow` (400ms). Intent-tied easings: `--ease-enter`, `--ease-exit`, `--ease-emphasized`, `--ease-standard`. Existing `--ease-default/spring/bounce` stay as aliases.
2. Root view transitions wired in `src/layouts/BaseLayout.astro` via `<ClientRouter />` from `astro:transitions` (built into Astro, no dep). Per-section choreography: header stays put, content cross-fades + 8px slide, hero gets `--duration-slow`.
3. `<Motion>` primitive at `src/components/motion/Motion.astro`. Props: `effect` (`fade` / `fade-up` / `fade-down` / `scale-in`), `delay`, `duration` (token-bound), `threshold` (visibility), `once`. CSS `animation-timeline: view()` where supported, IntersectionObserver fallback, no-op under reduced-motion.
4. Micro-interactions standardized: button `:active` depression (subtle Y-translate), card hover lift (Y + shadow), input focus glow harmonized. All routed through tokens; archetypes pick them up.
5. StickyStory sticky adapter (Chapter 2 deferral): CSS `position: sticky` for layout, IntersectionObserver for progress signal. Reduced-motion disables sticky.
6. Reduced-motion contract end-to-end: every animation honors `prefers-reduced-motion: reduce`.
7. Dev-only motion fixture at `src/pages/design-floor/motion.astro`, gated by `import.meta.env.DEV`. Renders every primitive in isolation for verification.
8. Rename `src/styles/scroll-animations.css` → `src/styles/motion.css`. Update import in `global.css`. Audit other importers (current import is only in `global.css`).

**Files:** extend `@theme`; rename `scroll-animations.css` → `motion.css`; new `src/components/motion/`; edit `BaseLayout.astro`; complete `StickyStory.astro` from Chapter 2.

**Opinionated defaults:**

- View transitions site-wide, not opt-in per page. Consistency wins.
- No parallax. Motion-sickness risk, no quality lift.
- No JS animation library. CSS + IntersectionObserver suffice.

**Out of scope for this chapter:** per-route bespoke choreography (one default site-wide), loading / skeleton animation (Chapter 4), Lottie / SVG animation pipelines, scroll-jacking.

**Risk note:** view transitions interact with PostHog / GA4 SPA pageview firing. PostHog has client-router SPA support; GA4 needs explicit gtag config. Verify both during implementation, not after.

## 8. Chapter 4 — State design

**What ships:**

1. `src/pages/404.astro` redesigned using Chapter 2's AsymmetricHero. Display-sized number; friendly + actionable copy (no jokes — they age badly); search / return CTA. Locale detection via `Astro.url.pathname` (mirrors the catch-all `[...path].astro` pattern), so one file serves both DE and EN.
2. New `src/pages/500.astro`. Calmer tone than 404. Never pretends to know what went wrong. "Something on our end" + clear next step. The CSP `Reporting-Endpoints` integration (already gated by `PUBLIC_POSTHOG_API_KEY`) reports the underlying violation if applicable.
3. `<Skeleton>` primitive at `src/components/state/Skeleton.astro`. Variants: `text` (line-height-matched, not generic gray bars), `card`, `image`, `circle` (for avatars). CSS gradient shimmer; reduced-motion produces a static muted block.
4. `<EmptyState>` primitive at `src/components/state/EmptyState.astro`. Illustration slot + headline + body + always-present CTA. No dead-end empties.
5. `<ErrorState>` primitive at `src/components/state/ErrorState.astro`. Tone token (warning vs. error), icon, helpful copy, retry slot. Replaces raw red-text-with-asterisk patterns.
6. `CollectionFilter.astro` wired to `<EmptyState>` on zero results, with bilingual copy.
7. i18n strings in both `de.json` and `en.json` under a new `state` namespace: `state.404.{title,body,cta}`, `state.500.{title,body,cta}`, `state.empty.{posts,filters}`, `state.error.{generic,retry}`.

**Files:** rewrite `src/pages/404.astro`; new `src/pages/500.astro`; new `src/components/state/` (Skeleton, EmptyState, ErrorState); edit `src/components/CollectionFilter.astro`; both `src/i18n/de.json` and `src/i18n/en.json`.

**Opinionated defaults:**

- Skeletons match real content shape. Generic gray blocks are worse than no skeleton.
- Reduced-motion skeleton = static muted block, not omitted. Visual structure still helps users.
- 500 page is intentionally minimal. Failure pages should not be playgrounds.

**Out of scope for this chapter:** Form primitive (deferred — ErrorState awaits a real form consumer); Sentry / Bugsnag integration; YouTubeFacade / SpotifyFacade loading-state harmonization (their facades already work — touching is unrelated churn).

## 9. Cross-cutting

### 9.1 Bilingual

- All user-facing strings flow through `useTranslations(locale)` and ship in both `de.json` and `en.json` together.
- New `state` i18n namespace covers Chapter 4.
- Design itself is locale-agnostic; OpenType features apply equally to DE and EN.
- `scripts/check-bilingual.mjs` continues to gate the build.

### 9.2 Accessibility

- `prefers-reduced-motion: reduce` honored across motion (Chapter 3) and skeleton shimmer (Chapter 4).
- Skeletons remain visible as static blocks under reduced motion — structure aids comprehension.
- 404 and 500 use proper landmarks (`<main>`), heading hierarchy, and skip-link compatibility.
- `jsx-a11y/alt-text` (error level) continues to enforce alt text on all images, including new archetypes' image slots. Archetypes with image slots require explicit `alt` props.
- Touch targets stay ≥ 44px (existing rule, reinforced).
- `focus-visible` ring on every new interactive element.

### 9.3 Quality gates inherited

- `pnpm build` (lint + typecheck + bilingual check + Astro build) must pass.
- `pnpm check:all` (spelling + a11y + build + link check) must pass locally before commit.
- No hex literals in components — all colors route through `@theme` tokens.
- CSP-safe — no inline scripts without nonces; no new third-party hosts; no CSP edits needed.
- TypeScript strict — no `any`.

### 9.4 Implementation sequencing

Sequenced for subagent fan-out:

1. **Foundation pass** (parent agent, single subagent or direct): Chapter 1 tokens + Chapter 3 tokens land in `@theme` first; rename of `scroll-animations.css` → `motion.css` happens here. Everything else depends on this.
2. **Parallel chapter implementation** (one subagent per chapter): Chapter 1 primitives + Markdown component wraps; Chapter 2 archetypes + migrations; Chapter 3 primitives + view transitions + sticky adapter; Chapter 4 state surfaces + i18n. Chapter 4 weakly depends on Chapters 2 and 3 (uses AsymmetricHero on 404, motion on skeleton) but can start in parallel with carefully scoped interfaces — its agent gets the prop shape contracts up front.
3. **Integration pass** (parent agent): run `pnpm build`, `pnpm check:all`, manual visual review of dev fixture page, reconcile any interface drift between chapters.

### 9.5 Files modified / created (summary)

**Extended:**

- `src/styles/global.css`
- `src/layouts/BaseLayout.astro`
- `src/components/CollectionFilter.astro`
- `src/components/BlogPost.astro`
- `src/components/LegalDocument.astro`
- `src/components/PageContent.astro`
- `src/pages/404.astro`
- `src/i18n/de.json`
- `src/i18n/en.json`

**Renamed:**

- `src/styles/scroll-animations.css` → `src/styles/motion.css` (with import in `global.css` updated)

**Possibly split out of `global.css`** if it grows unwieldy: `src/styles/typography.css`.

**New:**

- `src/components/Prose.astro`
- `src/components/Section.astro`
- `src/components/sections/` (5 archetypes + 3 migrated)
- `src/components/motion/` (Motion + sugar primitives)
- `src/components/state/` (Skeleton, EmptyState, ErrorState)
- `src/pages/500.astro`
- `src/pages/design-floor/motion.astro` (DEV-gated)

### 9.6 Risks / open questions

- **`animation-timeline: view()` support** is Chrome 115+ / Safari 17+. Fallback path (IntersectionObserver) is documented; visual differences across browsers will be subtle. Mitigation: design the baseline at the fallback, treat scroll-driven progress as additive polish.
- **View transitions + analytics SPA pageview**: PostHog client-router support is documented; GA4 requires explicit gtag configuration on the transition event. Both must be verified during Chapter 3 implementation, not after.
- **Rename `scroll-animations.css` → `motion.css`** could break direct importers. Current audit shows only `global.css` imports it; re-audit before rename.
- **404 locale detection via pathname**: relies on Cloudflare Pages serving the same `404.astro` for both `/missing` and `/en/missing`. Confirm CF Pages routing semantics during Chapter 4 implementation; fallback is two locale-specific 404 files.

## 10. Verification

Done when:

- [ ] `pnpm build` passes (lint, typecheck, bilingual check, Astro build).
- [ ] `pnpm check:all` passes (spelling, a11y, build, link check).
- [ ] Both DE and EN renders verified on home, blog index, blog post, services, 404, 500.
- [ ] Mobile layout intact at 375px across all archetypes.
- [ ] `prefers-reduced-motion: reduce` verified end-to-end: no shimmer animation, no entrance animations, no sticky behavior; static fallbacks render correctly.
- [ ] Dev fixture `/design-floor/motion` renders every primitive without errors.
- [ ] PostHog and GA4 fire pageviews on view transitions (manual check with both env vars set).
- [ ] No hex literals introduced in any component.
- [ ] No new npm dependencies introduced.

## 11. Out of scope (consolidated)

- AI / edge runtime primitives — the user steered away during brainstorm.
- Claude-grade documentation (STYLE_GUIDE rewrite, per-component intent files, auto-loading area skills) — Spec 2.
- Form primitive — deferred until a real form consumer exists.
- Sentry / Bugsnag integration.
- New typeface or display face.
- Per-route bespoke motion choreography.
- Section-level CMS authoring.
- Lottie / SVG animation pipelines.
- Restructuring or refactoring unrelated components.
