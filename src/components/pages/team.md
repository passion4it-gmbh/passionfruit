---
component: team
oneLiner: Renders the bilingual team page with a dark hero and a full member grid
status: stable
tags: [page]
---

## Purpose

Renders the bilingual team page. Queries the `team` collection for the current locale, sorts members by `displayOrder`, and displays them in a responsive `TeamCard` grid below a dark hero.

## When to use

On a site that has the `team` entry in `PAGES` (`src/lib/page-registry.ts`). Invoked by the catch-all route `src/pages/[...path].astro` — do not instantiate directly.

## When NOT to use

For a compact team preview embedded in another page (e.g. the About page), render a subset of `TeamCard` entries inline rather than using this full page template. For a single member detail view, there is no dedicated detail page in the template — embed bio content in the `TeamCard` directly or add a collection route.

## Props

| Prop          | Type     | Required | Default | Notes                                                     |
| ------------- | -------- | -------- | ------- | --------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives collection filtering, i18n strings, locale prefix. |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link.   |

## Example

Composes:

- `<BaseLayout>` (headerVariant: "on-dark")
- Dark hero with `site.name` eyebrow, `team.title` heading, and `team.description` lead
- `<TeamCard>` repeated for each locale-matching member, sorted by `displayOrder` ascending

## i18n keys

| Key                | Notes                                       |
| ------------------ | ------------------------------------------- |
| `team.title`       | Page `<title>`, hero heading, and SEO title |
| `team.description` | Meta description and hero lead paragraph    |
| `site.name`        | Hero eyebrow label                          |

## Gotchas

- **No `heroImage` support.** Unlike `about` and `services`, the team page hero is always text-only — no optional image column.
- **`displayOrder` controls member sequence.** Members without a `displayOrder` value sort to the end; duplicates in order produce undefined relative ordering. Keep `displayOrder` unique and gapless for predictable layout.
- **Team is queried at build time.** Changes to team entries require a rebuild.
- **No alternate slug wired.** Unlike other pages, `team` does not call `getAlternateCollectionSlug` — the hreflang alternate link is omitted. Add it if bilingual navigation is required.
- **Bilingual team entries required.** Both DE and EN entries with matching `translationKey` values must exist per the bilingual rule; `check-bilingual.mjs` enforces this at prebuild.
