# Contributing

Content workflows for the passionfruit template. All content is bilingual (DE + EN) unless a single-locale setup was chosen during `/onboard`.

---

## Recommended Claude Code plugins

The template's `.claude/settings.json` **enables** four plugins from the default `claude-plugins-official` marketplace, but Claude Code does not auto-install them. If you see "plugin not found" warnings on first run, install them once with:

```bash
/plugin install superpowers@claude-plugins-official
/plugin install playwright-skill@claude-plugins-official
/plugin install claude-md-management@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
```

| Plugin                 | What it gives you                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `superpowers`          | Process skills: brainstorming, TDD, debugging, plan execution, verification — the workhorse |
| `playwright-skill`     | Browser automation for visual verification of UI changes                                    |
| `claude-md-management` | Audit and improve CLAUDE.md across the repo as it grows                                     |
| `frontend-design`      | Production-grade frontend design system guidance (used by `/onboard`)                       |

The project skills (`/onboard`, `/brand`, `/deploy`, `/new-post`, `/new-team-member`) ship in `.claude/skills/` and load automatically — no install needed.

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
