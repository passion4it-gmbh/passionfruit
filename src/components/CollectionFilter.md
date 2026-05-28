---
component: CollectionFilter
oneLiner: URL-driven filter chip bar for any content collection
status: stable
tags: [filter]
---

## Purpose

Renders a `<nav>` of pill-shaped anchor chips that toggle URL query parameters. Selecting a chip navigates to a new URL; the page re-renders server-side with the filtered collection. No client JavaScript is required for core filtering — the reset link and each chip are real `<a>` elements.

## When to use

Use on any collection index page (blog, events, case studies, careers…) where you want faceted filtering. The caller is responsible for:

1. Reading the collection and computing facet counts.
2. Building the `facets` array and `selected` map from `Astro.url.searchParams`.
3. Filtering the collection server-side to match the active selections.

For pre-wired wrappers that handle step 1–2 automatically, prefer `CaseStudiesFilter` or `EventsFilter` instead.

## When NOT to use

- Do not reach for this when you have only a single facet with two values — a simple pair of links is clearer.
- Do not use for client-side live-filtering (instant search). This component is stateless HTML; add a search library if you need live results without a page reload.
- Do not pass remote URLs or non-local images through props — this component has no image handling, but wrapper components that delegate to it (like `CaseStudiesFilter`) follow the same local-asset rule.

## Props

| Prop         | Type                       | Required | Default             | Notes                                                                      |
| ------------ | -------------------------- | -------- | ------------------- | -------------------------------------------------------------------------- |
| `facets`     | `Facet[]`                  | yes      | —                   | Taxonomy groups; each becomes a row of chips.                              |
| `selected`   | `Record<string, string[]>` | yes      | —                   | Active selections keyed by facet key, built from `Astro.url.searchParams`. |
| `lang`       | `Locale`                   | yes      | —                   | Drives i18n strings.                                                       |
| `baseUrl`    | `string`                   | yes      | —                   | Pass `Astro.url.pathname`. Base for all filter link hrefs.                 |
| `tone`       | `"on-light" \| "on-dark"`  | no       | `"on-light"`        | Adjusts idle chip appearance for light vs dark page sections.              |
| `resetLabel` | `string`                   | no       | `t('filter.reset')` | Override the reset link text.                                              |
| `class`      | `string`                   | no       | `""`                | Extra classes on the root `<nav>`.                                         |

`Facet` shape (exported from the component for use in callers):

```ts
interface Facet {
  key: string; // query param name, e.g. "tag"
  label: string; // group heading shown before chips
  values: FacetValue[];
}

interface FacetValue {
  key: string; // URL-safe value, e.g. "ai"
  label: string; // user-visible label
  count?: number; // optional item count shown in parens
}
```

## Example

### How a page builds `facets` and `selected`

```astro
---
import { getCollection } from "astro:content";
import CollectionFilter from "~/components/CollectionFilter.astro";
import type { Facet } from "~/components/CollectionFilter.astro";
import type { Locale } from "~/i18n";

const lang = (Astro.params.lang ?? "de") as Locale;
const selectedTags = Astro.url.searchParams.getAll("tag");

const posts = await getCollection("blog", ({ id }) =>
  id.startsWith(`${lang}/`),
);
const tagCounts = new Map<string, number>();
for (const post of posts) {
  for (const tag of post.data.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
}

const facets: Facet[] = [
  {
    key: "tag",
    label: lang === "de" ? "Thema" : "Topic",
    values: [...tagCounts.entries()].map(([key, count]) => ({
      key,
      label: key,
      count,
    })),
  },
];

const selected: Record<string, string[]> = { tag: selectedTags };

const filtered = selectedTags.length
  ? posts.filter((p) => p.data.tags.some((tag) => selectedTags.includes(tag)))
  : posts;
---

<CollectionFilter {facets} {selected} {lang} baseUrl={Astro.url.pathname} />
```

## i18n keys

| Key                | DE                  | EN             |
| ------------------ | ------------------- | -------------- |
| `filter.reset`     | Filter zurücksetzen | Reset filters  |
| `filter.allLabel`  | Alle                | All            |
| `filter.ariaLabel` | Inhalte filtern     | Filter content |

## Gotchas

- **Multi-value toggle.** Clicking a chip adds or removes its value from the facet's query param list without clearing other facets. Clicking "All" for a given facet clears only that facet's params while preserving others.
- **`aria-current="true"` on `<a>`.** Active chips receive `aria-current="true"` (not `aria-pressed`, which is button-only). This is the correct ARIA pattern for links representing the current filter state.
- **44 px touch targets.** Chips enforce `min-height: 2.75rem` via the `.chip` scoped style. Do not reduce padding on chips.
- **Transitions gated on `prefers-reduced-motion`.** The chip hover transition is only applied when the user has not requested reduced motion.
- **`tone` affects idle chips only.** Active chips (`chip--active`) use the same accent colour regardless of tone setting.
- **Empty facets.** If a `Facet` has zero values the component still renders the group heading with only the "All" chip. Callers should guard against this — or use a wrapper like `CaseStudiesFilter` that suppresses empty facets.
