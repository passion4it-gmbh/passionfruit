---
component: EventDetail
oneLiner: Full event detail with date/time, location, speakers, and registration CTA
status: stable
tags: [content]
---

## Purpose

Renders the complete detail view for a single event. Displays a back-navigation link, optional hero image, the event title and summary, a date/time detail card, a location detail card (with map link when `location.url` is set), a speakers section (team members resolved via `getEntries`), the markdown body, and a registration CTA for future events. Past events suppress the registration button.

## When to use

Use exactly once per event route — as the primary page body in `src/pages/[...path].astro` when `props.collection === "events"`. Do not use in listing contexts; use `EventCard` there.

## When NOT to use

Do not mount multiple instances per page. Do not instantiate directly in page components other than the catch-all route handler.

## Props

| Prop    | Type                        | Required | Notes                                            |
| ------- | --------------------------- | -------- | ------------------------------------------------ |
| `entry` | `CollectionEntry<"events">` | yes      | The event collection entry to render.            |
| `lang`  | `Locale`                    | yes      | Drives i18n strings and the localized back-link. |

## Example

```astro
---
import EventDetail from "~/components/EventDetail.astro";
import type { Locale } from "~/i18n";
import type { CollectionEntry } from "astro:content";

const { entry, lang } = Astro.props as {
  entry: CollectionEntry<"events">;
  lang: Locale;
};
---

<EventDetail {entry} {lang} />
```

## i18n keys

| Key                        | DE                            | EN                          |
| -------------------------- | ----------------------------- | --------------------------- |
| `events.backToEvents`      | Zurück zu den Veranstaltungen | Back to events              |
| `events.dateTime`          | Datum & Uhrzeit               | Date & Time                 |
| `events.speakers`          | Referenten                    | Speakers                    |
| `events.openMap`           | Auf Karte anzeigen            | View on map                 |
| `events.location.online`   | Online                        | Online                      |
| `events.location.inPerson` | Vor Ort                       | In person                   |
| `events.location.hybrid`   | Hybrid (Vor Ort + Online)     | Hybrid (in person + online) |
| `events.location.atVenue`  | Veranstaltungsort             | Venue                       |
| `events.register`          | Jetzt anmelden                | Register now                |

## Gotchas

- **`blog-prose` stylesheet.** The component imports `~/styles/blog-prose.css` directly. Do not re-import in the parent page.
- **`render()` and `getEntries()` are called internally.** The component resolves speakers from the `team` collection via `getEntries(entry.data.speakers)`. Do not pre-render the entry in the parent page.
- **Past-event detection uses `new Date()` at build time.** `isPast = entry.data.startsAt < now` is evaluated during static generation. Events in the past at build time will not show the registration CTA — this is intentional.
- **`endsAt` is optional.** When absent, only the start datetime is shown in the date card.
- **`heroImage` is optional.** When absent the hero image block is skipped entirely.
- **`location.url` is optional.** When set, a "View on map" link with `ExternalLink` icon appears in the location card.
- **Speakers are team collection references.** The `speakers` field in the events schema must contain valid `reference("team")` values. Speaker photos are optional; the component renders name and role regardless.
- **`events-index` page key must exist.** `findPageByKey("events-index")!.slug[lang]` is called without a null check.
- **`formatDateTime` is used, not `formatDate`.** The detail view shows full date + time; `EventCard` uses `formatDate` (date only).
