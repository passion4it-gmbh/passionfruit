---
component: blog-index
oneLiner: Renders the bilingual blog index with a dark hero and chronological post grid
status: stable
tags: [page]
---

## Purpose

Renders the bilingual blog index page. Queries the `blog` collection for the current locale, sorts posts newest-first, and displays them in a responsive grid of `BlogCard` components below a dark hero.

## When to use

On a site that has the `blog-index` entry in `PAGES` (`src/lib/page-registry.ts`). Invoked by the catch-all route `src/pages/[...path].astro` — do not instantiate directly.

## When NOT to use

For a single post full-page view, use `BlogPost` via the content-collection dynamic route, not this template. For a homepage featured post teaser, embed a `BlogCard` inline rather than using this full page.

## Props

| Prop          | Type     | Required | Default | Notes                                                         |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives collection filtering, i18n strings, and locale prefix. |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link.       |

## Example

Composes:

- `<BaseLayout>` (headerVariant: "on-dark")
- Dark hero section with `site.name` eyebrow, `blog.title` heading, and `blog.description` lead
- `<BlogCard>` repeated for each locale-matching post, or `blog.noPosts` empty-state text

## i18n keys

| Key                | Notes                                       |
| ------------------ | ------------------------------------------- |
| `blog.title`       | Page `<title>`, hero heading, and SEO title |
| `blog.description` | Meta description and hero lead paragraph    |
| `blog.noPosts`     | Empty-state message when no posts exist     |
| `site.name`        | Hero eyebrow label                          |

## Gotchas

- **No `heroImage` support.** Unlike `about` and `services`, this template has no optional hero image — the hero is text-only.
- **No filter bar.** Posts are listed chronologically without tag filtering. If you need tag filtering, wire `CollectionFilter` into the page and rebuild the filtered query server-side — see `CollectionFilter.astro` docs in `src/components/CLAUDE.md`.
- **Bilingual entries required.** Both `de` and `en` blog posts must use the same `translationKey` — the check script enforces this at build time.
- **`currentSlug` has no default.** The catch-all route always supplies it; do not use this page outside that routing context.
