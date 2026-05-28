# Design Floor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan. Phase 0 runs sequentially in the parent agent; Phases 1–4 fan out one subagent per chapter in parallel; Phase 5 integration runs in the parent. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-05-28-design-floor-design.md` — read it before any task.
>
> **Convention:** No literal code blocks in this plan (per project rule). Each step describes the change precisely enough that the implementing agent can write the code. Acceptance signals are explicit at every step.

**Goal:** Raise passionfruit's design floor across four coordinated chapters (editorial type, section archetype library, motion language, state design) by extending the existing `@theme` token system. Zero new npm dependencies as default.

**Architecture:** Four-layer system (tokens → primitives → archetypes → state surfaces) all consuming one `@theme` foundation. Phase 0 publishes the token additions and the prop-shape interface contracts; Phases 1–4 implement against those contracts in parallel subagents; Phase 5 integrates and runs full quality gates.

**Tech Stack:** Astro 6 (static output), Tailwind v4 via `@tailwindcss/vite`, TypeScript strict, Inter Variable (`opsz` axis), CSS `animation-timeline: view()` with IntersectionObserver fallback, `astro:transitions` ClientRouter, lucide icons.

**Worktree:** `.claude/worktrees/feat+design-floor` on branch `worktree-feat+design-floor`. All work commits here.

---

## Dispatch shape (for the parent agent)

| Phase                        | Runs in                            | Depends on                                                                       | Subagent type                     |
| ---------------------------- | ---------------------------------- | -------------------------------------------------------------------------------- | --------------------------------- |
| Phase 0 — Foundation         | Parent (direct or single subagent) | —                                                                                | `typescript-engineer` recommended |
| Phase 1 — Editorial type     | Subagent (parallel)                | Phase 0                                                                          | `ui-ux-designer`                  |
| Phase 2 — Section archetypes | Subagent (parallel)                | Phase 0                                                                          | `ui-ux-designer`                  |
| Phase 3 — Motion language    | Subagent (parallel)                | Phase 0                                                                          | `ui-ux-designer`                  |
| Phase 4 — State design       | Subagent (parallel)                | Phase 0 (uses Ch2 AsymmetricHero + Ch3 Motion via contracts, not implementation) | `ui-ux-designer`                  |
| Phase 5 — Integration        | Parent                             | Phases 1–4                                                                       | —                                 |

Parent dispatches Phases 1–4 in a single message with multiple `Agent` tool uses so they run concurrently. Each subagent commits its own work on the shared worktree branch. The parent integrates last.

---

## File structure (locked-in decomposition)

**Extended:**

- `src/styles/global.css` — token additions only (kept lean)
- `src/styles/typography.css` (NEW) — editorial type rules in `@layer base`
- `src/styles/motion.css` (renamed from `scroll-animations.css`) — motion primitives + animation keyframes
- `src/styles/state.css` (NEW) — skeleton shimmer + state surface tones
- `src/layouts/BaseLayout.astro` — wire ClientRouter
- `src/components/CollectionFilter.astro` — wire `<EmptyState>` on zero results
- `src/components/BlogPost.astro` — wrap content in `<Prose>`
- `src/components/LegalDocument.astro` — wrap content in `<Prose>`
- `src/components/PageContent.astro` — wrap content in `<Prose>`
- `src/pages/404.astro` — rewrite using `<AsymmetricHero>` + locale detection
- `src/i18n/de.json` — add `state.*` namespace
- `src/i18n/en.json` — add `state.*` namespace
- Page-level imports updated to point at migrated section paths

**New:**

- `src/components/Prose.astro` — editorial Markdown wrapper
- `src/components/Section.astro` — section frame primitive
- `src/components/sections/AsymmetricHero.astro`
- `src/components/sections/MagazineGrid.astro`
- `src/components/sections/StickyStory.astro`
- `src/components/sections/EditorialQuote.astro`
- `src/components/sections/SplitFeature.astro`
- `src/components/sections/Trust.astro` (migrated from `TrustSection.astro`)
- `src/components/sections/Comparison.astro` (migrated from `ComparisonTable.astro`)
- `src/components/sections/FAQ.astro` (migrated from `FAQs.astro`)
- `src/components/motion/Motion.astro`
- `src/components/motion/FadeUp.astro` (sugar)
- `src/components/motion/FadeIn.astro` (sugar)
- `src/components/state/Skeleton.astro`
- `src/components/state/EmptyState.astro`
- `src/components/state/ErrorState.astro`
- `src/pages/500.astro`
- `src/pages/design-floor/index.astro` (DEV-gated index of all fixture pages)
- `src/pages/design-floor/type.astro` (Chapter 1 fixture)
- `src/pages/design-floor/sections.astro` (Chapter 2 fixture)
- `src/pages/design-floor/motion.astro` (Chapter 3 fixture)
- `src/pages/design-floor/state.astro` (Chapter 4 fixture)
- `src/types/sections.ts` — shared prop shape interface for archetypes
- `src/types/motion.ts` — shared prop shape interface for Motion primitive

**Removed:**

- `src/components/TrustSection.astro` (replaced by `sections/Trust.astro`)
- `src/components/ComparisonTable.astro` (replaced by `sections/Comparison.astro`)
- `src/components/FAQs.astro` (replaced by `sections/FAQ.astro`)
- `src/styles/scroll-animations.css` (renamed to `motion.css`)

---

## Phase 0 — Foundation (sequential, parent or one subagent)

### Task 0.1: Confirm baseline

**Files:** none modified.

- [ ] **Step 1:** Verify worktree state.
      Run: `git status`. Expected: clean working tree on branch `worktree-feat+design-floor`.
- [ ] **Step 2:** Verify baseline tests pass.
      Run: `pnpm test`. Expected: 14 pass / 0 fail.
- [ ] **Step 3:** Verify baseline build passes.
      Run: `pnpm build`. Expected: completes without lint, typecheck, bilingual-check, or astro-build errors.
- [ ] **Step 4:** Audit importers of `src/styles/scroll-animations.css`.
      Run: `rg -l "scroll-animations" src/`. Expected: one match in `src/styles/global.css` only. If more, the rename task in 0.4 must update all of them.

### Task 0.2: Extend `@theme` with new tokens

**Files:**

- Modify: `src/styles/global.css` (`@theme` block)

- [ ] **Step 1:** In the `@theme` block, add typography tokens for vertical rhythm: `--leading-display: 1.05`, `--leading-heading: 1.15`, `--leading-body: 1.6`, `--leading-caption: 1.4`. Add a top-of-block comment "Type scale: perfect fourth (1.333). Existing token values regenerated from ratio."
- [ ] **Step 2:** Regenerate the existing fluid type scale values from the perfect-fourth ratio (1.333) preserving the existing `clamp()` shape: each step is the previous step × 1.333 at both min and max. Token names unchanged (`--text-display`, `--text-h1`, `--text-h2`, `--text-h3`, `--text-body-lg`, plus add `--text-body`, `--text-body-sm`, `--text-caption`, `--text-eyebrow`).
- [ ] **Step 3:** Add motion duration tokens: `--duration-instant: 80ms`, `--duration-quick: 150ms`, `--duration-base: 240ms`, `--duration-slow: 400ms`. Keep existing `--transition-fast/normal/slow` as aliases (e.g., `--transition-fast: var(--duration-quick)`) for back-compat with existing components.
- [ ] **Step 4:** Add intent-tied easing tokens: `--ease-standard`, `--ease-emphasized`, `--ease-enter`, `--ease-exit`. Keep existing `--ease-default/spring/bounce` as aliases. Use Material-3-style curves for the new ones.
- [ ] **Step 5:** Add section padding tokens: `--space-section-sm`, `--space-section-md`, `--space-section-lg`. Values: clamp() ranges that scale with viewport.
- [ ] **Step 6:** Add state surface tokens: `--color-skeleton-base`, `--color-skeleton-shimmer`, `--color-state-warning`, `--color-state-error`, `--color-state-info`. All routed through existing palette where appropriate; no raw hex outside tokens.
- [ ] **Step 7:** Add 12-col grid utility tokens: `--grid-cols-12: repeat(12, minmax(0, 1fr))`, gutter sizes via existing spacing scale.
- [ ] **Step 8:** Run `pnpm build`. Expected: passes. No usage of new tokens yet, so only validates @theme syntax.
- [ ] **Step 9:** Commit.
      Run: `git add src/styles/global.css && git commit -m "feat(design-floor): extend @theme with type, motion, section, state tokens"`

### Task 0.3: Publish interface contracts

**Files:**

- Create: `src/types/sections.ts`
- Create: `src/types/motion.ts`

- [ ] **Step 1:** Create `src/types/sections.ts` exporting a TypeScript interface `SectionProps` with: `eyebrow?: string`, `headline: string`, `lede?: string`, `tone?: 'surface' | 'elevated' | 'dark' | 'accent-wash'`, `padding?: 'sm' | 'md' | 'lg'`, `align?: 'start' | 'center'`, plus archetype-specific augmentations exported as separate interfaces (`AsymmetricHeroProps extends SectionProps`, `MagazineGridProps`, `StickyStoryProps`, `EditorialQuoteProps`, `SplitFeatureProps`). Each archetype interface defines its own additional required props (e.g., `AsymmetricHeroProps` adds `image: ImageMetadata`, `imageAlt: string`, `imagePosition?: 'right' | 'left' | 'fullbleed'`, `cta?: { label: string; href: string }`).
- [ ] **Step 2:** Create `src/types/motion.ts` exporting `MotionProps` with: `effect?: 'fade' | 'fade-up' | 'fade-down' | 'scale-in'`, `delay?: number`, `duration?: 'instant' | 'quick' | 'base' | 'slow'`, `threshold?: number`, `once?: boolean`, and an exported type alias for the dev-only fixture page entries.
- [ ] **Step 3:** Run `pnpm typecheck`. Expected: passes (types compile; no consumers yet).
- [ ] **Step 4:** Commit.
      Run: `git add src/types && git commit -m "feat(design-floor): publish section + motion interface contracts"`

### Task 0.4: Rename `scroll-animations.css` → `motion.css`

**Files:**

- Rename: `src/styles/scroll-animations.css` → `src/styles/motion.css`
- Modify: `src/styles/global.css` (import path)

- [ ] **Step 1:** Move the file.
      Run: `git mv src/styles/scroll-animations.css src/styles/motion.css`
- [ ] **Step 2:** Update the `@import "./scroll-animations.css"` line in `src/styles/global.css` to `@import "./motion.css"`.
- [ ] **Step 3:** Run `pnpm build`. Expected: passes. No content change, just rename.
- [ ] **Step 4:** Commit.
      Run: `git add -A && git commit -m "refactor(styles): rename scroll-animations.css to motion.css"`

### Task 0.5: Create dev fixture index

**Files:**

- Create: `src/pages/design-floor/index.astro`

- [ ] **Step 1:** Create the fixture index page gated by `import.meta.env.DEV` — when `false`, the page redirects to `/`. When `true`, it renders an unstyled list of links to `/design-floor/type`, `/design-floor/sections`, `/design-floor/motion`, `/design-floor/state`. Use the `BaseLayout` so chrome is consistent.
- [ ] **Step 2:** Verify by running `pnpm dev` in a background process, navigating to `/design-floor`, and confirming the four links render. Then kill the dev server.
      Acceptance: page renders four links; navigating to each link returns 404 (the chapter fixtures don't exist yet — this is expected and confirms the dev-only gating works).
- [ ] **Step 3:** Run `pnpm build`. Expected: passes. The fixture page is built statically; the `import.meta.env.DEV` check is evaluated at build time and the prod build serves the redirect.
- [ ] **Step 4:** Commit.
      Run: `git add src/pages/design-floor/index.astro && git commit -m "feat(design-floor): add dev fixture index"`

**Phase 0 done when:** all five tasks committed, `pnpm build` passes, `git log --oneline -6` shows the five commits plus the spec commit on the worktree branch.

---

## Phase 1 — Editorial type system (subagent)

**Subagent brief:** You are implementing Chapter 1 of `docs/superpowers/specs/2026-05-28-design-floor-design.md`. Read the spec's §5 before starting. Tokens from Phase 0 are landed; you consume them. Other chapters run in parallel — do not touch files outside your scope. All work commits to the existing worktree branch.

### Task 1.1: Editorial typography rules in `@layer base`

**Files:**

- Create: `src/styles/typography.css`
- Modify: `src/styles/global.css` (add import, remove duplicated heading/body rules)

- [ ] **Step 1:** Create `src/styles/typography.css`. Add an `@layer base` block that sets `font-variation-settings` on `html` using Inter Variable's `opsz` axis — body uses default `opsz: 16`, display elements (h1, hero classes) use `opsz: 32` via a `.text-display` utility class. Set `font-feature-settings` defaults on `body`: `"liga", "calt", "kern", "onum"`. Override on `h1, h2, h3, h4, h5, h6`: `"liga", "calt", "kern", "ss01"`. Override on `table, .tabular`: `"tnum", "lnum"`. Override on `code, pre`: `"liga" 0`.
- [ ] **Step 2:** In the same `@layer base`, apply the vertical-rhythm tokens: `h1` uses `--leading-heading`, `body` uses `--leading-body`, `.text-caption` uses `--leading-caption`, `.text-display` uses `--leading-display`. Paragraph margins (`p + p`) tuned to land on rhythm — use `margin-block-start: calc(var(--leading-body) * 0.5em)`.
- [ ] **Step 3:** Apply per-level heading tracking: `.text-display` → `--tracking-display` (already `-0.05em`), `h1` → `-0.04em`, `h2` → `-0.03em`, `h3` → `-0.02em`. Use CSS custom properties or direct values from the existing tracking tokens.
- [ ] **Step 4:** In `src/styles/global.css`, add `@import "./typography.css"` after the existing motion import. Remove any heading/body rules from `global.css` that are now superseded by `typography.css` (the existing `@layer base { body { ... } h1...h6 { ... } a { ... } ::selection { ... } }` block — keep `a` and `::selection` in `global.css`; move heading and body rules into `typography.css`).
- [ ] **Step 5:** Run `pnpm build`. Expected: passes.
- [ ] **Step 6:** Visual check via dev server: navigate to home page, blog post, services. Expected: typography looks tighter and more deliberate; no layout breakage.
- [ ] **Step 7:** Commit.
      Run: `git add src/styles/ && git commit -m "feat(typography): editorial type system — opsz, opentype features, vertical rhythm"`

### Task 1.2: `<Prose>` primitive

**Files:**

- Create: `src/components/Prose.astro`

- [ ] **Step 1:** Create `src/components/Prose.astro`. Props (TypeScript interface): `dropCap?: boolean`, `measure?: 'tight' | 'default' | 'wide'` (defaults to `'default'`). The component renders a `<div>` with a class that owns the long-form measure cap. Measure values: tight 60ch, default 70ch, wide 80ch. On mobile (`< 640px`), measure is `100%` — overrides via media query.
- [ ] **Step 2:** Add a scoped `<style>` block: when `dropCap` is true, the first paragraph's first letter uses `::first-letter` styling — large display-sized initial cap, floated left, `line-height: 0.85`, `margin-inline-end: 0.1em`, `padding-block-start: 0.05em`. Apply `hanging-punctuation: first` to the prose container — graceful no-op in unsupported browsers.
- [ ] **Step 3:** The component uses `<slot />` for content. No `client:` directive; static rendering.
- [ ] **Step 4:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 5:** Commit.
      Run: `git add src/components/Prose.astro && git commit -m "feat(components): add Prose primitive (drop-cap, hanging-punctuation, measure cap)"`

### Task 1.3: Chapter 1 fixture page

**Files:**

- Create: `src/pages/design-floor/type.astro`

- [ ] **Step 1:** Create `src/pages/design-floor/type.astro` gated by `import.meta.env.DEV`. The page renders, in order: a sample of every heading level (h1–h6) with realistic copy in DE and EN; a sample paragraph using `<Prose>` with default measure; a sample paragraph using `<Prose dropCap>`; a numeric data table with tabular figures; a code block (ligatures off should be visible).
- [ ] **Step 2:** Visit via dev server. Verify: each heading uses its tracking; oldstyle figures appear in paragraph numerals (e.g., "1985" should sit on the baseline with descenders); tabular figures align in the table; the drop-cap variant renders; the measure caps at the configured value and the page does not exceed it.
- [ ] **Step 3:** Run `pnpm build`. Expected: passes.
- [ ] **Step 4:** Commit.
      Run: `git add src/pages/design-floor/type.astro && git commit -m "feat(design-floor): add Chapter 1 type fixture page"`

### Task 1.4: Wire `<Prose>` into Markdown-rendering components

**Files:**

- Modify: `src/components/BlogPost.astro`
- Modify: `src/components/LegalDocument.astro`
- Modify: `src/components/PageContent.astro`

- [ ] **Step 1:** In `BlogPost.astro`, locate the slot/content area that renders the Markdown body. Wrap it with `<Prose dropCap>` (blog posts feel editorial with a drop cap). Update imports.
- [ ] **Step 2:** In `LegalDocument.astro`, wrap the content area with `<Prose measure="wide">` (legal copy benefits from a wider measure since it's read in detail). No drop cap.
- [ ] **Step 3:** In `PageContent.astro`, wrap the content area with `<Prose>` (default measure, no drop cap).
- [ ] **Step 4:** Run `pnpm build`. Expected: passes.
- [ ] **Step 5:** Visit dev server: a blog post (DE and EN), the imprint page, a services page. Verify: prose width caps at the measure; blog post first letter has a drop cap; nothing broken visually.
- [ ] **Step 6:** Commit.
      Run: `git add src/components/{BlogPost,LegalDocument,PageContent}.astro && git commit -m "feat(content): wrap Markdown components in Prose primitive"`

**Phase 1 done when:** all four tasks committed, `pnpm build` + `pnpm check:all` pass, `/design-floor/type` renders every sample without error.

---

## Phase 2 — Section archetype library (subagent)

**Subagent brief:** You are implementing Chapter 2 of `docs/superpowers/specs/2026-05-28-design-floor-design.md`. Read the spec's §6 before starting. Phase 0 tokens are landed; the interface contracts in `src/types/sections.ts` are your prop-shape source of truth. Do not touch other chapters' files. Commit each task on the worktree branch.

### Task 2.1: `<Section>` frame primitive

**Files:**

- Create: `src/components/Section.astro`

- [ ] **Step 1:** Create `src/components/Section.astro`. Props: `tone?: 'surface' | 'elevated' | 'dark' | 'accent-wash'` (default `'surface'`), `padding?: 'sm' | 'md' | 'lg'` (default `'md'`), `container?: 'narrow' | 'default' | 'wide' | 'full'` (default `'default'`), `as?: keyof HTMLElementTagNameMap` (default `'section'`). Render the `as` element with appropriate background color from tone tokens (surface uses `--color-surface`, elevated uses `--color-surface-elevated`, dark uses `--color-surface-dark` + flips text to `--color-text-on-dark`, accent-wash uses a subtle accent tint). Vertical padding from the padding token (`--space-section-sm/md/lg`). Inner `<div>` constrains max-width: narrow=48rem, default=72rem, wide=80rem, full=none. Centered with `margin-inline: auto`.
- [ ] **Step 2:** Use `<slot />` for content. No `client:` directive; static rendering.
- [ ] **Step 3:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 4:** Commit.
      Run: `git add src/components/Section.astro && git commit -m "feat(components): add Section frame primitive"`

### Task 2.2: `<AsymmetricHero>` archetype

**Files:**

- Create: `src/components/sections/AsymmetricHero.astro`

- [ ] **Step 1:** Create `src/components/sections/AsymmetricHero.astro`. Import `AsymmetricHeroProps` from `~/types/sections`. Use `<Section padding="lg" tone={tone}>` as the frame. Inside: a 12-col grid (via `--grid-cols-12`) with the text column spanning 7 cols (default — image on right) or 5 cols (when `imagePosition === 'right'`, image gets 7); the columns swap when `imagePosition === 'left'`. Use `grid-row` to apply the intentional vertical offset: text column starts at row 1, image column starts at row 1 but with `margin-block-start` of `2rem` on `md:` breakpoint upward (creates the visual asymmetry).
- [ ] **Step 2:** Inside the text column: `eyebrow` (if present, in a `<span class="text-eyebrow">`), `headline` in a `<h1 class="text-display">`, `lede` (if present, in `<p class="text-body-lg">`), `cta` link (if present, using the existing Button component).
- [ ] **Step 3:** Inside the image column: use Astro's `<Image>` component from `astro:assets` with the provided `image` and `imageAlt`. `loading="eager"` since hero is above-the-fold. Apply `border-radius: var(--radius-card)`.
- [ ] **Step 4:** Handle the `imagePosition === 'fullbleed'` variant: text column overlays the image with a darkened gradient overlay (use `--color-surface-dark` at 60% opacity); text column becomes white via the existing dark-mode text token.
- [ ] **Step 5:** Mobile (< 640px): single column, text first, image second. The asymmetric offset is desktop-only.
- [ ] **Step 6:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 7:** Commit.
      Run: `git add src/components/sections/AsymmetricHero.astro && git commit -m "feat(sections): add AsymmetricHero archetype"`

### Task 2.3: `<MagazineGrid>` archetype

**Files:**

- Create: `src/components/sections/MagazineGrid.astro`

- [ ] **Step 1:** Create `src/components/sections/MagazineGrid.astro`. Props (extending SectionProps): `cells: Array<{ size: 'small' | 'medium' | 'large'; headline: string; lede?: string; image?: ImageMetadata; imageAlt?: string; href?: string }>`. Use `<Section>` as frame.
- [ ] **Step 2:** Inside: 12-col grid. Large cells span 8 cols and render image (if present) + headline (h2) + lede. Medium cells span 6 cols, headline + lede, optional image. Small cells span 4 cols, headline (h3) + optional lede. Cells flow naturally; the consumer is responsible for ordering. Mobile: all cells full-width.
- [ ] **Step 3:** If a cell has `href`, the entire cell becomes a link with a focus-visible ring. Touch target ≥ 44px (cells naturally exceed this).
- [ ] **Step 4:** Apply hover lift micro-interaction stub: `transform: translateY(-2px)` on cell hover, transitioned with `--duration-base var(--ease-standard)` — this is harmonized later in Chapter 3, but the local rule lives here for now.
- [ ] **Step 5:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 6:** Commit.
      Run: `git add src/components/sections/MagazineGrid.astro && git commit -m "feat(sections): add MagazineGrid archetype"`

### Task 2.4: `<StickyStory>` archetype (layout only)

**Files:**

- Create: `src/components/sections/StickyStory.astro`

- [ ] **Step 1:** Create `src/components/sections/StickyStory.astro`. Props: `chapters: Array<{ headline: string; body: string; image: ImageMetadata; imageAlt: string }>`. Use `<Section>` as frame.
- [ ] **Step 2:** Layout: two columns on `md:` breakpoint upward — left column (5/12) contains the copy stack (each chapter as a block, separated by `--space-section-md`), right column (7/12) contains the visuals stack. On the left column, apply `position: sticky; top: 4rem` and `height: fit-content` so the copy pins while the visuals scroll. (The motion adapter in Phase 3 will refine this and handle reduced-motion.)
- [ ] **Step 3:** Mobile (< 768px): single column, alternating headline/body/image blocks. No sticky behavior.
- [ ] **Step 4:** Add a placeholder comment near the sticky CSS: `/* StickyStory motion adapter wires reduced-motion handling in Phase 3 */`.
- [ ] **Step 5:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 6:** Commit.
      Run: `git add src/components/sections/StickyStory.astro && git commit -m "feat(sections): add StickyStory archetype (layout only; motion in Ch3)"`

### Task 2.5: `<EditorialQuote>` archetype

**Files:**

- Create: `src/components/sections/EditorialQuote.astro`

- [ ] **Step 1:** Create `src/components/sections/EditorialQuote.astro`. Props: `quote: string`, `attribution: { name: string; role?: string; avatar?: ImageMetadata; avatarAlt?: string }`, plus inherited SectionProps. Use `<Section padding="lg" container="narrow">`.
- [ ] **Step 2:** Render: a large open quote mark (use `&ldquo;` styled via `::before` on the `<blockquote>` with size from `--text-display` and `opacity: 0.15`), the quote text in a `<blockquote class="text-h1">`, a closing dash and attribution name + role below. If avatar provided, render via `<Image>` in a circle (use `--radius-2xl` doubled, or `border-radius: 9999px`).
- [ ] **Step 3:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 4:** Commit.
      Run: `git add src/components/sections/EditorialQuote.astro && git commit -m "feat(sections): add EditorialQuote archetype"`

### Task 2.6: `<SplitFeature>` archetype

**Files:**

- Create: `src/components/sections/SplitFeature.astro`

- [ ] **Step 1:** Create `src/components/sections/SplitFeature.astro`. Props: `features: Array<{ headline: string; body: string; image: ImageMetadata; imageAlt: string; cta?: { label: string; href: string } }>`, plus inherited SectionProps. Use `<Section padding="lg">`.
- [ ] **Step 2:** For each feature, render a row with two columns 6/6 — odd rows have image on the right, even rows have image on the left (alternating via `:nth-child(even) { grid-template-columns: ...reversed }` or by toggling a class). Vertical spacing between rows from `--space-section-md`. Inside each column, use the vertical-rhythm tokens from Chapter 1.
- [ ] **Step 3:** Mobile: stack as single column, image first, then headline/body/CTA.
- [ ] **Step 4:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 5:** Commit.
      Run: `git add src/components/sections/SplitFeature.astro && git commit -m "feat(sections): add SplitFeature archetype"`

### Task 2.7: Migrate `TrustSection` → `sections/Trust`

**Files:**

- Create: `src/components/sections/Trust.astro` (from `TrustSection.astro` content)
- Remove: `src/components/TrustSection.astro`
- Modify: any consumer that imports `TrustSection`

- [ ] **Step 1:** Locate consumers of `TrustSection`.
      Run: `rg -l "TrustSection" src/`. Expected: small list.
- [ ] **Step 2:** Copy `src/components/TrustSection.astro` to `src/components/sections/Trust.astro`. Update the new file to use `<Section>` as its frame (replacing whatever wrapper was there). Harmonize props to `SectionProps` shape — `eyebrow`, `headline`, `lede`, plus any existing trust-specific props (logos array etc.). Use the inherited `tone`, `padding`, `align` rather than local hardcoded values.
- [ ] **Step 3:** Update every consumer found in Step 1: change import path from `~/components/TrustSection.astro` to `~/components/sections/Trust.astro`, change tag from `<TrustSection>` to `<Trust>`. Adjust any prop names that needed renaming for the harmonized shape.
- [ ] **Step 4:** Delete `src/components/TrustSection.astro`.
      Run: `git rm src/components/TrustSection.astro`
- [ ] **Step 5:** Run `pnpm build`. Expected: passes (no dangling imports).
- [ ] **Step 6:** Commit.
      Run: `git add -A && git commit -m "refactor(sections): migrate TrustSection to sections/Trust with harmonized props"`

### Task 2.8: Migrate `ComparisonTable` → `sections/Comparison`

**Files:**

- Create: `src/components/sections/Comparison.astro`
- Remove: `src/components/ComparisonTable.astro`
- Modify: consumers

- [ ] **Step 1:** Locate consumers.
      Run: `rg -l "ComparisonTable" src/`. Expected: small list.
- [ ] **Step 2:** Copy `src/components/ComparisonTable.astro` to `src/components/sections/Comparison.astro`. Wrap in `<Section>`, harmonize props (`eyebrow`, `headline`, `lede`, plus comparison-specific `columns`, `rows`).
- [ ] **Step 3:** Update consumers: import path + tag rename.
- [ ] **Step 4:** Delete original.
      Run: `git rm src/components/ComparisonTable.astro`
- [ ] **Step 5:** Run `pnpm build`. Expected: passes.
- [ ] **Step 6:** Commit.
      Run: `git add -A && git commit -m "refactor(sections): migrate ComparisonTable to sections/Comparison"`

### Task 2.9: Migrate `FAQs` → `sections/FAQ`

**Files:**

- Create: `src/components/sections/FAQ.astro`
- Remove: `src/components/FAQs.astro`
- Modify: consumers

- [ ] **Step 1:** Locate consumers.
      Run: `rg -l "FAQs" src/`. Expected: small list (also catch any string "FAQs" that's content text — verify each match is an import or tag, not body copy).
- [ ] **Step 2:** Copy `src/components/FAQs.astro` to `src/components/sections/FAQ.astro`. Wrap in `<Section>`, harmonize props.
- [ ] **Step 3:** Update consumers.
- [ ] **Step 4:** Delete original.
      Run: `git rm src/components/FAQs.astro`
- [ ] **Step 5:** Run `pnpm build`. Expected: passes.
- [ ] **Step 6:** Commit.
      Run: `git add -A && git commit -m "refactor(sections): migrate FAQs to sections/FAQ"`

### Task 2.10: Chapter 2 fixture page

**Files:**

- Create: `src/pages/design-floor/sections.astro`

- [ ] **Step 1:** Create `src/pages/design-floor/sections.astro` (DEV-gated). Render one realistic instance of each archetype with placeholder content: AsymmetricHero (image-right default, then image-left, then fullbleed), MagazineGrid (mix of small/medium/large cells), StickyStory (3 chapters), EditorialQuote (with avatar), SplitFeature (3 features), plus the three migrated sections (Trust, Comparison, FAQ).
- [ ] **Step 2:** Run dev server, visit `/design-floor/sections`. Verify: each archetype renders, the 7/5 asymmetric ratio is visible on AsymmetricHero, MagazineGrid layouts cells correctly, StickyStory's sticky behavior works on desktop, the three migrated sections render with consistent padding/tones.
- [ ] **Step 3:** Verify mobile: resize to 375px, every section reflows to single-column without horizontal scroll.
- [ ] **Step 4:** Run `pnpm build`. Expected: passes.
- [ ] **Step 5:** Commit.
      Run: `git add src/pages/design-floor/sections.astro && git commit -m "feat(design-floor): add Chapter 2 sections fixture page"`

**Phase 2 done when:** all ten tasks committed, `pnpm build` + `pnpm check:all` pass, `/design-floor/sections` renders every archetype without error in both DE and EN previews (use the language switcher).

---

## Phase 3 — Motion language (subagent)

**Subagent brief:** You are implementing Chapter 3 of `docs/superpowers/specs/2026-05-28-design-floor-design.md`. Read the spec's §7 before starting. Phase 0 tokens are landed; the `MotionProps` contract in `src/types/motion.ts` is your prop source of truth. Phase 2's StickyStory has a placeholder comment — that's the one cross-chapter touch you make. Otherwise, do not edit Phase 1/2/4 files.

### Task 3.1: Wire ClientRouter view transitions

**Files:**

- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1:** Open `src/layouts/BaseLayout.astro`. Import `ClientRouter` from `astro:transitions`. Render `<ClientRouter />` inside `<head>`.
- [ ] **Step 2:** Add a `transition:animate="fade"` attribute on the main content slot wrapper, OR use CSS named view transitions — preferred. Define in `motion.css`: `@view-transition { navigation: auto; }`, then for the `<main>` element use `view-transition-name: page-main`, and for `<header>`, `view-transition-name: page-header`. Add CSS `::view-transition-old(page-main)` and `::view-transition-new(page-main)` with cross-fade + 8px translateY animation using `--duration-base var(--ease-standard)`. Header stays put.
- [ ] **Step 3:** Run dev server, navigate between pages (home → services → blog → blog post). Expected: smooth crossfade-slide on content, header stays in place.
- [ ] **Step 4:** Verify PostHog SPA pageview firing: if `PUBLIC_POSTHOG_API_KEY` env var is set, navigate and check `window.posthog.capture` is called for each transition. If PostHog component already handles this via its router config, no change needed; if not, add a `astro:after-swap` listener that re-fires `posthog.capture('$pageview')`. Document the result.
- [ ] **Step 5:** Verify GA4 pageview firing: similar check — `gtag('event', 'page_view', { ... })` must fire on `astro:after-swap`. Update the GTM/GA4 component if needed.
- [ ] **Step 6:** Run `pnpm build`. Expected: passes.
- [ ] **Step 7:** Commit.
      Run: `git add -A && git commit -m "feat(motion): wire ClientRouter view transitions site-wide"`

### Task 3.2: `<Motion>` primitive

**Files:**

- Create: `src/components/motion/Motion.astro`

- [ ] **Step 1:** Create `src/components/motion/Motion.astro`. Import `MotionProps` from `~/types/motion`. Render a `<div>` with `data-motion-effect={effect}`, `data-motion-delay={delay}`, `data-motion-duration={duration}`, `data-motion-threshold={threshold}`, `data-motion-once={once}`. Use `<slot />` inside.
- [ ] **Step 2:** Add scoped CSS targeting `[data-motion-effect="fade-up"]`, etc. Set initial state (`opacity: 0; transform: translateY(8px)` for `fade-up`); target state (`opacity: 1; transform: none`). Apply transition using the duration token mapped from the prop (e.g., `duration="base"` → `var(--duration-base)`). Wrap in `@media (prefers-reduced-motion: no-preference)` so reduced-motion users see the target state immediately.
- [ ] **Step 3:** Use CSS `animation-timeline: view()` where supported: the element animates as it enters the viewport. Use `@supports (animation-timeline: view())` for the modern path; the IntersectionObserver fallback (Step 4) lives outside the `@supports` block.
- [ ] **Step 4:** Add a small client script (inline in the Astro component) — gated behind `@supports not (animation-timeline: view())` would not work in JS, so detect via feature test in JS: `if (!CSS.supports('animation-timeline', 'view()'))` set up an IntersectionObserver that adds `data-motion-visible="true"` to elements when their intersection ratio crosses the threshold. CSS targets `[data-motion-visible="true"]` to apply the target state. Honor `once` by disconnecting the observer for that element after first trigger.
- [ ] **Step 5:** Test by adding a `<Motion effect="fade-up">` instance to the `/design-floor/sections` page header temporarily. Reload. Expected: element fades in from below as it enters viewport. Toggle `prefers-reduced-motion: reduce` in DevTools. Expected: element appears in target state immediately, no animation. Remove the temporary instance.
- [ ] **Step 6:** Run `pnpm build`. Expected: passes.
- [ ] **Step 7:** Commit.
      Run: `git add src/components/motion/Motion.astro && git commit -m "feat(motion): add Motion primitive with animation-timeline + IO fallback"`

### Task 3.3: Sugar primitives (`FadeUp`, `FadeIn`)

**Files:**

- Create: `src/components/motion/FadeUp.astro`
- Create: `src/components/motion/FadeIn.astro`

- [ ] **Step 1:** Create `FadeUp.astro` as a thin wrapper around `<Motion effect="fade-up" duration="base">` with passthrough for `delay`, `threshold`, `once`. Same for `FadeIn.astro` → `<Motion effect="fade">`.
- [ ] **Step 2:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 3:** Commit.
      Run: `git add src/components/motion/ && git commit -m "feat(motion): add FadeUp and FadeIn sugar primitives"`

### Task 3.4: Standardize micro-interactions

**Files:**

- Modify: `src/styles/motion.css`

- [ ] **Step 1:** In `motion.css`, add a `@layer components` block with standardized micro-interactions. For buttons (`.btn, button[type="submit"]`): on `:active`, `transform: translateY(1px)`, transition `--duration-instant var(--ease-standard)`. For cards (`[class*="card"]`): on `:hover`, `transform: translateY(-2px)` + larger shadow, transition `--duration-base var(--ease-standard)`. For inputs (`input, textarea, select`): on `:focus-visible`, the existing focus ring glows via `box-shadow` transitioned with `--duration-quick var(--ease-standard)`.
- [ ] **Step 2:** Wrap each rule in `@media (prefers-reduced-motion: no-preference)`.
- [ ] **Step 3:** Run dev server, hover/click/focus across home page. Verify: buttons depress on press, cards lift on hover, focus ring glows.
- [ ] **Step 4:** Test reduced-motion via DevTools toggle. Verify: no transform animations, focus ring still appears but without transition.
- [ ] **Step 5:** Run `pnpm build`. Expected: passes.
- [ ] **Step 6:** Commit.
      Run: `git add src/styles/motion.css && git commit -m "feat(motion): standardize button/card/input micro-interactions"`

### Task 3.5: StickyStory motion adapter

**Files:**

- Modify: `src/components/sections/StickyStory.astro`
- Modify: `src/styles/motion.css`

- [ ] **Step 1:** In `StickyStory.astro`, locate the placeholder comment from Phase 2. Replace with: wrap the sticky CSS in `@media (prefers-reduced-motion: no-preference)`. Under reduced motion, the left column does NOT use `position: sticky` — it becomes a normal block flowing with content.
- [ ] **Step 2:** Add an IntersectionObserver-based progress signal: as each chapter (in the visuals stack on the right) enters the viewport, the corresponding copy block on the left gets a `data-active="true"` attribute. CSS uses this to subtly highlight the active chapter (e.g., `opacity: 1` for active, `opacity: 0.4` for inactive). Add the client script inline.
- [ ] **Step 3:** Test on dev server `/design-floor/sections`. Scroll the StickyStory section. Verify: copy column sticks (desktop), each chapter dims/brightens as the corresponding visual enters the viewport.
- [ ] **Step 4:** Toggle reduced-motion. Verify: sticky behavior disabled, no active-chapter dimming animation, chapters always appear at full opacity.
- [ ] **Step 5:** Run `pnpm build`. Expected: passes.
- [ ] **Step 6:** Commit.
      Run: `git add -A && git commit -m "feat(motion): wire StickyStory adapter with reduced-motion fallback"`

### Task 3.6: Chapter 3 fixture page

**Files:**

- Create: `src/pages/design-floor/motion.astro`

- [ ] **Step 1:** Create `src/pages/design-floor/motion.astro` (DEV-gated). Render: examples of each Motion effect (`fade`, `fade-up`, `fade-down`, `scale-in`) in a vertical stack so scrolling triggers them; instances of `FadeUp` and `FadeIn` sugar primitives; a button row to verify press depression; a card grid to verify hover lift; a form to verify focus glow. Add a heading at top that calls out: "Toggle prefers-reduced-motion in DevTools to verify the static-fallback state."
- [ ] **Step 2:** Visit dev server. Verify all listed behaviors. Toggle reduced-motion. Verify static fallback for each.
- [ ] **Step 3:** Run `pnpm build`. Expected: passes.
- [ ] **Step 4:** Commit.
      Run: `git add src/pages/design-floor/motion.astro && git commit -m "feat(design-floor): add Chapter 3 motion fixture page"`

**Phase 3 done when:** all six tasks committed, `pnpm build` + `pnpm check:all` pass, `/design-floor/motion` exercises every primitive cleanly in normal and reduced-motion modes, view transitions work site-wide, PostHog + GA4 SPA pageviews verified.

---

## Phase 4 — State design (subagent)

**Subagent brief:** You are implementing Chapter 4 of `docs/superpowers/specs/2026-05-28-design-floor-design.md`. Read the spec's §8 before starting. Phase 0 tokens are landed. Your work depends on Chapter 2's AsymmetricHero (used by 404) and Chapter 3's Motion primitive (optional polish on state surfaces) via the interface contracts — you can build state primitives and i18n strings independently and wire 404 last after Phase 2 lands. If you finish before Phase 2, use a temporary inline hero on 404 and swap when AsymmetricHero is committed.

### Task 4.1: `<Skeleton>` primitive

**Files:**

- Create: `src/styles/state.css`
- Create: `src/components/state/Skeleton.astro`
- Modify: `src/styles/global.css` (add import)

- [ ] **Step 1:** Create `src/styles/state.css`. Define the shimmer keyframe (`@keyframes skeleton-shimmer`): a linear-gradient background-position animation from `200% 0` to `-200% 0`, looping. Define the `.skeleton` base class: background uses `--color-skeleton-base`, with a `linear-gradient` overlay using `--color-skeleton-shimmer` that animates via `skeleton-shimmer` at `var(--duration-slow)` × 4 (≈ 1.6s) linear infinite. Wrap the animation in `@media (prefers-reduced-motion: no-preference)`. Under reduced motion: no animation, just the static base color.
- [ ] **Step 2:** Add `@import "./state.css"` to `global.css` after the typography and motion imports.
- [ ] **Step 3:** Create `src/components/state/Skeleton.astro`. Props: `variant: 'text' | 'card' | 'image' | 'circle'`, `lines?: number` (for text variant, default 1), `width?: string` (CSS length), `height?: string` (CSS length). Renders a `<div class="skeleton skeleton-{variant}">` with appropriate dimensions: text variant uses `height: 1em * line-height` per line and stacks; card uses props or defaults to `12rem` height + `--radius-card`; image uses provided width/height + `--radius-md`; circle uses width=height + `border-radius: 9999px`.
- [ ] **Step 4:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 5:** Commit.
      Run: `git add -A && git commit -m "feat(state): add Skeleton primitive with reduced-motion fallback"`

### Task 4.2: `<EmptyState>` primitive

**Files:**

- Create: `src/components/state/EmptyState.astro`

- [ ] **Step 1:** Create `src/components/state/EmptyState.astro`. Props: `headline: string`, `body: string`, `cta: { label: string; href: string }` (required — no dead-end empties), plus an illustration `<slot name="illustration" />` (optional). Renders a centered block with: illustration (or a default lucide icon like `inbox`), headline as h3, body as p, CTA button.
- [ ] **Step 2:** Apply muted tone — body text uses `--color-muted`, the block centered with generous vertical padding.
- [ ] **Step 3:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 4:** Commit.
      Run: `git add src/components/state/EmptyState.astro && git commit -m "feat(state): add EmptyState primitive"`

### Task 4.3: `<ErrorState>` primitive

**Files:**

- Create: `src/components/state/ErrorState.astro`

- [ ] **Step 1:** Create `src/components/state/ErrorState.astro`. Props: `tone: 'warning' | 'error' | 'info'`, `headline: string`, `body: string`, `retry?: { label: string; onClick?: never; href?: string }` (link-based retry; no JS handlers in static output). Renders an inline block with: a lucide icon matching tone (`alert-triangle` for warning, `alert-circle` for error, `info` for info), headline (bold), body, optional retry link.
- [ ] **Step 2:** Background tone uses the matching state surface token (`--color-state-warning/error/info`) at low opacity (~10%); border uses the same token at full opacity. Foreground text uses `--color-text-heading` for legibility.
- [ ] **Step 3:** Run `pnpm typecheck`. Expected: passes.
- [ ] **Step 4:** Commit.
      Run: `git add src/components/state/ErrorState.astro && git commit -m "feat(state): add ErrorState primitive"`

### Task 4.4: Add `state` i18n namespace

**Files:**

- Modify: `src/i18n/de.json`
- Modify: `src/i18n/en.json`

- [ ] **Step 1:** Add to both files a nested `state` object with keys: `404.title`, `404.body`, `404.cta`, `500.title`, `500.body`, `500.cta`, `empty.posts.headline`, `empty.posts.body`, `empty.posts.cta`, `empty.filters.headline`, `empty.filters.body`, `empty.filters.cta`, `error.generic.headline`, `error.generic.body`, `error.retry`. Write idiomatic, brand-aligned copy in each locale (calm, helpful, never jokey). Use the existing translation key naming style.
- [ ] **Step 2:** Run `pnpm test`. Expected: 14 pass (bilingual check confirms parallel structure).
- [ ] **Step 3:** Run `pnpm check:spelling`. Expected: passes (any new German nouns added to `project-words.txt` if cspell flags them).
- [ ] **Step 4:** Commit.
      Run: `git add src/i18n/ project-words.txt && git commit -m "feat(i18n): add state namespace strings (404, 500, empty, error) in DE + EN"`

### Task 4.5: Wire `CollectionFilter` empty state

**Files:**

- Modify: `src/components/CollectionFilter.astro`

- [ ] **Step 1:** Locate the rendering branch in `CollectionFilter.astro` that handles zero results (or absence of any rendering when results are empty). Wrap or replace with `<EmptyState>` using `state.empty.filters.{headline,body,cta}` via `useTranslations(locale)`. The CTA should link back to the unfiltered collection (e.g., `/blog` or `/en/blog` depending on locale).
- [ ] **Step 2:** Visit dev server `/blog` (DE) and apply filters that return no results (use a non-existent tag query param). Verify EmptyState renders with DE copy. Switch to `/en/blog` and repeat. Verify EN copy.
- [ ] **Step 3:** Run `pnpm build`. Expected: passes.
- [ ] **Step 4:** Commit.
      Run: `git add src/components/CollectionFilter.astro && git commit -m "feat(state): wire CollectionFilter empty state"`

### Task 4.6: Redesign 404 page

**Files:**

- Modify: `src/pages/404.astro`

- [ ] **Step 1:** Open `src/pages/404.astro`. Replace existing markup with `<BaseLayout>` containing `<AsymmetricHero>`. Detect locale from `Astro.url.pathname` (mirror the catch-all `[...path].astro` logic — if path starts with `/en`, locale is `'en'`, else `'de'`). Pull copy from `state.404.{title,body,cta}` via `useTranslations(locale)`.
- [ ] **Step 2:** AsymmetricHero props: `eyebrow="404"`, `headline={t('state.404.title')}`, `lede={t('state.404.body')}`, `cta={{ label: t('state.404.cta'), href: locale === 'en' ? '/en/' : '/' }}`. Provide a placeholder image (existing brand asset, e.g., a muted version of the warm-accent illustration).
- [ ] **Step 3:** Visit dev server `/this-does-not-exist`. Verify: 404 renders with DE copy + AsymmetricHero layout. Visit `/en/this-does-not-exist`. Verify: 404 renders with EN copy.
- [ ] **Step 4:** Run `pnpm build`. Expected: passes.
- [ ] **Step 5:** Commit.
      Run: `git add src/pages/404.astro && git commit -m "feat(state): redesign 404 with AsymmetricHero + locale detection"`

### Task 4.7: Add 500 page

**Files:**

- Create: `src/pages/500.astro`

- [ ] **Step 1:** Create `src/pages/500.astro`. Mirror the 404 structure: `BaseLayout` + `AsymmetricHero` + locale detection + copy from `state.500.*`. Use a calmer tone — eyebrow can be a status-style label like "Something went wrong", headline is the t() title, body the t() body. CTA goes to the home page in the appropriate locale.
- [ ] **Step 2:** Note: Cloudflare Pages serves the file at `/500.html` when a function errors. Astro's static build produces this from `src/pages/500.astro`.
- [ ] **Step 3:** Visit dev server `/500` (Astro routes it explicitly). Verify rendering in both locales by toggling the URL prefix.
- [ ] **Step 4:** Run `pnpm build`. Expected: passes. Verify `dist/500/index.html` (or `dist/500.html`) exists in the output.
- [ ] **Step 5:** Commit.
      Run: `git add src/pages/500.astro && git commit -m "feat(state): add 500 page with calm tone and locale detection"`

### Task 4.8: Chapter 4 fixture page

**Files:**

- Create: `src/pages/design-floor/state.astro`

- [ ] **Step 1:** Create `src/pages/design-floor/state.astro` (DEV-gated). Render: a grid of Skeleton variants (text 1/2/3 lines, card, image, circle); an EmptyState instance (using empty.posts strings); an ErrorState instance for each tone (warning, error, info); links to `/404-test` and `/500-test` with notes that they preview the redesigned state pages.
- [ ] **Step 2:** Visit dev server `/design-floor/state`. Verify: every variant renders. Toggle reduced-motion. Verify: skeleton shimmer disabled (becomes static muted block).
- [ ] **Step 3:** Run `pnpm build`. Expected: passes.
- [ ] **Step 4:** Commit.
      Run: `git add src/pages/design-floor/state.astro && git commit -m "feat(design-floor): add Chapter 4 state fixture page"`

**Phase 4 done when:** all eight tasks committed, `pnpm build` + `pnpm check:all` pass, `/design-floor/state` renders every primitive in both motion states, 404 and 500 render correctly in DE and EN.

---

## Phase 5 — Integration (parent agent)

### Task 5.1: Merge verification

**Files:** none modified.

- [ ] **Step 1:** Confirm all four subagent phases committed cleanly.
      Run: `git log --oneline -50` and verify a coherent commit history with Phase 0 → 1 → 2 → 3 → 4 commits.
- [ ] **Step 2:** Confirm no dangling files from migrations.
      Run: `rg -l "TrustSection|ComparisonTable|FAQs\b" src/` — expected: no matches (or only in comments/historical notes). If matches exist, fix or remove.
- [ ] **Step 3:** Confirm no orphan imports.
      Run: `pnpm typecheck`. Expected: passes.

### Task 5.2: Full quality gate

**Files:** none modified.

- [ ] **Step 1:** Run `pnpm build`. Expected: passes (lint, typecheck, bilingual check, Astro build).
- [ ] **Step 2:** Run `pnpm check:all`. Expected: passes (spelling, a11y, build, link check).
- [ ] **Step 3:** If any check fails, fix in place and re-run until green. Commit fixes individually.

### Task 5.3: Manual visual review

**Files:** none modified.

- [ ] **Step 1:** Start dev server.
      Run: `pnpm dev` (background).
- [ ] **Step 2:** Walk through: `/`, `/leistungen` (DE services), `/en/`, `/en/services`, a blog post in DE, a blog post in EN, the imprint, `/this-does-not-exist` (404), `/design-floor/index`, then visit each fixture page.
- [ ] **Step 3:** For each page, verify in browser: typography looks editorial; sections render at the right padding/tone; view transitions work smoothly between routes; reduced-motion (DevTools toggle) gives the static fallback; mobile (375px) reflows cleanly; no console errors.
- [ ] **Step 4:** Kill dev server.

### Task 5.4: Final commit + push + PR

**Files:** none modified directly; this is the integration handoff.

- [ ] **Step 1:** Confirm clean working tree.
      Run: `git status`. Expected: clean.
- [ ] **Step 2:** Push the branch.
      Run: `git push -u origin worktree-feat+design-floor`.
- [ ] **Step 3:** Open a PR.
      Run: `gh pr create --fill` and replace title/body with: title "feat(design-floor): editorial type, section archetypes, motion language, state design (Spec 1)"; body summarizes the four chapters, links to the spec doc, and includes a test plan checklist mirroring §10 of the spec.
- [ ] **Step 4:** Verify CI runs. Wait for Cloudflare Pages preview URL to appear in the PR comment. Visit the preview, repeat a quick walk-through.
- [ ] **Step 5:** Report PR URL to the user.

**Phase 5 done when:** PR is open, CI green, preview URL verified. Squash-merge happens at user discretion (per CLAUDE.md §15).

---

## Out of scope (cross-reference with spec §11)

- AI / edge runtime primitives.
- Claude-grade documentation rewrite (Spec 2).
- Form primitive.
- Sentry / Bugsnag integration.
- New typeface.
- Per-route bespoke motion.
- Section-level CMS authoring.
- Lottie / SVG animation pipelines.
- Refactors unrelated to the design floor.
