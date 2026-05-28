---
component: CaseStudyDetail
oneLiner: Full case study detail with hero quote, portrait, video, and sibling nav
status: stable
tags: [content]
---

## Purpose

Renders the complete detail view for a case study. Displays a back-link, a hero pull-quote (with category label), a two-column layout (portrait image left, person meta and tags right), an optional `YouTubeFacade` embed when `videoId` is set, the markdown body, and prev/next sibling navigation derived at render time from all locale-matching entries sorted newest-first.

## When to use

Use exactly once per case study route — as the primary page body in `src/pages/[...path].astro` when `props.collection === "caseStudies"`. Do not use in listing contexts; use `CaseStudyCard` there.

## When NOT to use

Do not mount multiple instances per page. Do not instantiate directly in page components other than the catch-all route handler.

## Props

| Prop    | Type                             | Required | Notes                                                       |
| ------- | -------------------------------- | -------- | ----------------------------------------------------------- |
| `entry` | `CollectionEntry<"caseStudies">` | yes      | Full case studies entry including rendered body content.    |
| `lang`  | `Locale`                         | yes      | Drives back-link, sibling navigation, and all i18n strings. |

## Example

```astro
---
import CaseStudyDetail from "~/components/CaseStudyDetail.astro";
import type { Locale } from "~/i18n";
import type { CollectionEntry } from "astro:content";

const { entry, lang } = Astro.props as {
  entry: CollectionEntry<"caseStudies">;
  lang: Locale;
};
---

<CaseStudyDetail {entry} {lang} />
```

## i18n keys

| Key                             | DE                       | EN                   |
| ------------------------------- | ------------------------ | -------------------- |
| `caseStudies.backToCaseStudies` | Zurück zu den Referenzen | Back to case studies |
| `caseStudies.siblingNav`        | Weitere Referenzen       | More case studies    |
| `caseStudies.previousReference` | Vorherige                | Previous             |
| `caseStudies.nextReference`     | Nächste                  | Next                 |
| `caseStudies.watchInterview`    | Interview ansehen        | Watch interview      |
| `caseStudies.tagsLabel`         | Themen                   | Topics               |
| `caseStudies.quoteOpen`         | „                        | "                    |
| `caseStudies.quoteClose`        | "                        | "                    |
| `caseStudies.srName`            | Name                     | Name                 |
| `caseStudies.srRole`            | Rolle                    | Role                 |
| `caseStudies.srCompany`         | Unternehmen              | Company              |

## Gotchas

- **`blog-prose` stylesheet.** The component imports `~/styles/blog-prose.css` directly. Do not re-import in the parent page.
- **`render()` is called internally.** Do not pre-render the entry in the parent page.
- **Sibling navigation queries `getCollection` at render time.** This is a deliberate design choice — no static data is required. Be aware that it adds a collection read per page render during build.
- **`portraitFit: "contain"` adds padding.** Same as `CaseStudyCard`: set for logo-style images, leave unset for photos.
- **`portraitImage` is used as the `YouTubeFacade` poster.** When `videoId` is set the same portrait image serves as the video thumbnail — no separate `posterImage` field is needed.
- **`publishedAt` is optional in the schema.** Sibling navigation falls back to `0` for entries without a date, placing them last.
- **Max-width is 64rem.** The `case-study-detail` root uses `max-width: 64rem; margin: 0 auto`. Wrap in a `container` at the page level if needed.
