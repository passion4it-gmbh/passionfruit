# Spec 2 — Claude-grade docs

**Status:** approved design, ready for implementation plan
**Date:** 2026-05-29
**Branch base:** `origin/main` post-#31 (sidecar system already shipped)
**Related:** Spec 1 — Design floor (PR #29, open)

## 1. Context

passionfruit's value is letting Claude act as the web developer for non-technical users. Spec 1 raises the design floor. Spec 2 sharpens what Claude reads — so the AI consistently makes the right call without the user prompting it every time.

The original brainstorm planned three chapters: STYLE_GUIDE rewrite, per-component intent files, three auto-loading skills. PR #31 has since landed a more rigorous version of the per-component piece (sidecar `.md` files validated by `scripts/check-component-docs.mjs`, auto-generated catalog in `src/components/CLAUDE.md`, plus the `passionfruit-content` skill extended to fire on `src/components/` edits). That chapter is therefore dropped from Spec 2 — done, and done better.

Spec 2 ships the remaining two chapters: STYLE_GUIDE.md restructured for Claude consumption, and three new auto-loading skills (`design`, `a11y`, `perf`) firing on their respective domains.

## 2. Goals

- A Claude editing in this repo gets correct, domain-specific guidance the moment it touches a file in that domain — no manual `Skill` invocation needed.
- STYLE_GUIDE is the single source of truth for tokens, patterns, and decision shortcuts. Other docs link to it; they do not duplicate.
- The new auto-loading skills compose cleanly with `passionfruit-content` (no double-trigger, no contradictory guidance).
- The restructured STYLE_GUIDE provides a scaffold that Spec 1's components slot into when PR #29 merges — without requiring re-restructuring.

## 3. Non-goals

- Re-doing the sidecar system shipped by PR #31.
- ADRs (deliberately excluded per the original brainstorm scope decision).
- Root `CLAUDE.md` or `CONTRIBUTING.md` rewrites — pointer updates only.
- New tooling (no doc linter, no website generator).
- Sidecars for Spec 1's new components (a Spec 1 / PR #29 concern, not Spec 2's).
- Migration of existing CLAUDE.md content for `src/content/` (already handled by `passionfruit-content`).

## 4. Architecture

Two coordinated layers Claude consumes at different moments.

**Layer 1 — Auto-loading skills.** Fire on file-pattern matches; load surface-level direction into context the moment Claude starts editing in their domain. Three new skills (`passionfruit-design`, `passionfruit-a11y`, `passionfruit-perf`) modeled exactly on the existing `passionfruit-content` skill: `SKILL.md` frontmatter with a precise trigger-shaped description, content body with concrete rules and pointers to deeper references.

**Layer 2 — STYLE_GUIDE.md restructured for Claude.** The single source of truth for design tokens, component patterns, and decision shortcuts. Restructured so every section opens with intent (`Use when` / `Don't use when`), pairs anti-patterns with correct patterns, and ends with a decision-shortcut cheat sheet.

A third layer — per-component sidecars — is already in place from PR #31 and is documented here only as a reference point for the new skills.

Information flow: skill loads on file edit → Claude orients to the domain → reads the open component file → existing sidecar tells per-component intent → STYLE_GUIDE backs up specific token/pattern decisions.

## 5. Chapter 1 — STYLE_GUIDE.md rewrite

**What ships:**

1. **Restructured by operating principle**, not by topic taxonomy:
   - Each section opens with `Use when: …` and `Don't use when: …` lines before any reference material.
   - Anti-patterns paired with correct patterns side-by-side — "Don't: raw hex literal `#6b7280`. Do: `text-muted` utility (maps to `--color-muted`)."
   - End-of-doc **decision shortcuts** cheat sheet covering: "Need long-form Markdown? → `<BlogPost>` / page composition. Need a button? → `<Button>`. Need a section frame? → see the sidecar for any section component." Decision shortcuts are written so they extend naturally when Spec 1 merges (Prose / Section / archetypes / Motion / state primitives slot in cleanly without restructuring).

2. **Coverage of the current surface on main** — all tokens currently in `@theme`, all stable components with sidecars. Spec 1's primitives are explicitly NOT documented here (they'll merge later, and PR #29 will extend the new structure as part of its merge).

3. **Each section capped ~50 lines** so Claude can hold one in context cleanly. Expected total: ~350 lines after rewrite (vs. 283 today — denser per topic, more decision-shortcuts at the bottom).

4. **A new lead paragraph** at the top of the file explicitly addressed to Claude: "You will be auto-loaded into context by the design skill. This is the single source of truth for tokens and patterns. When you reach a decision point, scan the decision shortcuts at the bottom first."

5. **Removal of duplicated content** elsewhere — any pattern guidance currently in root `CLAUDE.md` that overlaps with STYLE_GUIDE gets reduced to a one-line pointer.

**Files:** rewrite `STYLE_GUIDE.md`; minor edits to root `CLAUDE.md` (replace duplicated style sections with pointers).

**Out of scope for this chapter:** rewriting `CONTRIBUTING.md`; documenting Spec 1 primitives (PR #29's concern); modifying any sidecar `.md` files.

## 6. Chapter 2 — Auto-loading area skills

**What ships:**

Three new skills under `.claude/skills/`, each following the existing `passionfruit-content` pattern: `SKILL.md` with frontmatter (`name`, `description`) and content body. The description's wording determines when Claude auto-loads the skill, so each is engineered for precision.

1. **`passionfruit-design`**
   - **Trigger description:** "Use when editing any file under `src/components/`, `src/components/sections/`, or `src/styles/`, or any `.astro`/`.css` file outside `src/content/` and `src/i18n/`. Loads design tokens, primitive selection rules, and the no-hex-in-components rule. Pairs with the existing per-component sidecars for per-component intent."
   - **Content body:** points to `STYLE_GUIDE.md` as the canonical reference; surfaces the decision shortcuts inline (so Claude has them without opening STYLE_GUIDE); lists the token namespaces with one-line summaries; reminds the agent of the no-hex-in-components rule and how to add a token if needed; explicitly defers per-component intent to the sidecar (`.md` file next to each component).

2. **`passionfruit-a11y`**
   - **Trigger description:** "Use when adding or modifying any element with `aria-*`, `role=`, `alt=`, or any `<img>`, `<button>`, `<a>`, `<form>` element, or when touching motion-related files. Loads WCAG essentials, alt-text discipline, focus-visible patterns, touch-target rules, and the reduced-motion contract."
   - **Content body:** the `jsx-a11y/alt-text` lint rule (error-level — build fails on missing alt); when `alt=""` is correct (decorative); minimum 44px touch targets; `:focus-visible` ring on every interactive; reduced-motion gating any animation that exceeds 100ms; landmark roles for state pages.

3. **`passionfruit-perf`**
   - **Trigger description:** "Use when editing any media component (`<Image>`, `YouTubeFacade`, `SpotifyFacade`), `BaseLayout.astro`, files under `src/pages/`, or adding new client scripts. Loads image-loading discipline, no-JS-when-CSS-suffices, third-party host CSP rules."
   - **Content body:** `<Image>` defaults (lazy except above-the-fold; AVIF + WebP via Astro); facades for heavy embeds (YouTube/Spotify ship one); CSS over JS for animations and interactivity; when adding a third-party host, update `public/_headers` CSP — CSP violations show up silently in PostHog when reporting is enabled.

**Files:** new `.claude/skills/passionfruit-design/SKILL.md`, `.claude/skills/passionfruit-a11y/SKILL.md`, `.claude/skills/passionfruit-perf/SKILL.md`.

**Trigger overlap with `passionfruit-content`:** `passionfruit-content` currently auto-loads on `src/components/` edits (PR #31 extended its trigger so the sidecar rule fires). `passionfruit-design` will also auto-load on the same path. Both should fire — they cover different concerns (sidecar discipline vs. design tokens). Verified during Phase 2 of the implementation by opening a component in a fresh session and confirming both skills load without contradictory guidance. If they conflict in practice, refine the `passionfruit-content` description to narrow its trigger to "sidecar `.md` file edits" rather than all of `src/components/`.

**Out of scope for this chapter:** modifying the existing `passionfruit-content` skill beyond the trigger-overlap adjustment if needed; creating skills for content (already covered), brand (covered by `brand` skill), or deployment (covered by `deploy` skill).

## 7. Cross-cutting

### 7.1 Discoverability

Each layer makes the next discoverable:

- Skills auto-load on file edit → orient Claude to the domain.
- STYLE_GUIDE is named explicitly in every skill's content body.
- Sidecars are auto-discoverable by the existing prebuild check (PR #31).

A Claude session that starts cold and opens any component file should reach the right decision in one read: skill loads, points at STYLE_GUIDE, sidecar at the component answers per-component questions.

### 7.2 Voice and addressed reader

STYLE_GUIDE.md and skill content bodies are addressed directly to Claude. Decision shortcuts are imperative ("Need a button? Use `<Button>`."). Skill descriptions are written in Claude-trigger style consistent with `passionfruit-content` and the other auto-loading skills in the broader plugin ecosystem.

### 7.3 Quality gates inherited

- `pnpm build` must pass (includes the existing `check-component-docs.mjs` prebuild check, lint, typecheck, bilingual check, Astro build).
- `pnpm check:spelling` — Spec 2 ships English-only documentation; if cspell flags any added words, add to `project-words.txt`.
- No new npm dependencies.
- No changes to sidecar `.md` files or the catalog block (those belong to the sidecar system).

### 7.4 Implementation sequencing

Designed for subagent fan-out, but smaller than Spec 1:

- **Phase 0 — Baseline check.** Verify `pnpm build` passes (the prebuild sidecar check needs to be green on the branch base before we add anything). Inspect the existing `passionfruit-content` SKILL.md as the template shape for the new three.
- **Phase 1 (parallel) — STYLE_GUIDE rewrite.** One subagent owns this. Standalone deliverable; mirrors the structure agreed in §5.
- **Phase 2 (parallel) — Three auto-loading skills.** One subagent owns all three (they share a model). Standalone deliverable; mirrors the structure agreed in §6.
- **Phase 3 — Integration.** Parent agent verifies the build still passes, verifies skills auto-load on intended triggers via a quick smoke test (open a `.astro` file under `src/components/` in a fresh Claude Code session and verify the design skill loads — best done locally by the user; Spec 2 ships the skills, the user verifies the loading behavior at use time). Push, PR.

### 7.5 Files modified / created (summary)

**Rewritten:**

- `STYLE_GUIDE.md` (restructured per §5)

**Lightly edited:**

- Root `CLAUDE.md` (replace any duplicated style sections with pointers to STYLE_GUIDE)

**New:**

- `.claude/skills/passionfruit-design/SKILL.md`
- `.claude/skills/passionfruit-a11y/SKILL.md`
- `.claude/skills/passionfruit-perf/SKILL.md`

**Untouched (out of scope):**

- All sidecar `.md` files under `src/components/`
- `scripts/check-component-docs.mjs` and the catalog generation logic
- `src/components/CLAUDE.md` (auto-generated by the sidecar system)
- `passionfruit-content/SKILL.md` (unless trigger-overlap with the new design skill proves problematic during Phase 2 verification)

### 7.6 Risks / open questions

- **Skill trigger precision.** Skill matching keys off the description. Imprecise descriptions either over-trigger (Claude burns context on irrelevant skill loads) or under-trigger (skill never loads when it should). Mitigation: model precisely on `passionfruit-content`'s description, which has proved reliable.
- **`passionfruit-design` and `passionfruit-content` both auto-loading on `src/components/`.** Acceptable in principle (different concerns) but introduces context overhead. Mitigation in §6's trigger-overlap note.
- **STYLE_GUIDE drift after Spec 1 merges.** PR #29 introduces new primitives that the rewritten STYLE_GUIDE doesn't document. Mitigation: PR #29 adds its primitive entries into the new structure as part of its merge. The Spec 2 PR description includes a checklist item for the PR #29 author (or whoever merges first) acknowledging this.

## 8. Verification

Done when:

- [ ] `pnpm build` passes (sidecar check, lint, typecheck, bilingual check, Astro build all green).
- [ ] `pnpm check:spelling` passes.
- [ ] STYLE_GUIDE.md opens with the addressed-to-Claude lead, every section has `Use when` / `Don't use when` lines, decision shortcuts at the bottom cover every primitive currently on main.
- [ ] All three new skills exist at `.claude/skills/<name>/SKILL.md` with frontmatter that mirrors `passionfruit-content`'s shape.
- [ ] No new npm dependencies.
- [ ] No edits to sidecar `.md` files, `src/components/CLAUDE.md`, or `check-component-docs.mjs`.
- [ ] PR opened, CI green, Cloudflare Pages preview unchanged (docs/skills-only changes don't affect the built site).
- [ ] Manual user verification (post-merge or locally): open a `.astro` file in a fresh Claude session and confirm `passionfruit-design` auto-loads.

## 9. Out of scope (consolidated)

- ADRs in `docs/decisions/`.
- Per-component sidecars (already shipped, PR #31).
- Spec 1 component sidecars (PR #29's concern when it merges).
- Rewriting root `CLAUDE.md` or `CONTRIBUTING.md` beyond pointer updates.
- New tooling.
- Modifying `passionfruit-content` skill beyond the trigger-overlap adjustment if needed.
- Documenting Spec 1 primitives in STYLE_GUIDE (PR #29's concern at merge time).
