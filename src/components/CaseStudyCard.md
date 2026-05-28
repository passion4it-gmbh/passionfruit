---
component: CaseStudyCard
oneLiner: Portrait-first case study card with pull-quote, person info, and video badge
status: stable
tags: [card]
---

## Purpose

Renders a case study as a grid card. Shows a 4:5 portrait image on top, followed by a category label, a pull-quote from the subject, person name/role/company, tag badges, and a "Read more" link. An optional Play badge overlays the image when a video is available. A full-bleed invisible anchor handles keyboard and pointer navigation.

## When to use

Use on the case studies index page to list all references. Pass entries from `getCollection("caseStudies")` filtered to the current locale.

## When NOT to use

For the full case study detail page, use `CaseStudyDetail` instead. Do not use this card for blog posts or team members — each content type has its own card.

## Props

| Prop    | Type                             | Required | Notes                                                                     |
| ------- | -------------------------------- | -------- | ------------------------------------------------------------------------- |
| `entry` | `CollectionEntry<"caseStudies">` | yes      | Case studies collection entry for the current locale.                     |
| `lang`  | `Locale`                         | yes      | Drives link generation and i18n strings (quote marks, "Read more", etc.). |

## Example

```astro
---
import { getCollection } from "astro:content";
import CaseStudyCard from "~/components/CaseStudyCard.astro";

const lang = "en";
const entries = await getCollection("caseStudies", ({ id }) =>
  id.startsWith(`${lang}/`),
);
---

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {entries.map((entry) => <CaseStudyCard entry={entry} lang={lang} />)}
</div>
```

## i18n keys

| Key                          | DE              | EN              |
| ---------------------------- | --------------- | --------------- |
| `caseStudies.readMore`       | Mehr erfahren   | Read more       |
| `caseStudies.videoAvailable` | Video vorhanden | Video available |
| `caseStudies.tagsLabel`      | Themen          | Topics          |
| `caseStudies.quoteOpen`      | „               | "               |
| `caseStudies.quoteClose`     | "               | "               |

## Gotchas

- **`portraitImage` is required in the schema.** The `<Image>` always renders — ensure every case study entry supplies a portrait image. Alt text is `"{personName} | {clientName}"`.
- **`portraitFit: "contain"` adds padding.** When the entry sets `portraitFit: "contain"`, the thumbnail gets `padding: 1.5rem` and `object-fit: contain`. Use for logo-style images; leave unset for photos.
- **Full-bleed anchor pattern.** The clickable area is an invisible `<a class="card-link">` stretched over the entire card (`position: absolute; inset: 0`). Ensure the `aria-label` on that anchor includes meaningful text (built from `personName`, `clientName`, and `readMore`).
- **Video badge is cosmetic only.** The Play badge signals that a video exists; clicking the card navigates to the detail page where the `YouTubeFacade` is embedded — not directly to video playback.
- **Link resolution uses `page-registry`.** `findPageByKey("case-studies-index")` with fallback `"referenzen"` (DE) / `"case-studies"` (EN).
