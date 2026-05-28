# Contributing

Content workflows for the passionfruit template. All content is bilingual (DE + EN) unless a single-locale setup was chosen during `/onboard`.

---

## Recommended Claude Code plugins

The template's `.claude/settings.json` **enables** four plugins from the default `claude-plugins-official` marketplace, but Claude Code does not auto-install them. If you see "plugin not found" warnings on first run, install them once with:

```bash
/plugin install frontend-design@claude-plugins-official
/plugin install code-review@claude-plugins-official
/plugin install claude-md-management@claude-plugins-official
/plugin install playwright-skill@claude-plugins-official
```

| Plugin                 | What it gives you                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `frontend-design`      | Production-grade frontend design system guidance (used by `/onboard` and styling work) |
| `code-review`          | Multi-agent PR review with confidence scoring — run before squash-merging              |
| `claude-md-management` | Audit and improve CLAUDE.md across the repo as it grows                                |
| `playwright-skill`     | Browser automation for visual verification of UI changes                               |

Process-discipline plugins like `superpowers` are deliberately not enabled at project level — they're overkill for non-technical users editing content. If you maintain the template and want them, enable them in your user-level `~/.claude/settings.json`.

The project skills (`passionfruit-content`, `/onboard`, `/brand`, `/deploy`, `/new-post`, `/new-team-member`) ship in `.claude/skills/` and load automatically — no install needed.

### Bootstrapping from the plugin marketplace

For users who installed the passionfruit plugin without cloning the template first, `/create-passionfruit-site` does the equivalent of `pnpm create passionfruit my-site`: clones the template into a new directory, initializes git, runs `pnpm install`, and hands off to `/onboard`. This is the plugin-marketplace-first install path.

### Astro Docs MCP (recommended)

Add the first-party Astro Docs MCP for current Astro 6 docs without web search:

```bash
claude mcp add --transport http astro https://mcp.docs.astro.build/mcp
```

This is a project- or user-level config (your choice). It makes the difference between Claude guessing at Astro APIs and Claude reading them.

---

## Blog Posts

**Path:** `src/content/blog/{de,en}/<slug>.md`

**Frontmatter:**

```yaml
---
translationKey: my-post # Same value in both locale files
title: "Post title"
description: "Short description for meta tags and cards"
publishedAt: 2026-01-15
author: "Author Name"
tags: ["tag1", "tag2"]
featured: false # Optional, default false
heroImage: "./_images/hero.jpg" # Optional, relative to file
---
```

Always create both `de/<slug>.md` and `en/<slug>.md` with matching `translationKey`.

---

## Team Members

**Path:** `src/content/team/{de,en}/<slug>.md`

**Frontmatter:**

```yaml
---
translationKey: jane-doe
name: "Jane Doe"
role: "Lead Designer"
displayOrder: 1 # Lower = appears first
specializations: ["UX", "Brand"] # Optional, default []
photo: "./_images/jane.jpg" # Optional
socials: # Optional
  linkedin: "https://linkedin.com/in/janedoe"
  github: "https://github.com/janedoe"
  website: "https://janedoe.com"
---
```

---

## Pages

**Path:** `src/content/pages/{de,en}/<slug>.md`

**Frontmatter:**

```yaml
---
translationKey: about
title: "About Us"
description: "Learn more about our team and mission"
heroImage: "./_images/about-hero.jpg" # Optional
---
```

When `heroImage` is set, the matching static page component (`about.astro`, `services.astro`, `contact.astro`) automatically renders it as a split-layout hero — text on the left, optimized `<Image>` on the right. Drop the field to fall back to the single-column hero. `imprint.astro` and `privacy.astro` are legal pages and intentionally ignore `heroImage` — adding a glamour shot to a privacy policy is tasteless. New page components can opt in by looking up the entry: `(await getCollection('pages')).find(p => p.id.startsWith(\`${lang}/\`) && p.data.translationKey === '<key>')?.data.heroImage`.

After creating a new page, also:

1. Add a component in `src/components/pages/`
2. Add an entry to the `PAGES` array in `src/lib/page-registry.ts` with `{ de, en }` slugs
3. Add navigation items in Header and Footer if needed

---

## Careers (Job Postings)

**Path:** `src/content/careers/{de,en}/<slug>.md`

**Important:** The template uses a plain markdown `glob` loader — there is no Personio or other HR-platform dependency. Downstream users can add job postings directly as markdown files without any external service or API key.

**Frontmatter:**

```yaml
---
translationKey: senior-frontend-developer # Same value in both locale files
title: "Senior Frontend Developer"
location: "Berlin, Germany (Hybrid)"
department: "Engineering" # Optional
employmentType: "full-time" # full-time | part-time | contractor | internship
seniority: "Senior" # Optional
applyUrl: "https://your-ats.example.com/apply/job-id"
summary: "One-paragraph summary shown on the card and at the top of the detail page."
postedAt: 2026-05-01
closesAt: 2026-07-31 # Optional — application deadline
salaryMin: 75000 # Optional — Schema.org baseSalary
salaryMax: 95000 # Optional
salaryCurrency: "EUR" # Default EUR
tags: ["TypeScript", "React"] # Optional, default []
---
```

The **body** of the markdown file is the long-form job description, rendered as prose on the detail page. Use standard markdown headings and bullet lists.

Always create both `de/<slug>.md` and `en/<slug>.md` with a matching `translationKey`.

**Routing:**

- Index: `/karriere/` (DE) and `/en/careers/` (EN)
- Detail: `/karriere/<slug>/` (DE) and `/en/careers/<slug>/` (EN)

**Structured data:** Each detail page automatically emits a Schema.org `JobPosting` JSON-LD block via `buildJobPostingLd` in `src/lib/structured-data.ts`. `employmentType` is mapped to Schema.org values (`FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `INTERN`).

---

## Events

**Path:** `src/content/events/{de,en}/<slug>.md`

**Frontmatter:**

```yaml
---
translationKey: my-event        # Same value in both locale files
title: "Event title"
summary: "Short description shown on cards and as meta description"
startsAt: 2026-09-10T10:00:00
endsAt: 2026-09-10T11:30:00    # Optional
category: "Webinar"             # Open string — name your own categories
tags: ["AI", "SME"]             # Optional, open string array for filtering
location:
  kind: "online"                # "online" | "in-person" | "hybrid"
  venue: "Event Hall"           # Optional — for in-person/hybrid
  city: "Berlin"                # Optional — for in-person/hybrid
  url: "https://example.com"    # Optional — map or stream link
registrationUrl: "https://example.com/register/my-event"  # Optional
heroImage: "./_images/event-hero.jpg"  # Optional
speakers:                       # Optional — references team collection entries
  - de/jane-doe
---
```

Always create both `de/<slug>.md` and `en/<slug>.md` with matching `translationKey`. The bilingual check runs as `prebuild` and exits 1 if any entry is unpaired.

**Routing:**

- DE detail: `/veranstaltungen/<slug>/`
- EN detail: `/en/events/<slug>/`
- Index pages are static pages registered in `src/lib/page-registry.ts` under key `events-index`.

**Adding a new event:**

1. Create `src/content/events/de/<slug>.md` and `src/content/events/en/<slug>.md`
2. Both files must share a `translationKey`
3. Add any new i18n strings to `src/i18n/de.json` and `src/i18n/en.json`
4. Run `pnpm build` — bilingual check, typecheck, and build must pass

---

## Translations (i18n)

**Files:** `src/i18n/de.json` and `src/i18n/en.json`

- Nested key structure: `{ "section": { "key": "value" } }`
- Access via `t('section.key')` from `useTranslations(locale)`
- Always update both files in the same commit
- German is primary market — ensure DE translations are polished, not just machine-translated

---

## Quality Checklist

Before committing:

- [ ] `pnpm build` passes (runs lint, typecheck, bilingual check)
- [ ] Both DE and EN locales render correctly
- [ ] No `any` in TypeScript
- [ ] Mobile layout intact at 375px
- [ ] No hex literals in components (use Tailwind tokens)
- [ ] New collection entries have `translationKey` in both locales
- [ ] New i18n strings added to both `de.json` and `en.json`
- [ ] Changes align with STYLE_GUIDE.md
