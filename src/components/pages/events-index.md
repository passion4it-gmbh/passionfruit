---
component: events-index
oneLiner: Renders the bilingual events index with filters and a chronological card grid
status: stable
tags: [page]
---

## Purpose

Renders the bilingual events index page. Queries the `events` collection for the current locale, applies URL-driven `category` and `tag` filters server-side, sorts results chronologically by `startsAt` (soonest first), and displays them in an `EventCard` grid with an `EventsFilter` bar.

## When to use

On a site that has the `events-index` entry in `PAGES` (`src/lib/page-registry.ts`). Invoked by the catch-all route `src/pages/[...path].astro` — do not instantiate directly.

## When NOT to use

For a single event detail view, the catch-all route dispatches to `EventDetail` — do not use this index template for individual events. For a homepage teaser showing upcoming events, embed `EventCard` components inline rather than pulling in this full page.

## Props

| Prop          | Type     | Required | Default | Notes                                                         |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives collection filtering, i18n strings, and locale prefix. |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link.       |

## Example

Composes:

- `<BaseLayout>` (headerVariant: "on-dark")
- Dark hero with `site.name` eyebrow, `events.title` heading, and `events.description` lead
- `<EventsFilter>` receiving the full unfiltered locale slice (`allEvents`), `lang`, `selected`, and `baseUrl`
- `<EventCard>` repeated for each filtered event, sorted soonest-first, or `events.noResults` empty-state text

`EventsFilter` receives the pre-read `allEvents` slice — this page reads the collection once and passes the data down, avoiding a second `getCollection` call inside the filter component.

## i18n keys

| Key                  | Notes                                                |
| -------------------- | ---------------------------------------------------- |
| `events.title`       | Page `<title>`, hero heading, and SEO title          |
| `events.description` | Meta description and hero lead paragraph             |
| `events.noResults`   | Empty-state message when no events match the filters |
| `site.name`          | Hero eyebrow label                                   |

Additional keys consumed by `EventsFilter` and `EventCard` — see `src/components/CLAUDE.md` § Events for the full `events.*` key table.

## Gotchas

- **Sort: chronological by `startsAt` ascending (soonest first).** Unlike `case-studies-index` (newest-first), events sort by upcoming date — past events appear at the bottom when not filtered out.
- **`EventsFilter` receives the full unfiltered slice.** Pass `allEvents` (not `filteredEvents`) to the filter component so it can compute accurate facet counts across all entries, not just the currently visible subset.
- **Filter state lives in the URL.** Category and tag selections are read from `Astro.url.searchParams` at request time. No client JS needed for filtering.
- **No `heroImage` support.** The hero is always text-only.
- **Bilingual entries required.** Both DE and EN entries with matching `translationKey` must exist; `check-bilingual.mjs` enforces this at prebuild.
- **Past events are not automatically hidden.** The template shows all events regardless of `startsAt`. Filter by date in the component if you want to suppress past events.
