# OG image generator — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `pnpm generate-og` — a fast, free, local generator that turns `site.name` + `site.tagline` + `--color-accent` + `public/favicon.svg` into beautiful 1200×630 PNGs at `public/og-default-de.png` and `public/og-default-en.png`. Wire `BaseLayout` to pick by locale. Keep the existing AI path (`pnpm generate-image`) intact.

**Architecture:** Discovery → Template (JSX) → Satori (SVG) → resvg (PNG) → file write. Four small modules in `scripts/`, plus a CLI orchestrator and one test file. JSX uses the `react-jsx` transform already configured in `tsconfig.json`; the existing `tsx` runner handles `.tsx` natively.

**Tech Stack:** Node 22 (`type: "module"`), `tsx` (already present), `satori` (new), `@resvg/resvg-js` (new), `@fontsource/inter` (new devDep — ships WOFF; Satori 0.26 accepts WOFF, TTF, OTF but explicitly rejects WOFF2, which is what the existing `@fontsource-variable/inter` ships). `node:test` for tests, matching `scripts/check-bilingual.test.mjs`.

**Spec:** `docs/superpowers/specs/2026-05-28-og-image-generator-design.md`. All decisions there (D1–D8) are binding.

**No code snippets in this plan.** Every task names files, signatures, behaviors, expected outputs, and assertions — never an actual implementation. Future-me is the implementer.

---

## Pre-flight notes

- **Worktree quirk:** the pre-commit hook fails the first time because pnpm's deps-status check runs `pnpm install` → `prepare` → `lefthook install` → fails on the worktree's `core.hooksPath`. Workaround: run `pnpm install --ignore-scripts` once at session start. After that, commits go through cleanly. See the prior commit `2b0cbe0` for context.
- **Font format:** Satori does NOT accept WOFF2. The site's existing `@fontsource-variable/inter` dep is WOFF2-only. Satori does accept WOFF. We add `@fontsource/inter` (v5.x) as a devDep — it ships per-weight WOFF in `node_modules/@fontsource/inter/files/inter-latin-{400,700}-normal.woff`. Two weights (400 + 700) are enough for the template.
- **JSX execution:** `tsconfig.json` already sets `"jsx": "react-jsx"` and excludes `scripts/` from tsc. The `tsx` runner uses esbuild and respects the same config. JSX in `scripts/og-template.tsx` Just Works without an `import React` line.
- **Default values for missing data:** the script must be honest about failures. The accent color is the only soft fallback — everything else exits non-zero with a clear message naming the missing file/key.

---

## File structure (locked in here)

Added:

- `scripts/og-discover.ts` — reads project data. Pure functions, no I/O side effects beyond `fs.readFileSync`.
- `scripts/og-template.tsx` — Satori-compatible JSX template function.
- `scripts/og-render.ts` — wires discovery + template + satori + resvg into a `Buffer` producer.
- `scripts/generate-og.ts` — CLI entry: arg parsing, font loading, orchestration, file writes, exit codes.
- `scripts/generate-og.test.ts` — node:test suite, end-to-end via spawning the CLI.
- `scripts/fixtures/og/src/i18n/de.json`, `scripts/fixtures/og/src/i18n/en.json`, `scripts/fixtures/og/src/styles/global.css`, `scripts/fixtures/og/public/favicon.svg` — minimal fake project root for failure-path tests (mirrors the real project shape so `--project-root scripts/fixtures/og` works directly).

Modified:

- `package.json` — add `satori`, `@resvg/resvg-js` (deps), `@fontsource/inter` (devDep), and `"generate-og": "tsx scripts/generate-og.ts"` script entry.
- `src/layouts/BaseLayout.astro` — `defaultOgImage` interpolates `lang`.
- `src/pages/[...path].astro` — BlogPosting JSON-LD picks locale-specific filename.
- `.claude/skills/brand.md` — Step 2 becomes the three-option fork.
- `CLAUDE.md` — section 12 + commands table.

Removed:

- `public/og-default.png` (replaced by two locale variants generated at the end of the plan).

---

## Tasks

### Task 1 — Install dependencies

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (auto)

**Steps:**

- [ ] **1.1** Add `satori` (latest, expected major: 0.x) and `@resvg/resvg-js` (latest, expected major: 2.x) to `dependencies`. Add `@fontsource/inter` (latest, v5.x) to `devDependencies`.

- [ ] **1.2** Run `pnpm install --ignore-scripts`. Verify the three new packages appear under `node_modules/`. Verify `node_modules/@fontsource/inter/files/inter-latin-400-normal.woff` and `node_modules/@fontsource/inter/files/inter-latin-700-normal.woff` both exist. If they don't, the wrong font package was added — stop and reconsider before continuing.

- [ ] **1.3** Commit: `chore(deps): add satori, @resvg/resvg-js, @fontsource/inter for og generator`.

---

### Task 2 — Test fixtures

**Files:**

- Create: `scripts/fixtures/og/src/i18n/de.json`
- Create: `scripts/fixtures/og/src/i18n/en.json`
- Create: `scripts/fixtures/og/src/styles/global.css`
- Create: `scripts/fixtures/og/public/favicon.svg`

**Why:** Discovery-layer failure tests need a known-bad project root. The CLI tests use these to exercise missing-key paths and bad-input paths without polluting the real project files.

**Steps:**

- [ ] **2.1** Create `scripts/fixtures/og/src/i18n/de.json` and `scripts/fixtures/og/src/i18n/en.json` mirroring the real i18n structure but with only the `site` block (`site.name`, `site.tagline`). DE uses "Fixture DE" and "DE-tagline"; EN uses "Fixture EN" and "EN-tagline". Keep these strings short and recognizable in test failures.

- [ ] **2.2** Create `scripts/fixtures/og/src/styles/global.css` containing a minimal `@theme` block with only `--color-accent: #ff0099;` — a deliberately non-brand color so test assertions can detect that the discovery layer actually read it.

- [ ] **2.3** Create `scripts/fixtures/og/public/favicon.svg` — a tiny 32×32 SVG with a single distinguishable element (e.g., a red circle). The script will embed this; the test doesn't need to verify pixel content, only that the discovery layer returns the file contents as a string.

- [ ] **2.4** Commit: `test(og): add fixtures for og generator tests`.

---

### Task 3 — Discovery layer

**Files:**

- Create: `scripts/og-discover.ts`

**Public signature:**

- `type Locale = 'de' | 'en'`
- `interface SiteData { name: string; tagline: string; accent: string; logoSvg: string; }`
- `class OgDiscoverError extends Error {}` — discriminator for failure paths.
- `loadSiteData(projectRoot: string, lang: Locale): SiteData`
  - Reads `${projectRoot}/src/i18n/${lang}.json` synchronously. Asserts the parsed object contains `site.name` (string) and `site.tagline` (string). Throws `OgDiscoverError` naming the missing key + file path otherwise.
  - Reads `${projectRoot}/src/styles/global.css` synchronously. Extracts the first `--color-accent: <value>;` declaration via a non-greedy regex matched against the line. Trims, returns the raw value. If the file is unreadable, throws `OgDiscoverError`. If the declaration is missing or the value is not a `#rrggbb` hex literal, returns the fallback `#6366f1` and writes a single line to `process.stderr` starting with `[warn]`.
  - Reads `${projectRoot}/public/favicon.svg` synchronously. Returns the raw string. Throws `OgDiscoverError` naming the path if missing.

**Tests:** covered in Task 7 (CLI tests exercise this via the spawn flow). No standalone unit tests.

**Steps:**

- [ ] **3.1** Implement `og-discover.ts`. Use `node:fs` `readFileSync`, no async. All thrown errors must carry messages that name the file and (for missing keys) the missing key.

- [ ] **3.2** Sanity-check by importing into a one-off REPL or `tsx -e` and calling `loadSiteData(process.cwd(), 'en')` against the real project. Expect `{ name: 'Greenleaf Digital', tagline: 'Digital solutions with passion', accent: '#6366f1', logoSvg: '<svg ...>' }`. Then call with the fixture root and expect `name: 'Fixture EN'`, `accent: '#ff0099'`.

- [ ] **3.3** Commit: `feat(og): add project-data discovery layer`.

---

### Task 4 — Template

**Files:**

- Create: `scripts/og-template.tsx`

**Public signature:**

- `interface OgTemplateProps { name: string; tagline: string; accent: string; logoSvg: string; lang: 'de' | 'en'; }`
- `function OgTemplate(props: OgTemplateProps): JSX.Element`

**Layout (Layout B from spec D3):**

- Outer container: 1200×630, `display: flex`, `flexDirection: column`, `padding: 64px 96px`, background `#0c0c1d`, font family `Inter`, color `#f0f0f5`. Satori's flex implementation is constrained — only one flex direction per node, no `align-items: stretch` quirks, no CSS variables.
- Background depth: a single absolutely-positioned `<div>` matching the outer size with `background: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.18) 0%, transparent 60%)`. Satori supports CSS radial-gradient syntax.
- Top lockup row: `flex`, `flexDirection: row`, `alignItems: center`, `gap: 20px`, `marginBottom: 48px`.
  - Logo: render the `logoSvg` string inline. Satori accepts SVG via `<img src={"data:image/svg+xml;utf8," + encodeURIComponent(logoSvg)}>` — width 52, height 52.
  - Name: `<div>` font size 28, font weight 600, letter-spacing -0.01em.
- Hero (tagline): `<div>` font size 72, font weight 700, line-height 1.08, letter-spacing -0.02em, max-width 92% of canvas. Satori truncates with ellipsis when text overflows its container.

**Color handling:** the `accent` prop is plumbed in but used only for the background-glow stop color (D5 — accent is the brand color, and the radial behind the lockup picks up the accent for downstream brands with non-indigo accent colors). The body text stays `#f0f0f5`.

**Steps:**

- [ ] **4.1** Implement `og-template.tsx`. Use only inline style objects (no className, no Tailwind — Satori does not understand Tailwind). No `import React` (the `react-jsx` transform handles it). The function must be synchronous and pure.

- [ ] **4.2** Manual smoke check: import into `tsx -e`, call with fixture-like props, JSON-stringify the returned element to confirm it's a single root node with the expected children. Skip rendering at this step — that's Task 5.

- [ ] **4.3** Commit: `feat(og): add jsx template`.

---

### Task 5 — Render layer

**Files:**

- Create: `scripts/og-render.ts`

**Public signature:**

- `interface RenderInput { props: OgTemplateProps; fonts: SatoriOptions['fonts']; }`
- `renderOg(input: RenderInput): Promise<Buffer>` — returns a PNG buffer.

**Behavior:**

- Calls `satori(<OgTemplate {...props} />, { width: 1200, height: 630, fonts })`. Returns an SVG string.
- Passes the SVG into `new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })`, calls `.render().asPng()`, returns the Buffer.
- No file I/O. No font loading (the CLI loads fonts once and passes them in).

**Steps:**

- [ ] **5.1** Implement `og-render.ts`.

- [ ] **5.2** Standalone smoke run inside `tsx -e`: load the two WOFF files from `node_modules/@fontsource/inter/files/inter-latin-{400,700}-normal.woff` as Buffers, call `loadSiteData(cwd, 'en')` for real props, call `renderOg(...)`, write the buffer to `/tmp/og-smoke.png`. Open the file (or `file /tmp/og-smoke.png`) — expect `PNG image data, 1200 x 630, 8-bit/color RGB`.

- [ ] **5.3** Commit: `feat(og): add satori+resvg render pipeline`.

---

### Task 6 — CLI orchestrator

**Files:**

- Create: `scripts/generate-og.ts`

**CLI surface (spec §6):**

- No args: regenerate both locales into `${projectRoot}/public/`.
- `--lang de|en`: regenerate one locale.
- `--out-dir <path>`: override the output directory (default `public/`). Needed by tests to write to a tmp dir without polluting the real `public/`.
- `--project-root <path>`: override the project root (default `process.cwd()`). Needed by tests to point at fixtures.
- `--help` / `-h`: print usage, exit 0.
- Any unknown flag: print usage to stderr, exit 1.

**Behavior:**

- Resolves `projectRoot` once at the top.
- Loads the two WOFF files from `${projectRoot}/node_modules/@fontsource/inter/files/inter-latin-{400,700}-normal.woff`. If either is missing, exits 1 with a message naming the path and suggesting `pnpm install`.
- Iterates `['de', 'en']` (or just the one from `--lang`):
  - Calls `loadSiteData(projectRoot, lang)`. Any `OgDiscoverError` is caught and printed to stderr; the process exits 1 immediately (no partial outputs).
  - Calls `renderOg({ props: { ...siteData, lang }, fonts })`.
  - Writes the PNG to `${outDir}/og-default-${lang}.png`. Creates `outDir` recursively if missing.
  - Prints one line to stdout per file written: `Wrote og-default-${lang}.png (${size} bytes)`.
- Exit 0 on success.

**Steps:**

- [ ] **6.1** Implement `generate-og.ts`. Mirror the arg-parsing style of `scripts/generate-image.ts` for consistency (simple `while (i < args.length)` loop, no commander/yargs). Tolerate `=` syntax (`--lang=de`) only if it's already in the style of `generate-image.ts`; if not, don't add it.

- [ ] **6.2** Manual run: `pnpm install --ignore-scripts` (in case Task 1 deps need linking), then `tsx scripts/generate-og.ts`. Expect both PNGs written to `public/`. Open both — DE shows "Greenleaf Digital" + "Digitale Lösungen mit Leidenschaft"; EN shows "Greenleaf Digital" + "Digital solutions with passion". Both 1200×630.

- [ ] **6.3** Manual run: `tsx scripts/generate-og.ts --lang de`. Expect only the DE file regenerated (compare mtime).

- [ ] **6.4** Manual run: `tsx scripts/generate-og.ts --lang fr`. Expect exit code 1 and a stderr message naming the accepted values.

- [ ] **6.5** Manual run: `tsx scripts/generate-og.ts --project-root scripts/fixtures/og`. Expect failure — fixture root has no `node_modules`. This is fine; tests will work around it by pointing `--project-root` at a layout that does have node_modules (see Task 7).

- [ ] **6.6** Commit: `feat(og): add generate-og cli`.

---

### Task 7 — Tests

**Files:**

- Create: `scripts/generate-og.test.ts`

**Pattern:** mirror `scripts/check-bilingual.test.mjs`. Each `test()` block spawns `tsx scripts/generate-og.ts <args>` via `node:child_process` `spawnSync`, asserts on `exitCode`, `stdout`, `stderr`, and (where relevant) on the existence + header of files in a tmp `out-dir`.

**Test harness setup:**

- Use `node:fs` `mkdtempSync` to get a per-test tmp `out-dir` under `os.tmpdir()`.
- Use a per-test tmp project root for the failure-mode tests: copy `scripts/fixtures/og/*` into a fresh tmp dir + symlink the project's `node_modules` into it so the CLI can load fonts. (Alternative: stage a hybrid project root by re-using the real `node_modules` via an env var override. Simpler: symlink.)

**Cases (one `test()` per case):**

- [ ] **7.1 — default run writes both locales.** Spawn `tsx scripts/generate-og.ts --out-dir <tmp>`. Assert exit 0. Assert `og-default-de.png` and `og-default-en.png` both exist in `<tmp>`. Assert both start with the PNG magic bytes `\x89PNG\r\n\x1a\n`. Assert IHDR width+height read at offsets 16–24 are `1200, 630`.

- [ ] **7.2 — `--lang de` writes only de.** Spawn `tsx scripts/generate-og.ts --out-dir <tmp> --lang de`. Assert exit 0. Assert `og-default-de.png` exists in `<tmp>`. Assert `og-default-en.png` does NOT exist.

- [ ] **7.3 — `--lang en` writes only en.** Symmetric to 7.2.

- [ ] **7.4 — invalid lang exits 1 with helpful message.** Spawn with `--lang fr`. Assert exit 1. Assert stderr contains both `fr` and `de, en`.

- [ ] **7.5 — missing tagline (fixture) exits 1.** Build a tmp project root: copy `scripts/fixtures/og/*` into a fresh tmp, then rewrite `src/i18n/en.json` to delete `site.tagline`. Spawn `tsx scripts/generate-og.ts --project-root <tmp-root> --out-dir <tmp-out>`. Assert exit 1. Assert stderr names `site.tagline` and the file path.

- [ ] **7.6 — missing favicon (fixture) exits 1.** Similar to 7.5; delete the fixture `public/favicon.svg`. Assert stderr names `public/favicon.svg`.

- [ ] **7.7 — bad accent color (fixture) succeeds with warning.** Use fixture root; rewrite `global.css` to set `--color-accent: not-a-color;`. Assert exit 0. Assert stderr contains `[warn]`. Assert the file is still written.

- [ ] **7.8** Add an npm script `"test:og": "node --test scripts/generate-og.test.ts"` to `package.json` and update the existing `"test"` script to run both bilingual + og tests (sequential `&&`).

- [ ] **7.9** Run `pnpm test`. All 14 bilingual tests + the 7 og tests must pass.

- [ ] **7.10** Commit: `test(og): add cli end-to-end tests`.

---

### Task 8 — BaseLayout integration

**Files:**

- Modify: `src/layouts/BaseLayout.astro` (line 38: `defaultOgImage`)

**Steps:**

- [ ] **8.1** Change `defaultOgImage` from the hard-coded `/og-default.png` to a template literal interpolating `lang`. Result: `/og-default-${lang}.png`.

- [ ] **8.2** Verify nothing else in `BaseLayout.astro` references the old filename. The two `<meta>` tags use `effectiveOgImage`, which is derived from `defaultOgImage` — no other change needed.

- [ ] **8.3** Commit: `feat(layout): pick og image by locale`.

---

### Task 9 — Structured-data integration

**Files:**

- Modify: `src/pages/[...path].astro` (around line 62: the `buildBlogPostingLd` call passes `${Astro.site?.href ?? ""}og-default.png`)

**Steps:**

- [ ] **9.1** Replace the hard-coded `og-default.png` with the locale-aware variant — the function call already has `lang` in scope. Result: `${Astro.site?.href ?? ""}og-default-${lang}.png`.

- [ ] **9.2** Grep the repo one more time for any other reference: `rg "og-default(?!\-)" src/ public/` — should return only `_headers` (which can match a prefix glob and stays as-is; see Task 11).

- [ ] **9.3** Commit: `feat(structured-data): pick og image by locale`.

---

### Task 10 — Generate the new images, delete the old

**Files:**

- Create: `public/og-default-de.png`, `public/og-default-en.png`
- Remove: `public/og-default.png`

**Steps:**

- [ ] **10.1** Run `pnpm generate-og` (now wired up via Task 6). Expect both PNGs in `public/`. Visually compare against the approved mockup — they should match Layout B from the spec (logo top-left, name lockup, big tagline).

- [ ] **10.2** Delete `public/og-default.png` via `git rm public/og-default.png`.

- [ ] **10.3** Commit: `feat(og): generate localized og images, drop legacy default`.

---

### Task 11 — Update Cloudflare `_headers`

**Files:**

- Modify: `public/_headers`

**Why:** the file currently has a specific entry for `/og-default.png` (long-cache header). The two new locale variants need the same treatment, and the old line should go.

**Steps:**

- [ ] **11.1** Open `public/_headers`. Find the `/og-default.png` block. Replace with two entries, one each for `/og-default-de.png` and `/og-default-en.png`, copying the existing cache header verbatim.

- [ ] **11.2** Run `pnpm build` and `pnpm check:links` (the latter requires the build output). Expect both clean.

- [ ] **11.3** Commit: `feat(headers): cache-header localized og images`.

---

### Task 12 — `/brand` skill update

**Files:**

- Modify: `.claude/skills/brand.md`

**Steps:**

- [ ] **12.1** In Step 2, replace the single free-form AI prompt with an `AskUserQuestion` block offering three options: "Branded template (Recommended)" / "AI generated" / "Skip". Recommended option's description should mention `pnpm generate-og`, "<1 second", and "no API key needed". The AI option's description keeps the existing OpenAI flow intact (still routes to `pnpm generate-image`).

- [ ] **12.2** Update the "Step 3: Verify Integration" section: when the branded-template path was chosen, expect `public/og-default-de.png` AND `public/og-default-en.png`. When AI was chosen, expect `public/og-default-de.png` (the prompt writes there now, with a follow-up note that the EN version still needs to be generated — or recommend regenerating both via the template). Reword the final message to mention the locale variants.

- [ ] **12.3** Sanity-read the updated skill end-to-end. No dangling references to the singular `og-default.png`.

- [ ] **12.4** Commit: `chore(brand): fork og generation into template vs ai paths`.

---

### Task 13 — CLAUDE.md update

**Files:**

- Modify: `CLAUDE.md`

**Steps:**

- [ ] **13.1** In section 12 ("Image generation"), add a short paragraph at the top noting that `pnpm generate-og` produces the site's social sharing image from `site.name` + `site.tagline` + brand accent + favicon, in both locales, without an API key. Keep the existing `pnpm generate-image` documentation for the AI path.

- [ ] **13.2** In section 16 ("Commands"), add a row: `pnpm generate-og` — "Regenerate localized OG sharing images from project data".

- [ ] **13.3** Re-scan for any references to the singular `og-default.png` in CLAUDE.md, STYLE_GUIDE.md, CONTRIBUTING.md. Update if present.

- [ ] **13.4** Commit: `docs: document pnpm generate-og`.

---

### Task 14 — End-to-end verification

**Steps:**

- [ ] **14.1** `pnpm install --ignore-scripts` (in case the env is stale).

- [ ] **14.2** `pnpm build` — runs lint, typecheck, bilingual check, and astro build. Expect green.

- [ ] **14.3** `pnpm check:all` — runs spelling, a11y, build, link check. Expect green.

- [ ] **14.4** `pnpm test` — bilingual + og tests. Expect green.

- [ ] **14.5** `pnpm dev` — open http://localhost:4321/ and http://localhost:4321/en/. In each tab, view source and confirm the `og:image` and `twitter:image` meta tags point at the locale-correct filename (`/og-default-de.png` for `/`, `/og-default-en.png` for `/en/`). Confirm the images load (open them directly in the browser).

- [ ] **14.6** Open `public/og-default-de.png` and `public/og-default-en.png` in an image viewer. Visually check against the approved mockup. Key acceptance criteria: 1200×630, dark background, logo-and-name lockup at top, large tagline below, subtle brand-color glow behind the text.

- [ ] **14.7** Test in a real social preview tool (https://www.opengraph.xyz/ or LinkedIn's Post Inspector) by pasting the live preview URL once the branch is deployed via Cloudflare Pages preview — but this is post-merge, not a blocker for the plan.

- [ ] **14.8** If everything is green, open a PR via `gh pr create --fill`. Otherwise, fix what's broken before claiming done.

---

## Self-review

**Spec coverage:**

- D1 (Satori + resvg) → Task 1, 5
- D2 (two locale files) → Task 6, 10, 8, 9
- D3 (Layout B) → Task 4, 10 (visual check)
- D4 (always render favicon.svg) → Task 3, 4
- D5 (auto-discover inputs) → Task 3
- D6 (1200×630) → Task 4, 7.1 (asserts dimensions)
- D7 (delete old in same commit cluster) → Task 10
- D8 (AI path untouched) → Task 12 (fork, no edits to generate-image.ts)

All spec sections (1–12) traced to at least one task. No gaps.

**Placeholder scan:** searched for "TBD", "TODO", "implement later", "Add appropriate", "Write tests for the above" — none present. Every step names a file path, a behavior, and/or an expected output.

**Type/signature consistency:**

- `Locale` is `'de' | 'en'` everywhere (Tasks 3, 6, 7).
- `SiteData` is defined in Task 3 and consumed in Task 6 only — no drift.
- `OgTemplateProps` adds `lang: Locale` (Task 4) — Task 6 constructs it from `SiteData` + `lang`; consistent.
- `renderOg` (Task 5) takes `{ props, fonts }` — Task 6 passes both; consistent.
- `OgDiscoverError` is thrown in Task 3 and caught in Task 6; named exactly the same.

No inconsistencies found.
