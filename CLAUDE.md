# passionfruit

## 1. Project

**This repo is the passionfruit template itself, not a site built from it.** passionfruit is a template that turns Claude Code into a web developer for non-technical users: they describe what they want, Claude builds it.

The "Greenleaf Digital" branding, the blog posts, the team members, the services copy — all of that is **fixture content** that downstream consumers replace via `/onboard` and `/brand`. Treat it as example data, not customer content. When evaluating changes, ask "does this improve the template?", not "does Greenleaf need this?"

## 2. Self-improvement rule

**Claude must keep CLAUDE.md, STYLE_GUIDE.md, and CONTRIBUTING.md in sync with reality.** Update these files when:

- The user establishes a preference ("always use rounded buttons" → add to STYLE_GUIDE.md button section)
- A new content collection is added → document its schema, paths, and workflow in CONTRIBUTING.md
- A recurring issue is fixed → add to the quality checklist so it doesn't happen again
- A new component pattern emerges → document it in STYLE_GUIDE.md
- Routing changes → update the routing section below
- New commands are added → update the commands table

This is not optional. These files are the project's memory. If they drift from reality, future sessions will produce wrong code.

## 3. First-time setup (downstream users only)

**This section is for users who created a repo from the template, not for template maintainers.** If the site still shows "Greenleaf Digital", run `/onboard` to personalize it for your business. After onboarding, run `/brand` to replace the placeholder favicon and social sharing image with your own logo. In the template source repo itself, the Greenleaf fixtures stay — they're the example data shipped to new users.

## 4. Tech stack

| Tool            | Version / notes                                                              |
| --------------- | ---------------------------------------------------------------------------- |
| Astro           | 6, static output                                                             |
| Tailwind        | v4 via `@tailwindcss/vite` (theme in `src/styles/global.css` `@theme` block) |
| TypeScript      | strict — no `any`, ever                                                      |
| Package manager | pnpm                                                                         |
| Icons           | `@lucide/astro` (no emojis)                                                  |
| Consent         | vanilla-cookieconsent                                                        |
| Analytics       | PostHog (EU instance, env-var-gated)                                         |
| Font            | Inter Variable (self-hosted via `@fontsource-variable/inter`)                |
| React           | Dependency present; only use when interactivity genuinely demands it         |

## 5. Bilingual rule

**Hard rule: every page and every collection entry must exist in both DE and EN.**

- Pairing is via `translationKey` frontmatter field — same value across both locale files.
- `scripts/check-bilingual.mjs` runs as `prebuild` and exits 1 if any entry is monolingual.
- Never commit a single-locale entry. Always update both DE and EN in the same commit.

## 6. Content workflows

See CONTRIBUTING.md for full details. Summary:

**Blog post:** `src/content/blog/{de,en}/<slug>.md` — needs translationKey, title, description, publishedAt, author, tags.

**Team member:** `src/content/team/{de,en}/<slug>.md` — needs translationKey, name, role, displayOrder.

**Page:** `src/content/pages/{de,en}/<slug>.md` — needs translationKey, title, description. Also update `src/lib/page-registry.ts`.

**Translations:** Always update both `src/i18n/de.json` and `src/i18n/en.json` in lockstep. Nested key structure, accessed via `t('section.key')`.

## 7. Component conventions

- Prefer Astro components over React.
- Brand tokens via Tailwind utility classes only — no hex literals in components.
- Icons via `@lucide/astro`. No emojis.
- Translation strings via `useTranslations(locale)` from `~/i18n`.
- Images via `<Image>` component from `astro:assets`.
- Always update both i18n JSON files when adding strings.

## 8. Styling

**Read `STYLE_GUIDE.md` before touching any UI.** It is the single source of truth for colors, typography, buttons, cards, layout, and accessibility.

Key rules:

- No hex literals in components — use Tailwind tokens that map to `global.css` `@theme` values
- Buttons use variant (primary / secondary / ghost) x tone (on-light / on-dark)
- One card component per content type (BlogCard, TeamCard)
- 44px minimum touch targets
- `focus-visible` ring on all interactive elements

## 9. Analytics and consent

`vanilla-cookieconsent` dispatches `passionfruit:consent-changed` events. Both analytics providers listen for that event and load on demand once `window.hasAnalyticsConsent()` returns true. Both are env-var-gated and no-op when their key is absent.

**PostHog (EU)** — `PUBLIC_POSTHOG_API_KEY`, `PUBLIC_POSTHOG_HOST` (defaults to `https://eu.i.posthog.com` — ingest endpoint), `PUBLIC_POSTHOG_UI_HOST` (defaults to `https://eu.posthog.com` — dashboard for toolbar/heatmap links).

**Google Analytics 4** — `PUBLIC_GA_MEASUREMENT_ID` (format `G-XXXXXXXXXX`). Uses Consent Mode v2 with `analytics_storage: granted` only after the user accepts; ad cookies stay denied. IP anonymization on.

You can run either, both, or neither. Most users want GA4 (familiar dashboard); PostHog is for those who want session replay, funnels, and feature flags.

**Google Tag Manager** — `PUBLIC_GTM_CONTAINER_ID` (format `GTM-XXXXXXX`). Use this instead of GA4 direct when you need a tag-management layer (e.g. multiple tracking pixels, custom event triggers, A/B testing tools). Loads the GTM container only after analytics consent is granted; uses Consent Mode v2 with `analytics_storage` granted on consent and all ad_* signals permanently denied (passionfruit has no marketing category). GTM, GA4, and PostHog are all independent — each is env-var gated, so any combination works.

## 10. Routing

- URL scheme: **apex-locale** — DE at root (`/`), EN under `/en/`.
- Localized slugs: `/leistungen` (DE) ↔ `/en/services` (EN).
- Single source of truth: `src/lib/page-registry.ts` — `PAGES` array maps `PageKey` to `{ de, en }` slug pairs.
- Catch-all route: `src/pages/[...path].astro`.
- Home pages: `src/pages/index.astro` (DE), `src/pages/en/index.astro` (EN).

## 11. Quality checklist

Before committing:

- [ ] `pnpm build` passes (runs lint, typecheck, bilingual check)
- [ ] Both DE and EN locales render correctly
- [ ] No `any` in TypeScript
- [ ] Mobile layout intact at 375px
- [ ] No hex literals in components
- [ ] New collection entries have `translationKey` in both locales
- [ ] New i18n strings added to both `de.json` and `en.json`
- [ ] Changes align with STYLE_GUIDE.md

## 12. Image generation

Generate images for blog heroes, page backgrounds, and assets using GPT Image models:

```bash
pnpm generate-image "your prompt here" -o src/assets/blog/my-image.png
```

**Requires `OPENAI_API_KEY` in `.env`.** The user must provide their own OpenAI API key. If the key is missing, the script will error with a clear message — prompt the user to add it.

Options: `--size` (1536x1024 for landscapes, 1024x1536 for portraits), `--quality high`, `--background transparent` (png/webp only, not gpt-image-2), `--format` (png/jpeg/webp).

**Prompt guidelines for good results:**

- Be specific about composition, lighting, and mood
- Reference a visual style ("editorial photography", "Kinfolk magazine", "minimal tech aesthetic")
- Specify colors to match brand tokens (accent: #6366f1, dark: #1a1a2e)
- Always end with "No text, no logos" unless text is wanted
- Use `--size 1536x1024` for hero/banner images, `1024x1024` for square thumbnails

## 13. Quality tooling

**Commit hooks** (lefthook): pre-commit runs lint-staged (ESLint, Prettier, cspell on changed files) + bilingual check. Commit-msg runs commitlint (conventional commits: `feat:`, `fix:`, `chore:`, `docs:`).

**Spell checker** (cspell): checks all markdown content in `src/content/`. German + English dictionaries loaded. Add unknown words to `project-words.txt`.

**Link checker** (linkinator): runs against built `dist/` output after `astro build`. Catches broken internal links — pages referenced in nav or content that don't exist. Runs in CI after build.

**Alt text** enforcement: `jsx-a11y/alt-text` is set to `error` (not warn) in the a11y ESLint config. Missing alt text on images blocks the build.

## 14. Deployment

**Default host: Cloudflare Pages** (free, fast, automatic HTTPS). Run `/deploy` to set it up.

**Required GitHub secrets/variables:**

- `CLOUDFLARE_API_TOKEN` (secret) — from Cloudflare dashboard → API Tokens
- `CLOUDFLARE_ACCOUNT_ID` (secret) — from Cloudflare dashboard sidebar
- `CLOUDFLARE_PROJECT_NAME` (variable) — the Cloudflare Pages project name

The deploy job is gated on `CLOUDFLARE_PROJECT_NAME` being set — when unset, the deploy workflow shows as "skipped" instead of failing. This keeps the template green out of the box.

**Site URL:** Update `site` in `astro.config.mjs` after deployment. This affects canonical URLs, sitemap, and OG meta tags.

**Security headers + caching** live in `public/_headers` (Cloudflare Pages auto-picks this up). Includes HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and long-cache rules for `/_astro/*`. HTML pages get `max-age=60, must-revalidate` — short enough that copy edits propagate within a minute, long enough to skip the revalidation round-trip on back/forward navigation. The CSP is scoped to what's actually used (PostHog + GA4); **if you add a new third-party script, iframe, or asset host, update the CSP or it will be blocked silently in the browser console.**

**CSP violation reporting** is opt-in: when `PUBLIC_POSTHOG_API_KEY` is set at build time, `scripts/postbuild-headers.mjs` injects `Reporting-Endpoints` + `report-uri`/`report-to` directives pointing at PostHog's `/report/` ingest. Violations show up in the PostHog dashboard under Reports. The script is a no-op without the key, so forks ship safely with reporting disabled. The reporting URL is tagged `v=1` — bump in the script when materially changing the CSP so historical noise doesn't drown out fresh regressions.

## 15. Git workflow

**Never push directly to `main`.** Every change goes through a pull request, even if it's just you.

**The flow:**

1. Create a branch: `git checkout -b feat/<short-name>`
2. Make changes, commit (commitlint enforces conventional commits: `feat:`, `fix:`, `chore:`, `docs:`)
3. Push: `git push -u origin feat/<short-name>`
4. Open a PR: `gh pr create --fill` (or via GitHub UI)
5. Wait for CI to pass and Cloudflare to deploy a preview — the preview URL is auto-commented on the PR
6. Review the live preview (visit the URL from the PR comment)
7. **Squash merge** when approved — this keeps `main` history linear and readable
8. Push to `main` automatically triggers a production deploy

**Why squash merge:** WIP commits ("fix typo", "address review") shouldn't pollute `main`. One PR = one logical change = one commit. The PR description becomes the commit message.

**Repo settings to enable on GitHub:**

- Settings → General → Pull Requests:
  - ✅ Allow squash merging — default to "Pull request title and description"
  - ❌ Allow merge commits
  - ❌ Allow rebase merging
  - ✅ Automatically delete head branches
- Settings → Branches → Add branch protection rule for `main`:
  - ✅ Require a pull request before merging
  - ✅ Require status checks to pass (CI workflow)
  - ✅ Require linear history

**Preview deployments:** Every PR gets a unique preview URL like `https://<branch-name>.<project>.pages.dev`. Updates on every push to the branch. The bot comment on the PR is updated in place — no spam.

## 16. Commands

| Command               | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `pnpm dev`            | Local dev server                                         |
| `pnpm build`          | Production build (sync + lint + typecheck + astro build) |
| `pnpm preview`        | Preview built output                                     |
| `pnpm typecheck`      | `astro check` + `tsc --noEmit`                           |
| `pnpm lint`           | ESLint + Prettier with autofix                           |
| `pnpm lint:a11y`      | Accessibility lint (alt-text = error, rest = warn)       |
| `pnpm test`           | Bilingual check unit tests                               |
| `pnpm check:spelling` | Spell check content markdown (DE + EN)                   |
| `pnpm check:links`    | Broken link check on built output                        |
| `pnpm check:all`      | Spelling + a11y + build + link check (full CI locally)   |
| `pnpm generate-image` | Generate images via GPT Image (needs `OPENAI_API_KEY`)   |
| `/brand`              | Replace placeholder favicon and OG image with your own   |
| `/deploy`             | Interactive Cloudflare Pages deployment setup            |
| `/new-post`           | Scaffold a bilingual blog post (DE + EN)                 |
| `/new-team-member`    | Scaffold a bilingual team member entry (DE + EN)         |
