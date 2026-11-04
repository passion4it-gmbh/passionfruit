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
node --version    # Must be >= 22.23.4
pnpm --version    # Must be installed
git --version     # Must be installed
echo "$CLAUDE_CODE_REMOTE"    # "true" in a claude.ai/code cloud session
```

**In a cloud session (`CLAUDE_CODE_REMOTE=true`), never ask the user to install anything.** They have no terminal and no machine to install on. Node, pnpm and git come preinstalled. If Node is older than 22.23.4, download a current build from nodejs.org into `~/.local/node` and put its `bin` directory first on `PATH` for every later command, then continue.

The rest of this section is for local sessions.

**If Node.js is missing or too old (< 22.23.4):**

> "You need a newer Node.js. The easiest way to install it:
>
> **Mac:** `brew install node` or download from https://nodejs.org
> **Windows:** Download from https://nodejs.org
> **Linux:** `curl -fsSL https://deb.nodesource.com/setup_26.x | sudo -E bash - && sudo apt-get install -y nodejs`
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
ls node_modules/.modules.yaml 2>/dev/null || pnpm install
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
4. After setup, offer to rebuild the existing content:

> "The template is now configured for your business. I can rebuild your existing site page by page — just tell me to go ahead, and I'll work through [existing-url], extract each page's content, and recreate it here with a modern design, better performance, and bilingual support. The result will be feature-identical but visually superior."

Then, if the user agrees, work through the pages systematically until the new site matches the old one — just better.

## Questions (for fresh start)

Ask these ONE AT A TIME using the AskUserQuestion tool:

1. "What's your company or project name?"
2. "What do you do?" (one sentence — becomes meta description + hero tagline)
3. "What's your primary language?" (German at root, or English at root?)
4. "Do you need a second language?" If no: remove /en/ pages, strip i18n JSON to single locale, disable bilingual check, simplify page-registry to single-slug entries. If yes: ask which locale and configure accordingly.
5. "Pick an accent color" — offer the presets below or let them describe their brand colors. All four are readable as white-on-accent and as accent-on-white:

   | Preset  | `--color-accent` | `--color-accent-hover` | `--color-accent-glow` |
   | ------- | ---------------- | ---------------------- | --------------------- |
   | Indigo  | `#6265f0`        | `#4f46e5`              | `#818cf8`             |
   | Emerald | `#047857`        | `#065f46`              | `#10b981`             |
   | Amber   | `#b45309`        | `#92400e`              | `#f59e0b`             |
   | Rose    | `#e11d48`        | `#be123c`              | `#fb7185`             |

6. "Which pages and sections do you need?" — multi-select: Home, About, Services, Blog, Team, Contact, Privacy, Imprint, Careers, Case Studies, Events
7. "Contact details?" — email, phone, address for footer, contact page, and legal pages
8. "Details for your imprint?" (German sites need these) — legal form, who is legally responsible for the content, VAT ID, and commercial register court + number if registered
9. "Social media links?" — LinkedIn, Instagram, X/Twitter, etc.

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

### Set the brand identity (one source of truth)

Brand name, URL, and logo are **derived from config + i18n** — never hardcoded in component or library code. Change them in these few places and they propagate everywhere (header, footer, page titles, JSON-LD, sitemap):

- `src/i18n/de.json` and `src/i18n/en.json` — `site.name`, `site.tagline`, `site.description`, `footer.copyright`, plus any navigation labels
- `astro.config.mjs` — the `site` URL (drives canonical URLs, sitemap, OG tags, JSON-LD)
- `src/styles/global.css` — accent tokens `--color-accent`, `--color-accent-hover`, `--color-accent-glow`. `pnpm build` fails if the accent is under 4.5:1 on white. For a custom color, set it and run `node scripts/check-accent-contrast.mjs`: if it fails, use the shade it prints as `--color-accent`, keep the original as `--color-accent-glow`, and tell the user why.
- `src/layouts/BaseLayout.astro` — the `theme-color` meta tag, set to the accent

Apart from that meta tag, do **not** edit `structured-data.ts`, `BaseLayout.astro`, `Header.astro`, or `Footer.astro` for branding — they read `site.name` and `Astro.site` already. The `pnpm build` fixture check fails if a brand literal is ever reintroduced into code.

### Rewrite the fixture content

The template ships example content branded "Greenleaf Digital". Rewrite or remove it for every collection the user keeps, in **both** `de/` and `en/`:

- `src/content/blog/` — example posts
- `src/content/team/` — example team members
- `src/content/pages/` — about / services / privacy / imprint copy (put the real company name, address and Q8 details in the legal pages, list only the services the site really uses in the privacy policy, and tell the user a lawyer or legal generator should check both)
- `src/content/careers/` — example job postings (delete the collection if no Careers section)
- `src/content/caseStudies/` — example case studies (delete if not used)
- `src/content/events/` — example events (delete if not used)
- `src/data/testimonials.ts` — example testimonial `quote` / `author` / `company` values (rewrite, or empty the arrays)

### Remove unused pages and collections

For anything the user did NOT pick in Q6:

- `src/components/pages/` — delete the page component
- `PAGES` array in `src/lib/page-registry.ts` — delete the entry
- Navigation items in `Header.astro` and `Footer.astro`
- The collection's entries under `src/content/<name>/`

Also delete `src/pages/design-floor/` — it's a dev-only design showcase, not part of any shipped site.

### Update the docs

- Rewrite CLAUDE.md section 1 with the real company context (name, what they do, which pages/collections exist)
- Update STYLE_GUIDE.md with the chosen colors
- `README.md` — replace upstream marketing content (banner, "What You Get", "Why Not WordPress", "Tech Stack") with a short, business-specific README. **Keep** the "Staying Current" section verbatim — it tells the owner how to pull in passionfruit improvements over time.

### Regenerate the social sharing image

The shipped images say "Greenleaf Digital". Replace them now, no API key needed:

```bash
pnpm generate-og
```

### Verify nothing was missed

```bash
git grep --untracked -inE 'greenleaf|musterstra|musterstadt|hello@example\.com|\+49 123 456 789|DE123456789|platzhalter|is a placeholder' -- src/content src/i18n src/data   # expect: no matches
pnpm build   # runs the fixture, accent and bilingual gates
```

If the search finds anything, rewrite it before committing.

## Final step

Stage and commit everything:

```
git add -A
git commit -m "feat: initial setup — [Company Name] website"
```

In a cloud session, also push: `git push -u origin HEAD`.

Then tell the user what they can actually do on their surface.

**Local session:** start `pnpm dev` in the background yourself, then say:

> "Your website is ready! Open http://localhost:4321 to see it."

**Cloud session:** localhost isn't reachable from the user's browser, so don't mention it or any terminal command. Say:

> "Your website is set up, and the changes are saved to your GitHub repo. You can't preview it from here yet: the first way to see it is to put it online, so that's the next step."

In both cases, continue with:

> **What you can do next:**
>
> - **Run `/deploy`** to put your site online (free Cloudflare Pages hosting). I'll walk you through each step
> - **Run `/brand`** to replace the placeholder favicon with your own logo
> - Tell me to change the design, add content, or modify any page
