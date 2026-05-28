# OG image generator — design

Date: 2026-05-28
Branch: `worktree-feat+og-image-generator`

## 1. Context

Today every page in the template uses one static OG image at `public/og-default.png` (a 1.8 MB placeholder). The image is wired into `BaseLayout.astro` and into the BlogPosting JSON-LD in `src/pages/[...path].astro`.

There is already a `/brand` skill whose Step 2 generates the OG image by asking the user to describe an image and calling `pnpm generate-image` (OpenAI GPT Image). That path is slow, costs money per generation, requires an API key, and yields inconsistent results because the quality depends entirely on the prompt.

The site is bilingual (DE / EN) but the single OG image either has to be language-neutral (no text) or pick one language. The current placeholder dodges the problem by being text-free.

## 2. Goal

Ship a fast, free, opinionated default OG image generator that turns the project's own data — site name, tagline, brand accent, favicon — into a beautiful sharing image. The downstream user runs one command (or picks "branded template" inside `/brand`) and gets a clean OG image for both locales in under a second, without an API key. The existing AI path stays as the customization escape hatch for users who want art direction.

## 3. Decisions

| #   | Decision                                                                                                                        | Why                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | One render pipeline: Satori (JSX → SVG) + `@resvg/resvg-js` (SVG → PNG).                                                        | Industry standard for OG image generation. Handles font metrics, wrapping, ellipsis. Both deps are small, Node-native, ESM.                                 |
| D2  | Two output files, one per locale: `public/og-default-de.png` and `public/og-default-en.png`.                                    | Site is bilingual; sharing a German tagline on an English page reads wrong. Cost is small (two files, one script run).                                      |
| D3  | One template — "Layout B" (logo + site name lockup at top, tagline as the hero).                                                | Agency/SaaS pattern: the message reads bigger than the brand. Validated visually with the user.                                                             |
| D4  | Always render `public/favicon.svg` into the OG. No "is this the placeholder" detection.                                         | After `/brand` it is the real logo; before, it is the passionfruit fixture — which is fine for the template's shipped state. Avoids fragile fingerprinting. |
| D5  | Inputs auto-discovered from project data: `site.name` + `site.tagline` from i18n JSON, accent color from `global.css` `@theme`. | The data is already there. Nothing for the user to configure in the common case.                                                                            |
| D6  | Output dimensions: 1200 × 630.                                                                                                  | The actual OG spec. Current 1536 × 1024 placeholder is non-standard; platforms downsample.                                                                  |
| D7  | The old `public/og-default.png` is deleted in the same commit.                                                                  | Migration; no runtime trickery.                                                                                                                             |
| D8  | Keep the existing AI generation path (`pnpm generate-image`) untouched.                                                         | User wanted both options available. Different problem, different tool.                                                                                      |

## 4. Architecture

A single Node script orchestrates four pieces:

1. **Discovery layer** — reads `src/i18n/{de,en}.json` for `site.name` and `site.tagline`. Reads `src/styles/global.css` for `--color-accent`. Reads `public/favicon.svg` as a string.
2. **Template layer** — a JSX function `OgTemplate({ name, tagline, accent, logoSvg, lang })` returning the template structure for one locale. Lives next to the script. One file, one template.
3. **Render layer** — calls Satori with the JSX, the loaded Inter Variable font from `node_modules/@fontsource-variable/inter`, and the canvas dimensions. Pipes the SVG into `@resvg/resvg-js` to produce a PNG buffer.
4. **Write layer** — writes the PNG buffer to `public/og-default-{lang}.png`. Creates `public/` if missing.

The script is invoked per locale; the top-level entry decides whether to run once or twice based on `--lang`.

## 5. Files added / changed

Added:

- `scripts/generate-og.ts` — CLI entry point and orchestration.
- `scripts/og-template.tsx` — the JSX template function. Co-located, not in `src/`.
- `scripts/generate-og.test.ts` — node:test smoke tests.

Changed:

- `package.json` — adds `satori`, `@resvg/resvg-js`, `react`-typed JSX support if not already configured for these files; adds the `generate-og` script entry.
- `src/layouts/BaseLayout.astro` — defaults `defaultOgImage` to the locale-specific filename.
- `src/pages/[...path].astro` — BlogPosting JSON-LD uses the locale-specific filename.
- `.claude/skills/brand.md` — Step 2 becomes a three-option fork (Branded template / AI / Skip).
- `CLAUDE.md` — section 12 ("Image generation") gets a new subsection or the commands table gains `pnpm generate-og`.

Removed:

- `public/og-default.png` — replaced by the two locale variants.

## 6. CLI surface

The script accepts:

- No flags → regenerate both locales.
- `--lang <de|en>` → regenerate only the named locale.
- `--help` / `-h` → print usage.

No flags for size, template variant, colors, fonts. Customization is delegated to the existing `pnpm generate-image` path.

## 7. BaseLayout / structured-data wiring

`BaseLayout.astro` currently builds `defaultOgImage` from a hard-coded `/og-default.png`. It changes to interpolate `lang` (already a prop). The `og:image` and `twitter:image` meta tags continue to resolve via `new URL(...)` so the absolute URL machinery is unchanged.

`src/pages/[...path].astro` constructs the BlogPosting JSON-LD image URL by string-concatenating `og-default.png` onto `Astro.site.href`. That moves to the locale-specific filename based on the page's `lang`.

No other call sites reference `/og-default.png`.

## 8. `/brand` skill update

Step 2 of `.claude/skills/brand.md` today asks the user to describe an image and runs `pnpm generate-image`. The new Step 2 first asks how the OG should be created and offers:

1. Branded template (recommended) — runs `pnpm generate-og`.
2. AI generated — runs the existing `pnpm generate-image` flow.
3. Skip.

The verify-integration step continues to confirm the file exists; it's updated to expect the two locale variants when option 1 was picked.

## 9. Edge cases & error handling

Strict failure with clear messages where the user can fix something:

- Missing `site.name` or `site.tagline` in either i18n JSON — exit non-zero, name the missing key and file.
- `public/favicon.svg` missing or unreadable — exit non-zero, suggest running `/brand` or restoring the default.
- Inter Variable WOFF2 missing from `node_modules` — exit non-zero, suggest `pnpm install`.
- Bad `--lang` value — exit non-zero, print accepted values.

Soft failure with warning:

- Cannot parse `--color-accent` from `global.css` — fall back to the original `#6366f1`, print a warning, continue. Styling tweaks shouldn't block image generation.

Out of scope:

- Long-content handling beyond Satori's default wrap/ellipsis. Pathological taglines are a content problem, not a generator problem.
- Runtime deletion of the legacy `og-default.png`. Handled at migration time, not by the script.

## 10. Testing

Add `scripts/generate-og.test.ts` using `node --test` to mirror the existing `scripts/check-bilingual.test.mjs` pattern:

- Default invocation writes both PNGs to a temp output directory.
- `--lang de` writes only the DE file.
- `--lang en` writes only the EN file.
- Output PNGs carry valid PNG magic bytes and decode to 1200 × 630 dimensions (read header, do not compare pixels).
- Missing `site.tagline` (fixture i18n) yields a non-zero exit and a recognizable error string.
- `--lang fr` yields a non-zero exit.

Out of test scope: pixel-perfect comparison, Satori internals, the rendered visual itself — visual sign-off is by eye after the first real run.

## 11. Visual sign-off

The template was validated visually during brainstorming with mock previews at full size and at actual social-thumbnail size. The user picked Layout B. After implementation, a real run against the current Greenleaf fixtures is the final check — the resulting PNGs should look like the approved mockup.

## 12. Out of scope (explicit YAGNI)

- Per-page OG images (every blog post / page gets its own). Worth doing later as a separate feature; this spec is about the single site-level sharing image.
- Multiple built-in templates with a `--template` flag. One opinionated default is the whole point.
- Astro endpoint-based generation (`src/pages/og-default-[lang].png.ts`). Adds build-time cost for an asset that changes rarely.
- Sharp-based hand-crafted SVG without Satori. Saves three megabytes of deps in exchange for hand-computing font metrics. Bad trade.
- Auto-deletion of the legacy `public/og-default.png` at runtime.
