---
name: onboard
description: Personalize a fresh passionfruit template or migrate an existing website. Asks for company info, colors, pages, and configures everything.
---

# Onboarding

This skill personalizes a fresh passionfruit template for a new website, or migrates an existing website into the template.

## When to trigger

- User explicitly runs `/onboard`
- Claude detects "Greenleaf Digital" placeholder text still present in the codebase

## Prerequisites check

Before anything else, verify the user's environment. Run these checks silently:

```bash
node --version    # Must be >= 24.0.0
pnpm --version    # Must be installed
git --version     # Must be installed
```

**If Node.js is missing or too old (< 24):**

> "You need Node.js 24 or newer. The easiest way to install it:
>
> **Mac:** `brew install node` or download from https://nodejs.org
> **Windows:** Download from https://nodejs.org
> **Linux:** `curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt-get install -y nodejs`
>
> After installing, restart your terminal and come back."

**If pnpm is missing:**

> "You need pnpm (our package manager). Install it with:
>
> `npm install -g pnpm`
>
> Or: `corepack enable && corepack prepare pnpm@latest --activate`"

**If git is missing:**

> "You need git for version control. Install it:
>
> **Mac:** `xcode-select --install`
> **Windows:** Download from https://git-scm.com
> **Linux:** `sudo apt-get install git`"

**If all prerequisites are met:** proceed silently to Step 0. Don't tell the user "everything looks good" — just move on.

Also verify that dependencies are installed:

```bash
ls node_modules/.package-lock.json 2>/dev/null || pnpm install
```

If `node_modules` doesn't exist, run `pnpm install` automatically before proceeding.

## Step 0: New site or migration?

Ask the user:

> "Are you starting fresh, or migrating an existing website?"

**Option A: Fresh start** — proceed to the questions below.

**Option B: Migrate existing site** — ask the user for the URL of their existing website. Then:

1. Crawl the site (or ask the user to describe the pages)
2. Identify: company name, tagline, pages, colors, content structure
3. Run through the same personalization steps below, pre-filling answers from the existing site
4. After setup, tell the user:

> "The template is now configured for your business. To rebuild your existing site's content and design, use `/goal` with this instruction:
>
> **Goal:** Rebuild [existing-url] as a passionfruit site. Every page, every piece of content, every feature — but with a modern design, better performance, and bilingual support. Use the existing site as the reference. Visit each page, extract the content, and recreate it here. The result should be feature-identical but visually superior."
>
> This will systematically work through every page until your new site matches the old one — just better.

## Questions (for fresh start)

Ask these ONE AT A TIME using the AskUserQuestion tool:

1. "What's your company or project name?"
2. "What do you do?" (one sentence — becomes meta description + hero tagline)
3. "What's your primary language?" (German at root, or English at root?)
4. "Do you need a second language?" If no: remove /en/ pages, strip i18n JSON to single locale, disable bilingual check, simplify page-registry to single-slug entries. If yes: ask which locale and configure accordingly.
5. "Pick an accent color" — offer 4 presets (indigo #6366f1, emerald #10b981, amber #f59e0b, rose #f43f5e) or let them describe their brand colors
6. "Which pages do you need?" — multi-select: Home, About, Services, Blog, Team, Contact, Privacy, Imprint
7. "Contact details?" — email, phone, address for footer, contact page, and legal pages
8. "Social media links?" — LinkedIn, Instagram, X/Twitter, etc.

## After answers

**Strip framework metadata (safety net — the template-cleanup workflow normally handles this on first push):**

```bash
rm -f release-please-config.json
rm -f .release-please-manifest.json
rm -f .github/workflows/release.yml
rm -f .github/workflows/template-cleanup.yml
rm -f CHANGELOG.md
```

These files only apply to the passionfruit template itself. Derived projects don't release passionfruit-framework versions.

Replace all "Greenleaf Digital" references with the company name across:

- `src/i18n/de.json` and `src/i18n/en.json` (site.name, site.tagline, site.description, footer.copyright)
- `src/lib/structured-data.ts` (ORGANIZATION_LD name)
- `src/layouts/BaseLayout.astro` (title suffix)
- `README.md` — replace the upstream marketing content (banner, "What You Get", "Why Not WordPress", "Built With") with a short, business-specific README. **Keep** the "Staying Current" section verbatim — it tells the site owner how to pull in passionfruit improvements over time.

Update `astro.config.mjs` site URL if provided.

Update `global.css` accent color tokens (--color-accent, --color-accent-hover, --color-accent-glow).

Remove unused pages from:

- `src/components/pages/` directory
- `PAGES` array in `src/lib/page-registry.ts`
- Navigation items in Header.astro and Footer.astro
- Content collection entries that belong to removed pages

Update legal pages (privacy, imprint) with actual company info and address.

Rewrite CLAUDE.md section 1 with actual company context (name, what they do, which pages exist).

Update STYLE_GUIDE.md with chosen colors.

Update i18n JSON files with company name, tagline, and adjusted navigation labels.

## Final step

Stage and commit everything:

```
git add -A
git commit -m "feat: initial setup — [Company Name] website"
```

Then tell the user:

> "Your website is ready! Run `pnpm dev` to see it at http://localhost:4321.
>
> **One more thing** — the favicon and social preview image are still placeholders. Run `/brand` to set up your own logo and social sharing image.
>
> **What you can do next:**
>
> - **Run `/brand`** to replace the placeholder favicon and social sharing image with your own
> - Tell me to change the design, add content, or modify any page
> - Run `pnpm build` to create a production build
> - **Run `/deploy` to put your site online** (free Cloudflare Pages hosting, takes 5 minutes)"
