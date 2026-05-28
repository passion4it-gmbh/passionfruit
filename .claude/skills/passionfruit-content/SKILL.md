---
name: passionfruit-content
description: Use when the user wants to add, edit, translate, or remove content (blog posts, team members, pages, navigation, translation strings, or anything inside src/content/, src/i18n/, or src/components/). Loads the bilingual rules, frontmatter shapes, page-registry conventions, and component sidecar rules so edits don't silently break the build.
---

# passionfruit content rules

Project content is **bilingual (DE + EN) by default**. The build refuses to ship monolingual entries. Read this skill before editing anything under `src/content/` or `src/i18n/`.

## Hard rules

1. **Every collection entry exists in both `de/` and `en/`.** Pair them with the same `translationKey` frontmatter value.
2. **Every i18n string lives in both `src/i18n/de.json` and `src/i18n/en.json`.** Same nested key path, different language.
3. **Never commit a single-locale change.** `scripts/check-bilingual.mjs` runs as `prebuild` and exits 1 if pairs are missing.
4. **`translationKey` is ASCII, kebab-case, derived from the English version of the title** — same across both locale files. It is the identifier; the slug (filename) can differ.

## Collections at a glance

| Type     | Path                              | Required frontmatter                                                                                  | Helper command       |
| -------- | --------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------- |
| Blog     | `src/content/blog/{de,en}/*.md`   | `translationKey`, `title`, `description`, `publishedAt`, `author`, `tags`. Optional: `featured`, `heroImage` | `/new-post`          |
| Team     | `src/content/team/{de,en}/*.md`   | `translationKey`, `name`, `role`, `displayOrder`. Optional: `specializations`, `photo`, `socials`     | `/new-team-member`   |
| Pages    | `src/content/pages/{de,en}/*.md`  | `translationKey`, `title`, `description`. Optional: `heroImage`                                       | _(manual)_           |

Image paths in frontmatter are **relative to the markdown file**, not to the project root — e.g. `../../../assets/blog/<slug>.png` from a blog post, or `./_images/hero.jpg` if collocated.

## Adding a new page

A new page is not just a markdown file. Four things must change in lockstep:

1. Markdown entries at `src/content/pages/de/<slug>.md` and `src/content/pages/en/<slug>.md` (with matching `translationKey`).
2. A page component in `src/components/pages/` (Astro). Reuse hero/section helpers — don't re-roll layout.
3. A new entry in the `PAGES` array in `src/lib/page-registry.ts` mapping `PageKey` to `{ de: '<de-slug>', en: '<en-slug>' }`. The catch-all route `src/pages/[...path].astro` reads from this registry.
4. Navigation: add items in `Header.astro` and `Footer.astro` if the page should be linked.

`heroImage` on `about`, `services`, `contact` auto-renders the split-layout hero. `imprint` and `privacy` intentionally ignore it — legal pages stay sober.

## Translation strings (`src/i18n/{de,en}.json`)

- Nested object shape: `{ "section": { "key": "value" } }`.
- Access from components via `useTranslations(locale)` then `t('section.key')`.
- German is the primary market — DE strings must read like a native wrote them, not like a machine translated from English.

## Tag and role conventions

Tag and role labels are per-locale. Use these pairs when possible (custom values must be translated naturally for the other locale):

| DE              | EN              |
| --------------- | --------------- |
| KI              | AI              |
| Webentwicklung  | Web Development |
| Design          | Design          |
| Business        | Business        |
| Tutorial        | Tutorial        |
| Unternehmen     | Company         |

| DE                       | EN                     |
| ------------------------ | ---------------------- |
| Geschäftsführerin        | CEO                    |
| Lead Entwickler          | Lead Developer         |
| Designerin               | Designer               |
| Digitale Transformation  | Digital Transformation |

## Routing recap

URL scheme is **apex-locale**: DE lives at the root (`/`), EN under `/en/`. Localized slugs are paired in `src/lib/page-registry.ts` (`/leistungen` ↔ `/en/services`). If you rename a slug in only one locale, the registry breaks language switching — change both at once.

## Before committing

- Both DE and EN files exist for any new collection entry.
- Both `de.json` and `en.json` updated for any new i18n key.
- `pnpm build` runs locally (it triggers the bilingual check, lint, typecheck, and astro build).
- No hex literals in components — use Tailwind tokens that map to `@theme` values in `src/styles/global.css`.

## Components

Every `.astro` component under `src/components/` has a sidecar `.md` file next to it (same basename). The sidecar is the component's living doc: purpose, props, usage examples, and design rationale.

- **Before editing or composing with a component, read its sidecar first.**
- **When creating a new component, create the sidecar in the same commit.** The prebuild check (`scripts/check-component-sidecars.mjs`) exits 1 if any `.astro` file is missing its pair.
- The canonical sidecar contract and template live in `docs/superpowers/specs/2026-05-28-component-sidecar-docs-design.md` § "Sidecar contract".
- See `src/components/CollectionFilter.md` for a representative sidecar to understand the expected shape.
- **`src/components/CLAUDE.md` is partially auto-generated.** The block between `<!-- catalog:start -->` and `<!-- catalog:end -->` is regenerated on every build and by `pnpm sync:component-catalog`. Never edit inside those markers — changes go in the individual sidecars.

## When you're stuck

- `/new-post` scaffolds a bilingual blog post correctly.
- `/new-team-member` scaffolds a bilingual team entry correctly.
- For pages or i18n changes, do them by hand and re-read this skill before committing.
- See `CONTRIBUTING.md` for the long-form reference; this skill is the short version.
