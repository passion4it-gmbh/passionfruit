# Component sidecar documentation — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [docs/superpowers/specs/2026-05-28-component-sidecar-docs-design.md](../specs/2026-05-28-component-sidecar-docs-design.md)

**Goal:** Replace the monolithic `src/components/CLAUDE.md` with per-component sidecar `.md` files, an auto-generated catalog, and a prebuild check that enforces coverage + schema and rewrites the catalog locally / fails CI on drift.

**Architecture:** TDD a Node script (`scripts/check-component-docs.mjs`) in three layers — coverage check, schema validation, catalog regeneration — each with its own tests against temp-dir fixtures. Then author 29 sidecar files (22 components + 7 page templates) in batches. Wire the script into `prebuild` last, so every intermediate commit is green. Mirror the existing `scripts/check-bilingual.mjs` style (gray-matter, `styleText` colors, `--root` flag, `process.exit`).

**Tech stack:** Node 24, `gray-matter` for frontmatter parsing, `node:test` runner, no new dependencies.

**Branch:** `feat/component-sidecars` (per CLAUDE.md §15 — never push directly to main).

**Plan-document convention:** Per the user's global instruction, this plan contains NO code snippets. Every task is described in prose precise enough that the implementer (future me) writes the code fresh. For sidecar body templates, the implementer reads the spec.

---

## File structure

Files to create:

- `scripts/check-component-docs.mjs` — the check script.
- `scripts/check-component-docs.test.mjs` — node-test suite covering coverage, schema, catalog regeneration, and CI vs local behavior.
- `src/components/Badge.md` and 21 more sidecars under `src/components/`.
- 7 sidecars under `src/components/pages/`.

Files to modify:

- `src/components/CLAUDE.md` — rewrite to shrunken form with auto-generated catalog block.
- `package.json` — extend `prebuild`, extend `test`, extend `lint-staged` to format sidecars with Prettier.
- `.claude/skills/passionfruit-content/SKILL.md` — broaden trigger description, add component-sidecar rule, point at spec.
- `CLAUDE.md` (root) — update §2 self-improvement rule and §7 component conventions to reference sidecars.
- `CONTRIBUTING.md` — add a "Components" section describing the sidecar workflow.

Files NOT changed:

- Component `.astro` files themselves are untouched.
- `STYLE_GUIDE.md` — style rules stay there, sidecars only carry component-specific usage.

---

## Task 1: Script scaffold + coverage check (TDD)

**Files:**

- Create: `scripts/check-component-docs.mjs`
- Create: `scripts/check-component-docs.test.mjs`
- Modify: `package.json` (extend `test` script only — DO NOT touch `prebuild` yet)

- [ ] **Step 1: Branch off main.**

  Run `git switch -c feat/component-sidecars`. Verify with `git status` — should show "On branch feat/component-sidecars", clean working tree.

- [ ] **Step 2: Write failing tests for coverage check.**

  Create `scripts/check-component-docs.test.mjs` mirroring the structure of `scripts/check-bilingual.test.mjs`:
  - Imports: `describe, it, before, after` from `node:test`; `assert` from `node:assert/strict`; `spawnSync` from `node:child_process`; `mkdtempSync, mkdirSync, writeFileSync, rmSync` from `node:fs`; `join` from `node:path`; `tmpdir` from `node:os`.
  - Resolve script path via `new URL("../scripts/check-component-docs.mjs", import.meta.url).pathname`.
  - Helper `seedComponent(rootDir, name, options)` that writes a `<name>.astro` file (placeholder body) and optionally a sibling `<name>.md` with caller-provided frontmatter + body.
  - Helper `runScript(rootDir, ...args)` that invokes the script with `--root=<rootDir>` plus any extra flags via `spawnSync`. Returns `{ status, stdout, stderr }`.
  - Each `describe` block creates a temp dir in `before`, removes it in `after`.

  Test cases for Task 1 (coverage only):
  1. **"empty components dir exits 0"** — no `.astro` files, no `.md` files. Script exits 0, stdout contains `"component docs: 0 components"` or similar.
  2. **"all components have sidecars exits 0"** — three `.astro` files, three matching `.md` files (use minimum valid frontmatter + body sufficient to pass coverage; schema-strictness comes in Task 2). Script exits 0.
  3. **"one missing sidecar exits 1"** — two `.astro` files, only one has a `.md`. Script exits 1, stderr names the missing path.
  4. **"two missing sidecars list both"** — three `.astro` files, zero `.md` files. Script exits 1, stderr lists all three missing paths.
  5. **"sidecar without matching component is reported"** — `Orphan.md` exists but no `Orphan.astro`. Script exits 1, stderr names the orphan.
  6. **"recurses into subdirectories"** — top-level `Foo.astro` + `Foo.md`, plus `pages/about.astro` + `pages/about.md`. Script exits 0.

  Do NOT add tests for schema or catalog yet — those tasks own them.

- [ ] **Step 3: Wire the test runner.**

  Update `package.json` `"test"` script to run both check scripts: invoke `node --test` against both `scripts/check-bilingual.test.mjs` and `scripts/check-component-docs.test.mjs`. Express this as a single `node --test` invocation listing both files (single-process is fine), OR chain with `&&`. Pick the form that matches what's already used elsewhere if any precedent exists.

- [ ] **Step 4: Run tests to confirm they fail.**

  Run `pnpm test`. Expected: bilingual tests pass, component-docs tests fail with "script not found" or similar. Note the exact failure mode for sanity.

- [ ] **Step 5: Implement coverage check.**

  Create `scripts/check-component-docs.mjs`:
  - Shebang `#!/usr/bin/env node`.
  - Top doc comment describing purpose, usage, and exit codes.
  - CLI args: `--root=<path>` (default `./src/components`), forwarded by tests.
  - `styleText`-based color helpers (red/green/yellow/bold) gated on `process.stdout.isTTY`, same pattern as `check-bilingual.mjs`.
  - Walk the root recursively. For each directory, list entries; for files ending in `.astro`, record the basename without extension. For files ending in `.md`, record the basename. Skip the root `CLAUDE.md` (it is not a sidecar — match by exact filename `CLAUDE.md`).
  - Compute set difference: components without `.md` (missing), `.md` without `.astro` (orphan).
  - If either is non-empty: print each as a red error line with full path, then a count summary, then `process.exit(1)`.
  - If both empty: print `"component docs: N components OK"` in green, `process.exit(0)`.
  - Do NOT yet parse frontmatter or check body. That comes in Task 2.

- [ ] **Step 6: Run tests to confirm they pass.**

  Run `pnpm test`. Expected: all six coverage tests pass plus bilingual tests pass.

- [ ] **Step 7: Manual sanity run against real repo.**

  Run `node scripts/check-component-docs.mjs --root=src/components`. Expected: exit 1, lists 22 missing sidecars (every `.astro` directly under `src/components/` and 7 under `pages/`). This confirms the script sees the real codebase correctly but does NOT modify anything.

- [ ] **Step 8: Commit.**

  Stage `scripts/check-component-docs.mjs`, `scripts/check-component-docs.test.mjs`, `package.json`. Commit message:

  ```
  feat(scripts): add component sidecar coverage check (scaffold)

  TDD coverage layer of scripts/check-component-docs.mjs: enforces every
  src/components/**/*.astro has a sibling .md. Not yet wired into prebuild.
  Schema and catalog layers land in follow-up commits.
  ```

---

## Task 2: Schema validation (TDD)

**Files:**

- Modify: `scripts/check-component-docs.mjs`
- Modify: `scripts/check-component-docs.test.mjs`

- [ ] **Step 1: Add failing schema tests.**

  Extend the test file with a new `describe` block for schema validation. The seed helper from Task 1 already accepts arbitrary `.md` body — use it.

  Test cases (each is one `it`, asserting exit code and that stderr mentions the file path + specific failure):
  1. **valid sidecar passes** — all required frontmatter keys, body with all seven H2s in order.
  2. **missing frontmatter exits 1** — `.md` file with body but no YAML.
  3. **missing `component` key exits 1.**
  4. **`component` mismatched with filename exits 1** — file `Badge.md` but frontmatter `component: Foo`.
  5. **missing `oneLiner` exits 1.**
  6. **`oneLiner` over 80 chars exits 1.**
  7. **invalid `status` value exits 1** — value not in `stable | beta | deprecated`.
  8. **missing `tags` exits 1** (must be an array, may be empty? — make it MUST be non-empty for catalog grouping; test asserts empty array also fails).
  9. **missing H2 section exits 1** — body has six of seven required headings.
  10. **H2 sections out of order exits 1** — all seven present but `## Gotchas` appears before `## i18n keys`.
  11. **disallowed extra H2 exits 1** — body includes `## Notes` or any H2 outside the canonical seven.
  12. **H3 subsections inside the seven H2s are allowed** — passes.

  All schema errors should reference exact path + the specific reason (the test asserts substrings).

- [ ] **Step 2: Run tests to confirm they fail.**

  Run `pnpm test`. Expected: the 12 new tests fail (script doesn't yet read frontmatter or bodies).

- [ ] **Step 3: Implement schema validation.**

  Extend `scripts/check-component-docs.mjs`:
  - For each `.md` file paired with an `.astro` (run after coverage passes — if coverage fails, exit before schema), read the file. Use `gray-matter` (already a dependency, same import shape as bilingual script).
  - Validate frontmatter keys per spec: `component` (string, must equal basename), `oneLiner` (string, length 1–80), `status` (enum), `tags` (non-empty array of strings).
  - Body validation: scan for `^## ` lines (top-level subsections). Collect them in order. Required list: `Purpose`, `When to use`, `When NOT to use`, `Props`, `Example`, `i18n keys`, `Gotchas`. The collected list must equal the required list (same length, same order, no extras).
  - Each violation pushes onto a `schemaErrors` array; after iterating all files, print each error in red with file path + specific reason, then `process.exit(1)`. If no schema errors and coverage passed: continue (or exit 0 if catalog step is not yet implemented — coordinate with Task 3).

- [ ] **Step 4: Run tests to confirm they pass.**

  Run `pnpm test`. Expected: all coverage + schema tests pass.

- [ ] **Step 5: Commit.**

  Stage modified script and test. Commit message:

  ```
  feat(scripts): validate component sidecar frontmatter and body shape

  Adds schema validation to check-component-docs.mjs: required frontmatter
  keys (component, oneLiner, status, tags), oneLiner ≤80 chars, status enum,
  required H2 sections present and in order, no extras. Per the design spec.
  ```

---

## Task 3: Catalog regeneration + CI vs local behavior (TDD)

**Files:**

- Modify: `scripts/check-component-docs.mjs`
- Modify: `scripts/check-component-docs.test.mjs`

- [ ] **Step 1: Add failing catalog tests.**

  Extend the test file. Seed helper needs to support writing a `CLAUDE.md` file in the root with arbitrary content. Add helper `writeIndex(rootDir, content)` and helper `readIndex(rootDir)`.

  The catalog markers are literal HTML comments: `<!-- CATALOG:START -->` and `<!-- CATALOG:END -->`. Implementer treats anything between them as auto-generated and replaces it; anything outside is preserved verbatim.

  Test cases:
  1. **fresh catalog: empty CLAUDE.md gets catalog block appended** — seed three components with sidecars (different tags), seed a `CLAUDE.md` containing only a top heading + conventions. After running the script, the file contains the original top region unchanged plus a `<!-- CATALOG:START -->`/`<!-- CATALOG:END -->` block listing all three components grouped by their first tag, sorted alphabetically within each group.
  2. **existing catalog block is replaced, not appended** — seed `CLAUDE.md` that already contains markers with stale content; script regenerates between the markers, content outside the markers is untouched (assert by byte-comparing the prefix before `<!-- CATALOG:START -->`).
  3. **catalog row format** — assert each row contains the component name, status, oneLiner, and a relative link to the sidecar (e.g. `[Badge.md](./Badge.md)` for top-level; `[about.md](./pages/about.md)` for nested).
  4. **grouping by first tag, alphabetical within group** — seed components with tags `[card]` and `[layout, primitive]`; assert layout group precedes primitive group only if sorting tag groups alphabetically (decision: sort tag groups alphabetically, components alphabetically within). Document this assumption in the script comment and test.
  5. **local mode rewrites and exits 0** — `CI` env unset, catalog out of date → after run, file matches expected; exit 0; stdout includes a notice like `"catalog updated"`.
  6. **CI mode fails when catalog out of date** — set `CI=true` in `spawnSync` env, run on a state where the file's catalog block does not match what the script would generate. Script exits 1, stderr includes a diff or at least the message `Run pnpm sync:component-catalog locally and commit.`; file on disk is unchanged after the run.
  7. **CI mode exits 0 when catalog is in sync** — same as #6 but the file is already up to date. Exit 0, no changes.
  8. **deprecated status renders distinguishably** — seed one component with `status: deprecated`; assert the catalog row marks it (e.g. column shows `deprecated` literally, ordering unchanged).

- [ ] **Step 2: Run tests to confirm they fail.**

  Run `pnpm test`. Expected: catalog tests fail; coverage + schema tests still pass.

- [ ] **Step 3: Implement catalog generator.**

  Extend `scripts/check-component-docs.mjs`:
  - After successful coverage + schema, build an in-memory list of all sidecars with their frontmatter (path, name, status, oneLiner, tags).
  - Group by first tag. Sort tag groups alphabetically. Sort components alphabetically within each group.
  - Render a markdown block: an intro line (e.g. "Auto-generated by `scripts/check-component-docs.mjs`. Do not edit between markers.") followed by per-tag H3 + a table with columns `Component | Status | One-liner | Docs`. The `Docs` cell is a relative link from `components/CLAUDE.md` to the sidecar — top-level components are `./Foo.md`, nested are `./pages/foo.md`.
  - Wrap the rendered block in the literal markers `<!-- CATALOG:START -->` and `<!-- CATALOG:END -->`.
  - Read `<root>/CLAUDE.md`. If markers exist: replace everything between them with the new block (markers included so the replacement is idempotent — i.e. result still has markers). If markers do not exist: append a blank line + the wrapped block at the end of the file.
  - Diff the file's current bytes against the would-be-written bytes.

  Local vs CI behavior:
  - Read `process.env.CI`. If truthy: when diff is non-empty, print the diff (use `node:util` or roll a minimal one), print the suggested fix command, exit 1. When diff is empty, print "catalog in sync", exit 0.
  - If CI is unset: when diff is non-empty, write the new content to disk, print "catalog updated: <path>" in green, exit 0. When empty, print "catalog in sync", exit 0.

  Add a `--strict` CLI flag that forces CI behavior regardless of env, useful for local sanity checks.

- [ ] **Step 4: Run tests to confirm they pass.**

  Run `pnpm test`. Expected: all coverage + schema + catalog tests pass (count: ~6 + 12 + 8 = 26 component-docs tests, plus existing bilingual tests).

- [ ] **Step 5: Add `sync:component-catalog` package script.**

  In `package.json` `"scripts"` object, add `"sync:component-catalog": "node scripts/check-component-docs.mjs --root=src/components"`. This is the same command the prebuild will run; it lets the user invoke it explicitly when local autofix is desired.

- [ ] **Step 6: Manual sanity.**

  Run `pnpm sync:component-catalog`. Expected: coverage check fails (29 missing sidecars). This is correct — sidecar authoring is Tasks 4–7. No modifications to the working tree should occur because the script exits at coverage and never reaches catalog regeneration.

- [ ] **Step 7: Commit.**

  Stage modified script, test, package.json. Commit message:

  ```
  feat(scripts): generate components/CLAUDE.md catalog from sidecar frontmatter

  Adds catalog regeneration to check-component-docs.mjs. Local: autofix.
  CI: fail with a diff. Adds pnpm sync:component-catalog for explicit
  local sync. Still not wired into prebuild — sidecar authoring lands next.
  ```

---

## Task 4: Author primitive + analytics sidecars (8 files)

**Files:**

- Create: `src/components/Badge.md`
- Create: `src/components/Button.md`
- Create: `src/components/StructuredData.md`
- Create: `src/components/GoogleAnalytics.md`
- Create: `src/components/GTMAnalytics.md`
- Create: `src/components/PostHogAnalytics.md`
- Create: `src/components/CookieConsent.md`
- Create: `src/components/LanguageSwitcher.md`

- [ ] **Step 1: Read each component's `.astro` source.**

  For each of the 8 components, read the file. Note: props interface, every `t('…')` call, any imported assets / required external state, any environment variables consulted, any HTML side effects (scripts injected, listeners attached). The analytics + consent components are env-var-gated — capture which env vars and the no-op behavior when absent.

- [ ] **Step 2: Read the spec's sidecar template.**

  Re-read `docs/superpowers/specs/2026-05-28-component-sidecar-docs-design.md` §"Sidecar contract". Treat that as the schema. The seven H2s in order, with the exact heading text, are mandatory.

- [ ] **Step 3: Write each sidecar.**

  For each component, author the `.md`. Frontmatter:
  - `component`: PascalCase, equal to the `.astro` basename.
  - `oneLiner`: ≤80 chars. Concrete what it does, not marketing.
  - `status`: `stable` (all of these are stable today).
  - `tags`: pick a primary tag first (it drives catalog grouping). Suggested tags: `Badge` → `[primitive]`; `Button` → `[primitive]`; `StructuredData` → `[seo]`; `GoogleAnalytics`, `GTMAnalytics`, `PostHogAnalytics` → `[analytics]`; `CookieConsent` → `[consent]`; `LanguageSwitcher` → `[i18n]`.

  Body: write all seven sections. `When NOT to use` must point at the right alternative when applicable (e.g. Button `When NOT to use` → "as a link — use a styled `<a>`" if applicable). For analytics components, `Gotchas` must call out: env-var-gated, no-op without key, fires only after consent.

- [ ] **Step 4: Validate.**

  Run `node scripts/check-component-docs.mjs --root=src/components 2>&1 | head -40`. Coverage will still fail because Tasks 5–7 haven't run, but the schema validation runs after coverage in the script — so to validate the 8 new sidecars without coverage noise, temporarily run with a focused root or accept the coverage failure. Simpler: skim each new file against the spec template by hand; defer the full validation until Task 7 completes.

- [ ] **Step 5: Run Prettier.**

  Run `pnpm exec prettier --write 'src/components/{Badge,Button,StructuredData,GoogleAnalytics,GTMAnalytics,PostHogAnalytics,CookieConsent,LanguageSwitcher}.md'`. This normalizes table column widths and trailing whitespace.

- [ ] **Step 6: Commit.**

  Stage the 8 new files. Commit message:

  ```
  docs(components): add sidecars for primitives + analytics + consent

  Per the component sidecar spec: Badge, Button, StructuredData,
  GoogleAnalytics, GTMAnalytics, PostHogAnalytics, CookieConsent,
  LanguageSwitcher.
  ```

---

## Task 5: Author content card + section sidecars (8 files)

**Files:**

- Create: `src/components/BlogCard.md`
- Create: `src/components/BlogPost.md`
- Create: `src/components/TeamCard.md`
- Create: `src/components/FAQs.md`
- Create: `src/components/TrustSection.md`
- Create: `src/components/ComparisonTable.md`
- Create: `src/components/PageContent.md`
- Create: `src/components/LegalDocument.md`

- [ ] **Step 1: Mine the existing `src/components/CLAUDE.md`.**

  Open the current monolithic doc. Sections that already cover any of the eight components above (LegalDocument, ComparisonTable, TrustSection) contain rich content — extract it, restructure into the seven-section template. Add the missing sections (`When NOT to use`, `Gotchas`) using your understanding of each component's `.astro` source.

- [ ] **Step 2: Read each component's `.astro` source for the ones not in the existing doc.**

  BlogCard, BlogPost, TeamCard, FAQs, PageContent are not deeply documented today. For each, read the source: props, slots, i18n calls, image handling, any markdown rendering specifics (BlogPost uses `blog-prose` typography per the existing doc).

- [ ] **Step 3: Write each sidecar.**

  Frontmatter tag suggestions for grouping: `BlogCard`, `TeamCard` → `[card]`; `BlogPost` → `[content]`; `FAQs`, `TrustSection`, `ComparisonTable` → `[section]`; `PageContent` → `[content]`; `LegalDocument` → `[content, legal]`.

  Bodies follow the spec template. Pay attention to:
  - BlogCard `When NOT to use` → "single-post hero (use `BlogPost`)".
  - BlogPost `Gotchas` → blog-prose typography is mandatory; hero image required by ESLint alt-text rule.
  - TeamCard `Props` — derive from `Props` interface in the source.
  - FAQs `When NOT to use` → "marketing FAQ landing pages without schema markup needs — that's a content collection, not a component" if applicable; otherwise an honest "always fine here" note (but find at least one anti-trigger by reading the source carefully).
  - LegalDocument — carry the existing CLAUDE.md content verbatim where possible.

- [ ] **Step 4: Prettier-format the eight files.**

  Run `pnpm exec prettier --write 'src/components/{BlogCard,BlogPost,TeamCard,FAQs,TrustSection,ComparisonTable,PageContent,LegalDocument}.md'`.

- [ ] **Step 5: Commit.**

  Commit message:

  ```
  docs(components): add sidecars for cards, content, and sections

  BlogCard, BlogPost, TeamCard, FAQs, TrustSection, ComparisonTable,
  PageContent, LegalDocument. Existing CLAUDE.md content carried into
  the new per-component shape where applicable.
  ```

---

## Task 6: Author layout + filter + facade sidecars (5 files)

**Files:**

- Create: `src/components/Header.md`
- Create: `src/components/Footer.md`
- Create: `src/components/CollectionFilter.md`
- Create: `src/components/SpotifyFacade.md`
- Create: `src/components/YouTubeFacade.md`

- [ ] **Step 1: Carry over the rich existing content.**

  CollectionFilter, SpotifyFacade, YouTubeFacade have detailed sections in the existing `components/CLAUDE.md`. Carry the prose, props tables, examples, and i18n key tables into the new template. CollectionFilter's "How a page builds `facets` and `selected`" subsection is gold — keep it under an H3 inside `## Example`.

- [ ] **Step 2: Author Header and Footer from source.**

  Read `Header.astro` and `Footer.astro`. Document: nav structure, slot usage if any, i18n calls (likely many), how `LanguageSwitcher` is composed in. Tags suggestion: `[layout]`.

- [ ] **Step 3: Tag assignments.**

  `Header`, `Footer` → `[layout]`. `CollectionFilter` → `[filter]`. `SpotifyFacade`, `YouTubeFacade` → `[facade, media]` (primary tag `facade`).

- [ ] **Step 4: Prettier-format.**

  Run `pnpm exec prettier --write 'src/components/{Header,Footer,CollectionFilter,SpotifyFacade,YouTubeFacade}.md'`.

- [ ] **Step 5: Commit.**

  Commit message:

  ```
  docs(components): add sidecars for layout, filter, and media facades

  Header, Footer, CollectionFilter, SpotifyFacade, YouTubeFacade.
  Pulls the existing CLAUDE.md detail for CollectionFilter and the
  facades into the new per-component shape.
  ```

---

## Task 7: Author page-template sidecars (7 files)

**Files:**

- Create: `src/components/pages/about.md`
- Create: `src/components/pages/blog-index.md`
- Create: `src/components/pages/contact.md`
- Create: `src/components/pages/imprint.md`
- Create: `src/components/pages/privacy.md`
- Create: `src/components/pages/services.md`
- Create: `src/components/pages/team.md`

- [ ] **Step 1: Read each page `.astro`.**

  Page templates are compositions — what matters for the sidecar is which components they compose, which content collection they read from, and which props/locale they accept.

- [ ] **Step 2: Author each sidecar with `tags: [page]`.**

  Frontmatter:
  - `component`: lower-case basename (e.g. `about`). Filenames here are kebab-case lowercase, not PascalCase. The schema check from Task 2 asserts `component === basename(file, '.md')` — matches whichever case the file uses, so this works.
  - `tags`: `[page]` (plus optional secondary tag like `[page, legal]` for imprint/privacy if useful).

  Body sections are reinterpreted for page templates:
  - `## Purpose` — one-sentence summary of what the page does.
  - `## When to use` — "On a site that has a `<key>` entry in `PAGES`" (reference the page-registry).
  - `## When NOT to use` — point at the alternative page if there is overlap (e.g. blog-index `When NOT to use` → "if you want a single post, that's a content-collection entry, not this template").
  - `## Props` — usually just `lang`. Render as a Props table with that single row.
  - `## Example` — for a page, "what it composes" — list the components it imports and the order it stacks them. Plain prose + a bullet list of `<ComponentName>` references. The schema allows H3 inside; no need to invent code.
  - `## i18n keys` — list every t-call the page makes.
  - `## Gotchas` — locale assumptions, slug-pair requirements (DE/EN bilingual rule), any content-collection dependencies.

- [ ] **Step 3: Prettier-format.**

  Run `pnpm exec prettier --write 'src/components/pages/*.md'`.

- [ ] **Step 4: Run the full check script locally.**

  Run `pnpm sync:component-catalog`. Expected: coverage passes (all 29 sidecars present), schema passes (all valid), catalog regeneration triggers — but at this point `src/components/CLAUDE.md` still has the old monolithic content with no markers, so the script will APPEND a brand-new catalog block at the end. That's OK as an intermediate state; Task 8 rewrites the file.

  If schema errors surface, fix them in the sidecars now before continuing.

- [ ] **Step 5: Discard the autoappended catalog block from CLAUDE.md.**

  Use `git diff src/components/CLAUDE.md` to see the appended block. Run `git checkout -- src/components/CLAUDE.md` to revert — the CLAUDE.md rewrite is the next task and we want a clean slate for it.

- [ ] **Step 6: Commit.**

  Stage only the 7 page sidecars. Commit message:

  ```
  docs(components): add sidecars for page templates

  about, blog-index, contact, imprint, privacy, services, team —
  tagged [page]. Example sections describe composition rather than
  self-invocation.
  ```

---

## Task 8: Rewrite `components/CLAUDE.md` + wire prebuild

**Files:**

- Modify: `src/components/CLAUDE.md`
- Modify: `package.json` (extend `prebuild`)

- [ ] **Step 1: Rewrite `src/components/CLAUDE.md` to the shrunken form.**

  Replace the whole file with two regions:
  - **Top, hand-maintained** (~30–40 lines): the existing intro paragraph + the existing `## Conventions` block (Astro over React, no hex, lucide icons, i18n, Images). Plus a one-liner under the catalog markers explaining "This catalog is auto-generated by `scripts/check-component-docs.mjs`. Do not edit between the markers — edit the per-component `.md` sidecar instead."
  - **Bottom**: an empty pair of catalog markers (literal `<!-- CATALOG:START -->` and `<!-- CATALOG:END -->` on their own lines, separated by a blank line). The next step will populate them.

  All the per-component prose currently in the file has already moved into sidecars during Tasks 4–6. The rewrite removes it.

- [ ] **Step 2: Populate the catalog.**

  Run `pnpm sync:component-catalog`. Expected:
  - Coverage passes (29 sidecars).
  - Schema passes.
  - Catalog block between the markers is populated with H3-per-tag-group tables.
  - Stdout reports "catalog updated".
  - Exit 0.

  If anything fails, fix and re-run.

- [ ] **Step 3: Eyeball the rendered CLAUDE.md.**

  Read the file. Check:
  - Top region is intact and readable.
  - Catalog block follows the spec: H3 per tag, table columns `Component | Status | One-liner | Docs`, sorted as specified.
  - Every component appears exactly once.
  - Page sidecars appear under their `page` group with `./pages/<slug>.md` links.

- [ ] **Step 4: Wire prebuild.**

  In `package.json`, change `"prebuild": "node scripts/check-bilingual.mjs"` to also run the component-docs check after the bilingual check. Use shell `&&` chaining — both must pass.

- [ ] **Step 5: Validate the full build path.**

  Run `pnpm build`. Expected: prebuild passes (bilingual check + component-docs check both green), then `astro sync && lint && typecheck && astro build && postbuild-headers` all complete. If anything fails downstream (lint flags a sidecar markdown, etc.), fix and re-run.

- [ ] **Step 6: Simulate CI behavior locally.**

  Edit one sidecar's `oneLiner` to differ slightly without running sync. Then run `CI=true pnpm sync:component-catalog`. Expected: exit 1, stderr names the offending file and tells you to run the sync command locally. Revert the edit, re-run without `CI=true`, file is updated, exit 0. Confirms CI vs local behavior matches spec §"Check script behavior".

- [ ] **Step 7: Commit.**

  Stage `src/components/CLAUDE.md` and `package.json`. Commit message:

  ```
  refactor(components): rewrite CLAUDE.md as index + auto-gen catalog

  Per-component docs now live in sidecar .md files (see prior commits).
  This commit shrinks components/CLAUDE.md to shared conventions plus
  the auto-generated catalog block, and wires check-component-docs.mjs
  into prebuild so coverage + schema + catalog stay green or the build
  fails.
  ```

---

## Task 9: Update the `passionfruit-content` skill

**Files:**

- Modify: `.claude/skills/passionfruit-content/SKILL.md`

- [ ] **Step 1: Broaden the trigger description.**

  In the YAML frontmatter, edit the `description` field to also mention component edits (e.g. extend the trigger list with "or anything inside `src/components/`"). Keep the rest of the description tight.

- [ ] **Step 2: Add a "Components" section to the skill body.**

  At the bottom of the existing skill body (after the current sections), add a new H2 "Components" with these rules in concise prose:
  - Every component has a sidecar `.md` file next to its `.astro`.
  - Before editing or composing with a component, read the sidecar first.
  - When creating a new component, create the sidecar in the same change. The prebuild check fails otherwise.
  - The full template is defined in `docs/superpowers/specs/2026-05-28-component-sidecar-docs-design.md` § "Sidecar contract". Link to it.
  - Pointer to a representative sidecar example (e.g. `src/components/CollectionFilter.md`) so a fresh session can see the shape immediately.
  - Note: editing `src/components/CLAUDE.md` between the catalog markers is forbidden — that block is auto-generated. Edits go in sidecars; the catalog regenerates on next build or `pnpm sync:component-catalog`.

  Keep it to ~10–12 lines. The skill is a pointer, not a duplicate of the spec.

- [ ] **Step 3: Smoke test.**

  Read the skill file end-to-end. Verify the description still under ~250 chars (skill description limits — match the existing length). Verify the new section is the same Markdown style as existing sections.

- [ ] **Step 4: Commit.**

  Commit message:

  ```
  feat(skills): extend passionfruit-content with component sidecar rules

  Broadens trigger to fire on src/components/ edits. Adds a Components
  section pointing at the sidecar spec and template, and the rule that
  the auto-generated catalog block in components/CLAUDE.md is off-limits.
  ```

---

## Task 10: Update root docs

**Files:**

- Modify: `CLAUDE.md` (project root)
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Update `CLAUDE.md` §2 self-improvement rule.**

  Add a bullet under the existing list: a new sidecar `.md` is required for every new component. The check script fails the build otherwise.

- [ ] **Step 2: Update `CLAUDE.md` §7 component conventions.**

  Add a bullet: "Every component has a sidecar `.md`. See `src/components/CLAUDE.md` for the catalog, the spec for the template."

- [ ] **Step 3: Update `CLAUDE.md` §11 quality checklist.**

  Add a checklist item: "New components have a sidecar `.md`."

- [ ] **Step 4: Update `CLAUDE.md` §16 commands table.**

  Add a row: `pnpm sync:component-catalog` — Regenerate the component catalog block in `components/CLAUDE.md` from sidecar frontmatter.

- [ ] **Step 5: Add a "Components" section to `CONTRIBUTING.md`.**

  Mirror the existing "Blog post" / "Team member" / "Page" sections in style. Cover: file layout (sibling `<Name>.md`), required frontmatter, required H2 sections, how to run the check, how to fix a stale catalog. Reference the spec for the canonical template.

- [ ] **Step 6: Validate.**

  Run `pnpm check:spelling`. Run `pnpm lint`. Both should pass. Run `pnpm build` to ensure the full chain still works after doc changes.

- [ ] **Step 7: Commit.**

  Commit message:

  ```
  docs: document component sidecar workflow in root CLAUDE.md and CONTRIBUTING.md
  ```

---

## Task 11: Push, open PR, verify CI

**Files:** none.

- [ ] **Step 1: Final local check.**

  Run `pnpm check:all`. Expected: spell check + a11y + build (which runs both prebuild checks) + link check all pass.

- [ ] **Step 2: Push the branch.**

  Run `git push -u origin feat/component-sidecars`.

- [ ] **Step 3: Open the PR.**

  Run `gh pr create --fill` (or use the longer form per CLAUDE.md §15). Title: "feat(components): per-component sidecar docs + auto-generated catalog". Body: short summary referencing the spec doc + a bullet list of what changed. Include a "Test plan" checklist:
  - [ ] CI is green
  - [ ] Cloudflare preview deploys and renders
  - [ ] `components/CLAUDE.md` reads cleanly and the catalog table looks right
  - [ ] A randomly chosen sidecar renders fine when previewed locally as markdown

- [ ] **Step 4: Wait for CI + preview.**

  CI must include the component-docs check (it does — it runs as `prebuild` during `pnpm build`). The CI step that runs with `CI=true` should fail loudly if a sidecar drifts from the catalog.

- [ ] **Step 5: Squash-merge once green.**

  Per CLAUDE.md §15: squash merge with PR title + description as the commit message. Auto-delete the head branch.

---

## Self-review

**Spec coverage:**

- Sidecar location & naming → enforced by Task 1 coverage check, validated in Task 7 step 4.
- Frontmatter schema → Task 2.
- Required H2s in order, no extras → Task 2.
- `components/CLAUDE.md` two-region shape → Task 8 step 1.
- Catalog regeneration with markers, H3-per-tag, sorted → Task 3 + Task 8 step 2.
- Local-autofix / CI-fail behavior → Task 3, simulated in Task 8 step 6.
- Script wired into `prebuild` → Task 8 step 4.
- Skill extension → Task 9.
- Migration of existing CLAUDE.md content into sidecars in a single PR → Tasks 4-8 in one branch.
- CONTRIBUTING.md + root CLAUDE.md updates → Task 10.

**Placeholder scan:** every step describes a concrete action, with file paths and commands. No "TBD"/"add appropriate"/"similar to". Code is described in prose per the user's no-code-snippets-in-plans rule; commands are exact.

**Type consistency:** the script's CLI flag set is consistent across tasks (`--root`, `--strict`); package.json script names are consistent (`sync:component-catalog`); catalog marker strings are spelled identically across spec, script implementation, and CLAUDE.md rewrite (`<!-- CATALOG:START -->` / `<!-- CATALOG:END -->`).

**Open assumption flagged in plan, not deferred:** tag-group sort order (alphabetical) and within-group component sort (alphabetical) — fixed in Task 3 step 3 and tested in Task 3 step 1 case 4. Spec lists this as an "open question / future work" if it scatters related components confusingly; the implementation matches the spec's deferred-until-pain choice.
