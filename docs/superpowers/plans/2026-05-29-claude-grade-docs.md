# Claude-Grade Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan. Phase 0 runs in the parent. Phases 1 and 2 fan out one subagent each in parallel. Phase 3 integration runs in the parent. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-05-29-claude-grade-docs-design.md` — read it before any task.
>
> **Convention:** No literal code blocks in this plan (per project rule). Each step describes the change precisely enough that the implementing agent can write it. Acceptance signals are explicit at every step.

**Goal:** Ship the two remaining chapters of Spec 2 — restructured STYLE_GUIDE.md and three auto-loading skills (`passionfruit-design`, `passionfruit-a11y`, `passionfruit-perf`) — so Claude editing in this repo gets correct domain-specific guidance the moment it touches a file.

**Architecture:** Two-layer doc surface. Layer 1 = STYLE_GUIDE.md restructured around `Use when` / `Don't use when` + decision shortcuts. Layer 2 = three new SKILL.md files mirroring the existing `passionfruit-content` shape. Both layers compose with the existing sidecar system (PR #31) without modifying it.

**Tech Stack:** Markdown. `.claude/skills/` directory structure (one skill per subdirectory, `SKILL.md` inside). No code, no new dependencies.

**Worktree:** `.claude/worktrees/feat+claude-grade-docs` on branch `worktree-feat+claude-grade-docs`, based on `origin/main` post-#31.

---

## Dispatch shape (for the parent agent)

| Phase                         | Runs in             | Depends on  | Subagent type                                   |
| ----------------------------- | ------------------- | ----------- | ----------------------------------------------- |
| Phase 0 — Baseline            | Parent (direct)     | —           | —                                               |
| Phase 1 — STYLE_GUIDE rewrite | Subagent (parallel) | Phase 0     | `general-purpose` (or any writer-capable agent) |
| Phase 2 — Three skills        | Subagent (parallel) | Phase 0     | `general-purpose`                               |
| Phase 3 — Integration         | Parent              | Phases 1, 2 | —                                               |

Parent dispatches Phases 1 and 2 in a single message with two `Agent` tool uses so they run concurrently. They touch disjoint files (`STYLE_GUIDE.md` + `CLAUDE.md` vs. `.claude/skills/<new>/SKILL.md`). No conflicts.

---

## File structure (locked-in decomposition)

**Rewritten:**

- `STYLE_GUIDE.md` — restructured per the operating principle (intent before mechanics; anti-patterns paired with correct patterns; decision shortcuts at the bottom)

**Lightly edited:**

- `CLAUDE.md` (root) — any style/pattern content that duplicates STYLE_GUIDE becomes a one-line pointer

**New:**

- `.claude/skills/passionfruit-design/SKILL.md`
- `.claude/skills/passionfruit-a11y/SKILL.md`
- `.claude/skills/passionfruit-perf/SKILL.md`

**Untouched (out of scope):**

- All sidecar `.md` files under `src/components/`
- `src/components/CLAUDE.md` (auto-generated catalog)
- `scripts/check-component-docs.mjs`
- `.claude/skills/passionfruit-content/SKILL.md` (unless trigger overlap proves problematic in Phase 3 — controller decides)

---

## Phase 0 — Baseline (parent, direct)

### Task 0.1: Confirm clean state

**Files:** none modified.

- [ ] **Step 1:** Verify worktree state. Run: `git status`. Expected: clean working tree on branch `worktree-feat+claude-grade-docs`, no untracked files apart from `node_modules/` if any.
- [ ] **Step 2:** Verify baseline build passes (includes the sidecar check from PR #31). Run: `pnpm build`. Expected: 43 pages built, exit 0.
- [ ] **Step 3:** Verify baseline tests pass. Run: `pnpm test`. Expected: 9 pass / 0 fail.
- [ ] **Step 4:** Inspect the existing `passionfruit-content` skill as the template shape. Run: `head -30 .claude/skills/passionfruit-content/SKILL.md`. Note the frontmatter keys (`name`, `description`) and the content body structure for use as the model in Phase 2.
- [ ] **Step 5:** Inspect the current STYLE_GUIDE section headings. Run: `grep -n "^##\? " STYLE_GUIDE.md`. Expected: Design Philosophy + 11 numbered sections (Color, Typography, Buttons, Cards, Layout, Animations, Dark Sections, Accessibility, Icons & Images, Social proof, Media embeds). This is the inherited structure Phase 1 restructures within — Phase 1 keeps the section list, restructures the content shape.

---

## Phase 1 — STYLE_GUIDE rewrite (subagent)

**Subagent brief:** You are rewriting `STYLE_GUIDE.md` per Chapter 1 of `docs/superpowers/specs/2026-05-29-claude-grade-docs-design.md`. Read the spec's §5 before starting. Phase 2 runs in parallel; do NOT touch `.claude/skills/` files (those are Phase 2's scope). Stay within `STYLE_GUIDE.md` and `CLAUDE.md` (root).

### Task 1.1: Claude-addressed lead + Design Philosophy refresh

**Files:**

- Modify: `STYLE_GUIDE.md` (top of file through "Design Philosophy" section)

- [ ] **Step 1:** Read the current top of `STYLE_GUIDE.md` (lines 1–18). Understand the existing voice and structure.
- [ ] **Step 2:** Replace the existing top (title + Design Philosophy section) with: an H1 unchanged (`# Visual Style Guide`), a new lead paragraph addressed directly to Claude — "You will be auto-loaded into context by the `passionfruit-design` skill when editing any `.astro` or `.css` file. This is the single source of truth for tokens, patterns, and primitive selection. When you reach a decision point, scan the Decision Shortcuts cheat sheet at the bottom first." — and a tightened Design Philosophy paragraph (2–3 sentences capturing intent rather than exhaustive principle listings).
- [ ] **Step 3:** Acceptance signal: the file still parses as valid markdown (`pnpm build` doesn't reject it), the first 25 lines are the new addressed lead, and the existing 11 numbered sections still follow (you haven't touched them yet).
- [ ] **Step 4:** Commit. `git add STYLE_GUIDE.md && git commit -m "docs(style-guide): add Claude-addressed lead + tighten Design Philosophy"`

### Task 1.2: Restructure §1–§5 (Color, Typography, Buttons, Cards, Layout)

**Files:**

- Modify: `STYLE_GUIDE.md` (sections 1 through 5)

For EACH of the five sections, apply the same restructure template:

1. Open the section with two lines:
   - `**Use when:** <2-3 concrete scenarios>` — written for Claude: "Choose a token / pick a variant / structure a layout for X situation."
   - `**Don't use when:** <1-2 common misuse cases>` — written as anti-patterns Claude tends to slip into ("Don't reach for raw hex when a `--color-*` token exists"; "Don't use a `<div>` where a `<Section>` archetype applies"; etc.)
2. Move the existing reference material (token tables, variant matrices, code examples) below the Use-when block. Preserve the substance; restructure the framing.
3. Add a **Pattern vs. anti-pattern** block as the last content within the section:
   - Side-by-side or top-bottom block showing "Don't:" (the wrong example, with one line of why) and "Do:" (the correct version, with the token/component reference).
   - Keep these short — one or two pairs per section, the most common mistakes.

Specifics per section:

- [ ] **Step 1: §1 Color.** Use-when: "Pick a foreground color / background tone / accent". Don't-use-when: "Raw hex literals in components — always use a `--color-*` token". Anti-pattern: `color: #6b7280` → `color: var(--color-muted)` or the `text-muted` utility. Include a one-line reminder that overlay scrims and shadow lifts have dedicated tokens (`--color-overlay-scrim-*`, `--color-shadow-lift`) so consumers don't reach for raw rgba.
- [ ] **Step 2: §2 Typography.** Use-when: "Pick a size from `--text-*` / pick a heading utility class / set a leading via `--leading-*`". Don't-use-when: "Inline `font-size: ...rem` literals — always use the fluid clamp tokens". Anti-pattern: hardcoded `font-size: 2rem` → `class="text-h1"` or `font-size: var(--text-h1)`.
- [ ] **Step 3: §3 Buttons.** Use-when: "Primary / secondary / ghost CTA across on-light or on-dark surfaces, with `<a>` or `<button>` semantics". Don't-use-when: "Inline text links inside paragraphs (use styled `<a>`); nav-bar links (use bare `<a>`); icon-only without aria-label". Anti-pattern: a styled `<a>` with hardcoded padding mimicking a button → `<Button variant="primary" tone="on-light" href="...">`.
- [ ] **Step 4: §4 Cards.** Use-when: "Content card per type — BlogCard, TeamCard, CareerCard, etc.". Don't-use-when: "Generic `<Card>` wrapper — passionfruit deliberately has one card per content type, not a generic frame". Anti-pattern: `<div class="card">` ad-hoc → existing `BlogCard.astro` / new component-per-type if a fresh content type appears.
- [ ] **Step 5: §5 Layout.** Use-when: "Section padding from `--space-section-*`; container widths from the existing tokens (narrow/default/wide)". Don't-use-when: "Hardcoded `padding: 4rem` literals; arbitrary `max-w-*` Tailwind utilities without checking the token catalog first". Anti-pattern: `<section class="py-20 max-w-7xl">` → token-backed equivalent. Reference: the `Section.astro` primitive will land with Spec 1 (PR #29); when it merges, this section will gain a sentence pointing at it.
- [ ] **Step 6:** Run `pnpm build`. Expected: passes. The sidecar check is unaffected by STYLE_GUIDE edits.
- [ ] **Step 7:** Commit. `git add STYLE_GUIDE.md && git commit -m "docs(style-guide): restructure color/type/buttons/cards/layout for Claude consumption"`

### Task 1.3: Restructure §6–§11 (Animations, Dark, A11y, Icons, Social, Media)

**Files:**

- Modify: `STYLE_GUIDE.md` (sections 6 through 11)

Apply the same template as Task 1.2 to each remaining section.

- [ ] **Step 1: §6 Animations.** Use-when: "Entrance choreography on scroll / micro-interactions on hover-press-focus / view-transition affordances". Don't-use-when: "Custom keyframes without `prefers-reduced-motion: no-preference` gate; parallax (never — motion sickness, no quality lift); JS animation libraries". Anti-pattern: a `@keyframes` block applied unconditionally → wrap in the motion-safe media query. Reference the project's reduced-motion contract.
- [ ] **Step 2: §7 Dark Sections.** Use-when: "Section frame on dark surface — text inverts via `--color-text-on-dark`". Don't-use-when: "Hardcoded `color: white` on dark — always route through the on-dark token so brand changes propagate". Anti-pattern: `style="color: white"` on a dark section → `var(--color-text-on-dark)`.
- [ ] **Step 3: §8 Accessibility.** Use-when: "Any element with `aria-*`, `role=`, `alt=`, or interactive semantics (button, link, form, input)". Don't-use-when: "Missing alt text (build fails — `jsx-a11y/alt-text` is error-level); decorative imagery treated as informational; focus-visible ring missing on a custom interactive element". Anti-pattern: `<img src="...">` with no alt → either `alt="..."` (informational) or `alt=""` (decorative). This section also reminds Claude that the `passionfruit-a11y` skill auto-loads on these edits.
- [ ] **Step 4: §9 Icons & Images.** Use-when: "Lucide icons via `@lucide/astro`; brand imagery via Astro's `<Image>` from `astro:assets`". Don't-use-when: "Emojis instead of icons; raw `<img>` tags instead of `<Image>` (loses Astro's AVIF/WebP optimization); icon-only buttons without `aria-label`". Anti-pattern: `<img src="/foo.png">` → `<Image src={fooImg} alt="..." />` with imported asset.
- [ ] **Step 5: §10 Social proof.** Use-when: "Display testimonials, partner logos, trust indicators". Don't-use-when: "Generic praise without attribution; partner logos at inconsistent sizes". Anti-pattern: free-floating partner logos → `Trust` / `Comparison` section components when they land via Spec 1; current `TrustSection.astro` until then.
- [ ] **Step 6: §11 Media embeds.** Use-when: "YouTube / Spotify embeds — always use the facade components, not raw iframes". Don't-use-when: "Embedding a third-party iframe directly — it skips the consent gate and bloats LCP". Anti-pattern: `<iframe src="https://youtube.com/...">` → `<YouTubeFacade videoId="..." />`. Mentions: facades respect cookie consent and lazy-load the actual embed.
- [ ] **Step 7:** Run `pnpm build`. Expected: passes.
- [ ] **Step 8:** Commit. `git add STYLE_GUIDE.md && git commit -m "docs(style-guide): restructure animations/dark/a11y/icons/social/media for Claude consumption"`

### Task 1.4: Decision Shortcuts cheat sheet

**Files:**

- Modify: `STYLE_GUIDE.md` (append new section at the end)

- [ ] **Step 1:** Append a new top-level section after §11 titled `## Decision Shortcuts`. Open with a single sentence: "When you reach one of these decision points, take the shortcut."
- [ ] **Step 2:** Add a markdown table or bullet list with these rows (cover the current surface on main; Spec 1's primitives will be added by PR #29 at merge time):
  - "Need a CTA" → `<Button variant="..." tone="...">`
  - "Need a color" → check `@theme` in `src/styles/global.css` first; if missing, add a token
  - "Need a font size" → use `--text-*` token or the matching utility class; never raw `font-size: Xrem`
  - "Need to display a blog/team/career/case-study/event entry as a card" → use the per-type card (`BlogCard`, `TeamCard`, etc.)
  - "Need to embed a YouTube or Spotify video" → use the facade (`<YouTubeFacade>` / `<SpotifyFacade>`)
  - "Need long-form Markdown rendering" → the existing `BlogPost` / `PageContent` / `LegalDocument` patterns
  - "Need an icon" → import from `@lucide/astro` (never an emoji)
  - "Need to add a third-party host" → update `public/_headers` CSP, then add the resource
  - "Need to add a translation string" → both `src/i18n/de.json` and `src/i18n/en.json` together (`passionfruit-content` skill auto-loads to remind you)
  - "Need an animation" → CSS keyframes inside a `prefers-reduced-motion: no-preference` block (no JS libs)
- [ ] **Step 3:** Add a closing one-liner: "If you don't see your situation here, ask. Don't guess."
- [ ] **Step 4:** Run `pnpm build`. Expected: passes.
- [ ] **Step 5:** Commit. `git add STYLE_GUIDE.md && git commit -m "docs(style-guide): add Decision Shortcuts cheat sheet"`

### Task 1.5: Audit root CLAUDE.md, replace duplicated style content with pointers

**Files:**

- Modify: `CLAUDE.md` (root)

- [ ] **Step 1:** Read the current root `CLAUDE.md` end-to-end. Identify any sections that overlap with `STYLE_GUIDE.md` topics (colors, typography, buttons, cards, layout, animations, accessibility, icons, media embeds).
- [ ] **Step 2:** For each overlap found: replace the duplicated content with a one-line pointer like "Style and pattern guidance lives in `STYLE_GUIDE.md`; see Decision Shortcuts at the bottom for quick lookups." Preserve content that's NOT style-related (project structure, build commands, deployment, etc.).
- [ ] **Step 3:** If no significant overlap exists, this task is a no-op — note that in the commit message. The root `CLAUDE.md` is small (~248 lines) so heavy overlap is unlikely.
- [ ] **Step 4:** Run `pnpm build`. Expected: passes.
- [ ] **Step 5:** Commit. `git add CLAUDE.md && git commit -m "docs: point CLAUDE.md style references at STYLE_GUIDE"` (or, if no-op, `docs: confirm CLAUDE.md has no style-pattern overlap with STYLE_GUIDE` with --allow-empty if needed, but prefer skipping the commit entirely if truly no-op).

**Phase 1 done when:** all five tasks committed, `pnpm build` passes, STYLE_GUIDE has the addressed-to-Claude lead, every section opens with Use-when/Don't-use-when, Decision Shortcuts cheat sheet exists at the bottom.

---

## Phase 2 — Three auto-loading skills (subagent)

**Subagent brief:** You are creating three new skills under `.claude/skills/` per Chapter 2 of `docs/superpowers/specs/2026-05-29-claude-grade-docs-design.md`. Read the spec's §6 before starting. Phase 1 runs in parallel; do NOT touch `STYLE_GUIDE.md` or root `CLAUDE.md` (those are Phase 1's scope). Use `.claude/skills/passionfruit-content/SKILL.md` as the template for shape and voice.

### Task 2.1: passionfruit-design skill

**Files:**

- Create: `.claude/skills/passionfruit-design/SKILL.md`

- [ ] **Step 1:** Create the directory and file at `.claude/skills/passionfruit-design/SKILL.md`.
- [ ] **Step 2:** Write the frontmatter block with two keys:
  - `name: passionfruit-design`
  - `description:` matching the spec §6.1 trigger text: "Use when editing any file under `src/components/`, `src/components/sections/`, or `src/styles/`, or any `.astro`/`.css` file outside `src/content/` and `src/i18n/`. Loads design tokens, primitive selection rules, and the no-hex-in-components rule. Pairs with the existing per-component sidecars for per-component intent."
- [ ] **Step 3:** Write the content body in the voice of `passionfruit-content` (imperative, addressed to Claude). Cover:
  - One-paragraph intro: "Design tokens and patterns live in `STYLE_GUIDE.md`. The decision shortcuts at the bottom of that file are the fastest path to the right answer. Per-component intent (what each component is for, when to reach for it) lives in the sidecar `.md` next to each component."
  - **Hard rules** section listing: no raw hex literals in components (use `@theme` tokens); no inline `font-size: Xrem` (use `--text-*` tokens or utility classes); no emojis (use `@lucide/astro`); update `public/_headers` CSP before adding any third-party host.
  - **Decision shortcuts** section embedding the same list from STYLE_GUIDE's cheat sheet (Phase 1 Task 1.4). Duplication is intentional — Claude should have this in context the moment the skill loads, without needing to open STYLE_GUIDE.
  - **Token namespaces** one-paragraph reference: `--color-*` (surfaces, text, accent, warm, borders, state surfaces, scrim, shadow), `--text-*` and `--leading-*` (typography), `--space-*` and `--space-section-*` (spacing), `--radius-*` (corners), `--duration-*` and `--ease-*` (motion), `--grid-cols-12` (layout). Each one-line.
  - **Where to look** closing: STYLE_GUIDE.md (canonical reference), `src/styles/global.css` `@theme` (token definitions), the sidecar `.md` next to any component (per-component intent).
- [ ] **Step 4:** Run `pnpm build`. Expected: passes. Skill files are not validated by the build but the build should still succeed.
- [ ] **Step 5:** Commit. `git add .claude/skills/passionfruit-design && git commit -m "feat(skills): add passionfruit-design auto-loading skill"`

### Task 2.2: passionfruit-a11y skill

**Files:**

- Create: `.claude/skills/passionfruit-a11y/SKILL.md`

- [ ] **Step 1:** Create the directory and file at `.claude/skills/passionfruit-a11y/SKILL.md`.
- [ ] **Step 2:** Write the frontmatter block:
  - `name: passionfruit-a11y`
  - `description:` matching the spec §6.2 trigger text: "Use when adding or modifying any element with `aria-*`, `role=`, `alt=`, or any `<img>`, `<button>`, `<a>`, `<form>` element, or when touching motion-related files. Loads WCAG essentials, alt-text discipline, focus-visible patterns, touch-target rules, and the reduced-motion contract."
- [ ] **Step 3:** Write the content body. Cover:
  - One-paragraph intro: "Accessibility is enforced at build time (alt-text is error-level lint) and by convention. These rules are non-negotiable. When in doubt, prefer the more accessible option."
  - **Hard rules** section:
    - Every `<img>` and Astro `<Image>` requires an `alt` attribute. `alt=""` is correct ONLY when the image is purely decorative (carries no information not already in surrounding text). Otherwise, describe what the image conveys.
    - Touch targets — interactive elements (buttons, links, form inputs) must be ≥ 44px in their hit area (CSS or padding).
    - `:focus-visible` ring on every interactive element. Don't suppress the default ring without providing a custom one.
    - Reduced-motion contract — any CSS animation that exceeds 100ms must be wrapped in `@media (prefers-reduced-motion: no-preference)`. The fallback is the target state, applied instantly.
    - Landmark roles — `<main>`, `<nav>`, `<header>`, `<footer>` for top-level page structure. State pages (404, 500) use `<main>`.
    - Form fields — every `<input>` has a `<label>` (visible or `sr-only`); error messages are linked via `aria-describedby`.
  - **Common mistakes** section:
    - `<img>` with no alt — build fails.
    - Custom button-styled `<div>` with no `role="button"`, `tabindex`, or keyboard handler — use `<button>` instead.
    - Icon-only `<button>` with no `aria-label` — accessible name missing.
    - Animation without reduced-motion gate — motion-sensitive users get a worse experience.
  - **Where to look** closing: this skill auto-loads on a11y-touching edits, STYLE_GUIDE §8 (Accessibility) for fuller coverage, the existing `passionfruit-content` skill for content-side a11y (e.g., heading hierarchy in markdown).
- [ ] **Step 4:** Run `pnpm build`. Expected: passes.
- [ ] **Step 5:** Commit. `git add .claude/skills/passionfruit-a11y && git commit -m "feat(skills): add passionfruit-a11y auto-loading skill"`

### Task 2.3: passionfruit-perf skill

**Files:**

- Create: `.claude/skills/passionfruit-perf/SKILL.md`

- [ ] **Step 1:** Create the directory and file at `.claude/skills/passionfruit-perf/SKILL.md`.
- [ ] **Step 2:** Write the frontmatter block:
  - `name: passionfruit-perf`
  - `description:` matching the spec §6.3 trigger text: "Use when editing any media component (`<Image>`, `YouTubeFacade`, `SpotifyFacade`), `BaseLayout.astro`, files under `src/pages/`, or adding new client scripts. Loads image-loading discipline, no-JS-when-CSS-suffices, third-party host CSP rules."
- [ ] **Step 3:** Write the content body. Cover:
  - One-paragraph intro: "passionfruit is a static-output Astro site. Performance comes from disciplined defaults: lazy-load below the fold, facades for heavy embeds, CSS over JS for behavior, no third-party host without a CSP update."
  - **Hard rules** section:
    - Astro `<Image>` from `astro:assets`, never raw `<img>` for project assets — Astro generates AVIF + WebP automatically.
    - `loading="eager"` only for above-the-fold imagery (hero, first card row). Everything else: `loading="lazy"` (default).
    - Heavy embeds (YouTube, Spotify, Vimeo) use the facade components in `src/components/` — never embed the third-party iframe directly. Facades respect cookie consent and defer the real embed until interaction.
    - CSS for animation and interactivity. Don't reach for a JS animation library when CSS or IntersectionObserver works.
    - New third-party host? Update `public/_headers` CSP before the resource ships. CSP violations show silently in PostHog when reporting is enabled.
    - Client `<script>` blocks should be small and only present when CSS can't do the job. Avoid `client:load` on Astro components unless absolutely necessary; prefer `client:idle` or `client:visible`.
  - **Common mistakes** section:
    - Raw `<img src="...">` instead of `<Image>` — loses AVIF/WebP optimization, no responsive sizing.
    - YouTube iframe directly embedded — bloats LCP, ignores consent.
    - Heavy `client:load` for what should be CSS hover/focus state.
    - Adding a third-party script (analytics, embed, font) and forgetting the CSP — silent block in the browser console.
  - **Where to look** closing: this skill auto-loads on perf-touching edits, `public/_headers` for CSP and cache rules, `src/components/YouTubeFacade.astro` / `SpotifyFacade.astro` as the canonical facade patterns.
- [ ] **Step 4:** Run `pnpm build`. Expected: passes.
- [ ] **Step 5:** Commit. `git add .claude/skills/passionfruit-perf && git commit -m "feat(skills): add passionfruit-perf auto-loading skill"`

**Phase 2 done when:** all three tasks committed, `pnpm build` passes, the three new directories exist under `.claude/skills/` each with a `SKILL.md` whose frontmatter mirrors `passionfruit-content`'s shape.

---

## Phase 3 — Integration (parent, direct)

### Task 3.1: Full quality gate

**Files:** none modified directly.

- [ ] **Step 1:** Confirm clean working tree. Run: `git status`. Expected: clean.
- [ ] **Step 2:** Run full build with sidecar check. Run: `pnpm build`. Expected: 43 pages, exit 0.
- [ ] **Step 3:** Run spell check. Run: `pnpm check:spelling`. Expected: passes. If new words flagged (likely some technical terms), add to `project-words.txt` and commit as `chore(spelling): add words from Spec 2 docs`.
- [ ] **Step 4:** Quick read-through of `STYLE_GUIDE.md` — verify the Claude-addressed lead is there, every section opens with `Use when` / `Don't use when`, Decision Shortcuts cheat sheet exists at the bottom, anti-pattern blocks are present in each section.
- [ ] **Step 5:** Quick read-through of the three new `SKILL.md` files — verify frontmatter is well-formed (matching `passionfruit-content` shape), descriptions are precise and trigger-shaped, content bodies cover the rules + decision shortcuts + where-to-look.

### Task 3.2: Push and open PR

**Files:** none modified.

- [ ] **Step 1:** Push the branch. Run: `git push -u origin worktree-feat+claude-grade-docs`. Expected: branch created on origin.
- [ ] **Step 2:** Open the PR with `gh pr create`. Title: `feat(docs+skills): Spec 2 — Claude-grade docs (STYLE_GUIDE rewrite + 3 auto-loading skills)`. Body should include:
  - **Summary:** STYLE_GUIDE.md restructured for Claude consumption (intent-first sections, anti-pattern pairings, decision shortcuts). Three new auto-loading skills (`passionfruit-design`, `passionfruit-a11y`, `passionfruit-perf`) modeled on `passionfruit-content`'s shape.
  - **Test plan:**
    - `pnpm build` passes.
    - `pnpm check:spelling` passes.
    - STYLE_GUIDE.md opens with Claude-addressed lead, every section has `Use when`/`Don't use when`, Decision Shortcuts cheat sheet at bottom.
    - All three skills exist at `.claude/skills/<name>/SKILL.md` with frontmatter mirroring `passionfruit-content`.
    - **Manual verification (after merge or locally):** open a `.astro` file under `src/components/` in a fresh Claude Code session and verify `passionfruit-design` auto-loads. Same for the other two with their respective triggers.
  - **Note for PR #29 (Spec 1) author / merger:** when PR #29 merges, the new primitives (Prose, Section, archetypes, Motion, state primitives) should be added to STYLE_GUIDE's relevant sections and to the Decision Shortcuts list. This Spec 2 PR ships the scaffold; Spec 1's PR extends it with its share of the content.
- [ ] **Step 3:** Verify CI runs. Wait for Cloudflare Pages preview deploy comment. Visit the preview URL — STYLE_GUIDE / skills changes are docs-only and won't affect the deployed site itself, but the build passing is the signal.
- [ ] **Step 4:** Report PR URL to the user.

**Phase 3 done when:** PR is open, CI green, preview URL reported.

---

## Out of scope (cross-reference with spec §9)

- Per-component sidecars (PR #31).
- Spec 1 component sidecars and STYLE_GUIDE primitives (PR #29's concern).
- ADRs.
- Rewriting `CONTRIBUTING.md`.
- New tooling.
- Modifying `passionfruit-content` skill beyond the trigger-overlap adjustment if Phase 3 verification surfaces a real conflict (deferred to a separate small commit if needed; not part of this PR).
