---
component: CareerPost
oneLiner: Full-page job posting with dark hero, metadata pills, and apply CTA
status: stable
tags: [content]
---

## Purpose

Renders a complete job posting detail page. The component owns the dark hero section (employment-type badge, title, summary, metadata pills for location/type/department, posted/closes dates) and the body section (prose content from markdown plus an "Apply now" CTA that opens `applyUrl` in a new tab). Navigation back to the careers index is provided at both ends.

## When to use

Use exactly once per career posting route — as the primary page body in `src/pages/[...path].astro` when `props.collection === "careers"`. The parent page also emits a `JobPosting` JSON-LD via `StructuredData` using `buildJobPostingLd`.

## When NOT to use

Do not use on listing pages; use `CareerCard` there. Do not instantiate multiple times per page.

## Props

| Prop    | Type                         | Required | Notes                                            |
| ------- | ---------------------------- | -------- | ------------------------------------------------ |
| `entry` | `CollectionEntry<"careers">` | yes      | The careers collection entry to render.          |
| `lang`  | `Locale`                     | yes      | Drives i18n strings, date formatting, back-link. |

## Example

```astro
---
import CareerPost from "~/components/CareerPost.astro";
import type { Locale } from "~/i18n";
import type { CollectionEntry } from "astro:content";

const { entry, lang } = Astro.props as {
  entry: CollectionEntry<"careers">;
  lang: Locale;
};
---

<CareerPost {entry} {lang} />
```

## i18n keys

| Key                                 | DE                       | EN                 |
| ----------------------------------- | ------------------------ | ------------------ |
| `careers.backToCareers`             | Zurück zur Karriereseite | Back to Careers    |
| `careers.employmentType.full-time`  | Vollzeit                 | Full-time          |
| `careers.employmentType.part-time`  | Teilzeit                 | Part-time          |
| `careers.employmentType.contractor` | Freiberufler             | Contractor         |
| `careers.employmentType.internship` | Praktikum                | Internship         |
| `careers.postedOn`                  | Veröffentlicht am        | Posted on          |
| `careers.closesOn`                  | Bewerbungsschluss        | Closes on          |
| `careers.apply`                     | Jetzt bewerben           | Apply now          |
| `careers.opensInNewTab`             | Öffnet in neuem Tab      | Opens in a new tab |

## Gotchas

- **`blog-prose` stylesheet.** The component imports `~/styles/blog-prose.css` directly. Do not re-import in the parent page.
- **`applyUrl` is required in the schema.** The Apply CTA always renders. Ensure every careers entry has a valid `applyUrl`.
- **`closesAt` is optional.** When absent the closing date pill is omitted from the hero.
- **`department` is optional.** When absent the department pill is omitted from the metadata row.
- **`render()` is called internally.** Do not pre-render the entry in the parent page.
- **Back-link uses `page-registry`.** `findPageByKey("careers-index")` must return a valid entry or the fallback slugs `"karriere"` / `"careers"` are used.
- **JSON-LD is the parent's responsibility.** `CareerPost` renders only the visible UI. The `JobPosting` structured data must be emitted separately by the parent page via `StructuredData`.
