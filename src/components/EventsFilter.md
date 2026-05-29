---
component: EventsFilter
oneLiner: URL-driven filter bar for a pre-fetched events collection slice
status: stable
tags: [filter]
---

## Purpose

Thin wrapper around `CollectionFilter` for the events index page. Derives `category` and `tag` facets with counts from the locale-filtered entries the caller passes in, then delegates rendering to `CollectionFilter`. The caller is responsible for reading the collection once — `EventsFilter` does not call `getCollection` internally.

## When to use

Use on the events index page when you have already read the events collection (for rendering the card list) and want to derive facets from the same slice without a second `getCollection` call.

## When NOT to use

- Do not use on non-events pages — facet keys (`category`, `tag`) and i18n strings (`events.filter.*`) are events-specific.
- Do not use when you need per-facet tone control or a custom reset label — call `CollectionFilter` directly with a manually built `facets` array for full control.
- Do not pass a cross-locale slice of entries; filter to the current locale before passing.

## Props

| Prop       | Type                          | Required | Notes                                                               |
| ---------- | ----------------------------- | -------- | ------------------------------------------------------------------- |
| `entries`  | `CollectionEntry<"events">[]` | yes      | Locale-filtered events; read the collection once in the index page. |
| `lang`     | `Locale`                      | yes      | Drives i18n strings for facet labels.                               |
| `selected` | `Record<string, string[]>`    | yes      | Active filter values keyed by facet key.                            |
| `baseUrl`  | `string`                      | yes      | Pass `Astro.url.pathname`.                                          |

## Example

```astro
---
import { getCollection } from "astro:content";
import EventsFilter from "~/components/EventsFilter.astro";

const allEvents = await getCollection("events", ({ id }) =>
  id.startsWith(`${lang}/`),
);
const selectedCategories = Astro.url.searchParams.getAll("category");
const selectedTags = Astro.url.searchParams.getAll("tag");
const selected = { category: selectedCategories, tag: selectedTags };

// Server-side filtering is the caller's responsibility
const filtered = allEvents.filter((e) => {
  const catOk =
    !selectedCategories.length || selectedCategories.includes(e.data.category);
  const tagOk =
    !selectedTags.length || e.data.tags.some((t) => selectedTags.includes(t));
  return catOk && tagOk;
});
---

<EventsFilter
  entries={allEvents}
  {lang}
  {selected}
  baseUrl={Astro.url.pathname}
/>
```

## i18n keys

| Key                      | DE                  | EN             |
| ------------------------ | ------------------- | -------------- |
| `events.filter.category` | Kategorie           | Category       |
| `events.filter.tag`      | Thema               | Topic          |
| `filter.reset`           | Filter zurücksetzen | Reset filters  |
| `filter.allLabel`        | Alle                | All            |
| `filter.ariaLabel`       | Inhalte filtern     | Filter content |

The `filter.*` keys come from `CollectionFilter`; only `events.filter.*` keys are owned by this wrapper.

## Gotchas

- **Category facet always rendered, even with one value.** Unlike `CaseStudiesFilter`, `EventsFilter` does not suppress the category facet when all entries share the same category. A single-chip "All / Workshop" row will appear — consider guarding in the caller if this looks noisy.
- **Tag facet omitted when no tags exist.** The tag row only renders when `tagCounts.size > 0`. An events collection without any tags will show only the category facet.
- **No `tone` or `class` prop.** The component forwards a bare `<CollectionFilter>` call with no `tone` or `class` pass-through. If you need `tone="on-dark"` or extra classes, call `CollectionFilter` directly.
- **Caller controls filtering.** `EventsFilter` only computes and renders the filter UI. Applying the selected filters to the displayed list is entirely the caller's responsibility.
- **Facet labels are raw data values.** `key` and `label` for each chip are the raw `category`/`tag` strings from the entries — no i18n mapping occurs. Use consistent casing in your event frontmatter.
