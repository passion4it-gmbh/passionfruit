---
component: careers-index
oneLiner: Renders the bilingual careers index with a dark hero and a job listings grid
status: stable
tags: [page]
---

## Purpose

Renders the bilingual careers (job listings) index page. Queries the `careers` collection for the current locale, sorts jobs by `postedAt` descending (newest first), and displays them in a `CareerCard` grid below a dark hero. Shows an empty-state message when no openings exist.

## When to use

On a site that has the `careers-index` entry in `PAGES` (`src/lib/page-registry.ts`). Invoked by the catch-all route `src/pages/[...path].astro` — do not instantiate directly.

## When NOT to use

For a single job posting detail view, the catch-all route dispatches to `CareerPost` via `props.collection === "careers"` — do not use this index template for individual postings. For a teaser "We're hiring" blurb on the home page, use a `<Button>` linking here rather than embedding the template.

## Props

| Prop          | Type     | Required | Default | Notes                                                         |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives collection filtering, i18n strings, and locale prefix. |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link.       |

## Example

Composes:

- `<BaseLayout>` (headerVariant: "on-dark")
- Dark hero with `site.name` eyebrow, `careers.title` heading, and `careers.description` lead
- Job listings section (dark surface): `<CareerCard>` repeated for each locale-matching job, or `careers.noOpenings` empty-state text

## i18n keys

| Key                   | Notes                                            |
| --------------------- | ------------------------------------------------ |
| `careers.title`       | Page `<title>`, hero heading, and SEO title      |
| `careers.description` | Meta description and hero lead paragraph         |
| `careers.noOpenings`  | Empty-state message when the collection is empty |
| `site.name`           | Hero eyebrow label                               |

## Gotchas

- **No filter bar.** Jobs are listed by recency only — no tag or department filtering. Add `CollectionFilter` and rebuild the query server-side if filtering is needed.
- **No `heroImage` support.** The careers hero is always text-only.
- **Job listings section uses `bg-surface-dark`.** The grid renders on the dark surface without a white-section break — this differs from `blog-index` and `team` which use the default light background for their grids. The empty-state text also differs: `text-text-on-dark/50` instead of `text-muted`.
- **Bilingual job entries required.** Both DE and EN entries with matching `translationKey` must exist; `check-bilingual.mjs` enforces this at prebuild.
- **`CareerPost` handles detail routing.** This index only lists cards; do not add per-entry anchors or modal overlays here — the catch-all route renders the full detail view.
- **`postedAt` is the sort key.** Jobs with the same `postedAt` timestamp have undefined relative order — keep timestamps unique.
