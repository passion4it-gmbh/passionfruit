---
component: CaseStudiesFilter
oneLiner: URL-driven filter bar for the case studies collection
status: stable
tags: [filter]
---

## Purpose

Thin wrapper around `CollectionFilter` for the case studies index page. Reads the `caseStudies` collection internally, derives `category` and `tag` facets with counts, and delegates rendering to `CollectionFilter`. Renders nothing when no facets are available.

## When to use

Drop into any case studies index page in place of wiring `CollectionFilter` by hand. The component owns the `getCollection` call so the parent page stays lean.

## When NOT to use

- Do not use on non-case-studies pages — the collection name and facet keys (`category`, `tag`) are hardcoded.
- Do not use when you need to pre-filter the collection in the parent page before facet derivation (e.g., showing only entries from the current year). In that case call `CollectionFilter` directly with a manually built `facets` array.
- Do not use when you need the `entries` slice for other purposes and want to avoid a second `getCollection` call — `EventsFilter` demonstrates the pattern of receiving entries from the caller instead.

## Props

| Prop       | Type                       | Required | Default      | Notes                                                                                |
| ---------- | -------------------------- | -------- | ------------ | ------------------------------------------------------------------------------------ |
| `lang`     | `Locale`                   | yes      | —            | Filters the collection to the current locale and drives i18n facet labels.           |
| `baseUrl`  | `string`                   | yes      | —            | Pass `Astro.url.pathname`.                                                           |
| `selected` | `Record<string, string[]>` | yes      | —            | Keys: `"category"`, `"tag"`. Build from `Astro.url.searchParams`.                    |
| `tone`     | `"on-light" \| "on-dark"`  | no       | `"on-light"` | Pass `"on-dark"` when embedding in a dark-surface section (inverts idle chip style). |
| `class`    | `string`                   | no       | `""`         | Extra classes forwarded to the root `<nav>`.                                         |

## Example

```astro
---
import { getCollection } from "astro:content";
import CaseStudiesFilter from "~/components/CaseStudiesFilter.astro";

const selectedCategories = Astro.url.searchParams.getAll("category");
const selectedTags = Astro.url.searchParams.getAll("tag");
const selected = { category: selectedCategories, tag: selectedTags };

// Server-side filtering is the caller's responsibility
const allEntries = await getCollection("caseStudies", (e) =>
  e.id.startsWith(`${lang}/`),
);
const filtered = allEntries.filter((e) => {
  const catOk =
    !selectedCategories.length || selectedCategories.includes(e.data.category);
  const tagOk =
    !selectedTags.length || e.data.tags.some((t) => selectedTags.includes(t));
  return catOk && tagOk;
});
---

<CaseStudiesFilter {lang} baseUrl={Astro.url.pathname} {selected} />
```

## i18n keys

| Key                          | DE                  | EN             |
| ---------------------------- | ------------------- | -------------- |
| `caseStudies.filterCategory` | Kategorie           | Category       |
| `caseStudies.filterTag`      | Thema               | Topic          |
| `filter.reset`               | Filter zurücksetzen | Reset filters  |
| `filter.allLabel`            | Alle                | All            |
| `filter.ariaLabel`           | Inhalte filtern     | Filter content |

The `filter.*` keys come from `CollectionFilter`; only the `caseStudies.filter*` keys are owned by this wrapper.

## Gotchas

- **Category facet is suppressed when homogeneous.** When all entries share the same `category` value (`categoryCounts.size === 1`), the category facet is omitted. This avoids a single-chip row that adds noise without filtering power.
- **Tag facet is sorted by count descending.** Tags are ordered most-used first; category values follow insertion order (alphabetical if the data is consistent).
- **Entire component renders nothing when `facets` is empty.** If the collection has no entries for the locale, or all entries share the same category and have no tags, the component outputs no HTML. Plan page layout accordingly — don't reserve space for the filter bar.
- **Double `getCollection` call.** This component always reads the collection internally. The parent page reading it again for rendering is a second `getCollection` call. In development this is cached; in production static builds it is deduplicated by Astro's content layer. No action needed, but worth knowing.
- **Facet labels are raw data values.** `key` and `label` for each chip are the raw `category`/`tag` strings from the collection entries — no i18n mapping occurs. Use consistent casing in your content frontmatter.
