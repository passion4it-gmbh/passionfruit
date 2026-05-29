---
component: case-studies-index
oneLiner: Bilingual case studies index with category/tag filters; sorted newest first
status: stable
tags: [page]
---

## Purpose

Renders the bilingual case studies index page. Queries the `caseStudies` collection for the current locale, applies URL-driven `category` and `tag` filters server-side, sorts results newest-first, and displays them in a `CaseStudyCard` grid with a `CaseStudiesFilter` bar above.

## When to use

On a site that has the `case-studies-index` entry in `PAGES` (`src/lib/page-registry.ts`). Invoked by the catch-all route `src/pages/[...path].astro` — do not instantiate directly.

## When NOT to use

For a single case study detail view, the catch-all route dispatches to `CaseStudyDetail` — do not use this index template for individual entries. For a homepage teaser showing one or two highlighted case studies, embed `CaseStudyCard` components inline rather than pulling in this full page.

## Props

| Prop          | Type     | Required | Default | Notes                                                         |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives collection filtering, i18n strings, and locale prefix. |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link.       |

## Example

Composes:

- `<BaseLayout>` (headerVariant: "on-dark")
- Dark hero with `site.name` eyebrow, `caseStudies.title` heading, and `caseStudies.description` lead
- `<CaseStudiesFilter>` receiving `lang`, `baseUrl`, and `selected` (built from URL search params)
- `<CaseStudyCard>` repeated for each filtered locale-matching entry, or `caseStudies.noResults` empty-state text

Filtering is performed server-side: `category` and `tag` values from `Astro.url.searchParams` are applied before rendering. No client JS is required for core filtering.

## i18n keys

| Key                       | Notes                                                 |
| ------------------------- | ----------------------------------------------------- |
| `caseStudies.title`       | Page `<title>`, hero heading, and SEO title           |
| `caseStudies.description` | Meta description and hero lead paragraph              |
| `caseStudies.noResults`   | Empty-state message when no entries match the filters |
| `site.name`               | Hero eyebrow label                                    |

Additional keys consumed by `CaseStudiesFilter` and `CaseStudyCard` — see their respective sidecars.

## Gotchas

- **Filter state lives in the URL.** Active filters are read from `Astro.url.searchParams`. Deep-linking and browser back/forward work without JS. Clearing filters reloads the page without params.
- **No `heroImage` support.** The hero is always text-only.
- **Sort: newest-first by `publishedAt`, then alphabetical by id.** Entries without `publishedAt` sort to the bottom (treated as epoch 0).
- **`CaseStudiesFilter` self-suppresses** when all entries share the same category — single-value facets are noise. Do not force-show the filter bar.
- **Bilingual entries required.** Both DE and EN entries with matching `translationKey` must exist; `check-bilingual.mjs` enforces this.
- **`case-studies-index` page key must exist in `page-registry.ts`** for `CaseStudyCard` link generation to work. The card's href is built from `findPageByKey("case-studies-index")` + the entry slug.
