---
component: CareerCard
oneLiner: Dark-surface card for a job opening with employment type, title, and location
status: stable
tags: [card]
---

## Purpose

Renders a single job opening as a clickable dark-surface card. Displays an employment-type badge, job title, two-line summary excerpt, location, and optional department. The entire card is an `<a>` element that navigates to the full posting. Designed for dark-background careers sections.

## When to use

Use on the careers index page to list all open positions. Pass entries from `getCollection("careers")` filtered to the current locale.

## When NOT to use

For the full job posting detail view, use `CareerPost` instead. Do not use this card on a light background section — its text-on-dark palette (`text-text-on-dark`) assumes a dark parent.

## Props

| Prop    | Type                         | Required | Notes                                                       |
| ------- | ---------------------------- | -------- | ----------------------------------------------------------- |
| `entry` | `CollectionEntry<"careers">` | yes      | A careers collection entry from `getCollection("careers")`. |
| `lang`  | `Locale`                     | yes      | Drives i18n labels and the locale-prefixed link href.       |

## Example

```astro
---
import { getCollection } from "astro:content";
import CareerCard from "~/components/CareerCard.astro";

const lang = "en";
const jobs = await getCollection("careers", ({ id }) =>
  id.startsWith(`${lang}/`),
);
const sorted = jobs.sort(
  (a, b) => b.data.postedAt.getTime() - a.data.postedAt.getTime(),
);
---

<div class="bg-surface-dark py-16">
  <div class="container grid grid-cols-1 md:grid-cols-2 gap-4">
    {sorted.map((job) => <CareerCard entry={job} lang={lang} />)}
  </div>
</div>
```

## i18n keys

| Key                                 | DE           | EN         |
| ----------------------------------- | ------------ | ---------- |
| `careers.employmentType.full-time`  | Vollzeit     | Full-time  |
| `careers.employmentType.part-time`  | Teilzeit     | Part-time  |
| `careers.employmentType.contractor` | Freiberufler | Contractor |
| `careers.employmentType.internship` | Praktikum    | Internship |

## Gotchas

- **Dark-surface palette.** The card uses `text-text-on-dark` and border colors built from `color-mix(in srgb, var(--color-text-on-dark) ...)`. It must be placed on a dark parent (`bg-surface-dark` or similar) — on a light background the text becomes invisible.
- **`department` is optional.** When `entry.data.department` is absent the department pill is simply omitted.
- **Link resolution uses `page-registry`.** The href is built via `findPageByKey("careers-index")` + locale-stripped entry slug. If the key is missing the fallback is `"karriere"` (DE) or `"careers"` (EN).
- **`summary` is clamped to two lines.** The card uses `line-clamp-2` on the summary paragraph. Keep summaries concise in the collection frontmatter.
