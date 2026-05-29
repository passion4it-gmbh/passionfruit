---
component: EventCard
oneLiner: Teaser card for an event with date badge, location kind, and registration CTA
status: stable
tags: [card]
---

## Purpose

Renders a single event as a clickable card. Shows an optional 16:10 hero image (or an accent-gradient placeholder with a Calendar icon), a date badge, a location-kind indicator (online/in-person/hybrid), the event title, a three-line summary excerpt, and a primary CTA — either a "Register now" button to `registrationUrl` or a "View details" link to the event detail page.

## When to use

Use on the events index page to list all events. Pass entries from `getCollection("events")` filtered to the current locale.

## When NOT to use

For the full event detail view, use `EventDetail` instead. Do not use this card on a dark-surface section without adjusting the card palette — the card uses `bg-surface` colors for its surface.

## Props

| Prop    | Type                        | Required | Notes                                                     |
| ------- | --------------------------- | -------- | --------------------------------------------------------- |
| `entry` | `CollectionEntry<"events">` | yes      | The event collection entry for the current locale.        |
| `lang`  | `Locale`                    | yes      | Drives i18n strings, date formatting, and localized href. |

## Example

```astro
---
import { getCollection } from "astro:content";
import EventCard from "~/components/EventCard.astro";

const lang = "en";
const events = await getCollection("events", ({ id }) =>
  id.startsWith(`${lang}/`),
);
const sorted = events.sort(
  (a, b) => a.data.startsAt.getTime() - b.data.startsAt.getTime(),
);
---

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {sorted.map((event) => <EventCard entry={event} lang={lang} />)}
</div>
```

## i18n keys

| Key                        | DE                        | EN                          |
| -------------------------- | ------------------------- | --------------------------- |
| `events.register`          | Jetzt anmelden            | Register now                |
| `events.details`           | Details ansehen           | View details                |
| `events.location.online`   | Online                    | Online                      |
| `events.location.inPerson` | Vor Ort                   | In person                   |
| `events.location.hybrid`   | Hybrid (Vor Ort + Online) | Hybrid (in person + online) |

## Gotchas

- **Hero image is optional.** When `entry.data.heroImage` is absent, an accent-gradient placeholder with a `Calendar` icon is shown. Alt text for the hero image is the event title.
- **CTA logic:** when `registrationUrl` is set, a `Button` component with `variant="secondary"` opens in a new tab. When absent, a plain text link navigates to the detail page. The detail-page link uses `findPageByKey("events-index")` — that key must be registered in `page-registry.ts`.
- **`location.kind` drives icon rendering.** `online` → Globe + "Online" label only; `in-person` → MapPin + venue/city only; `hybrid` → **both indicators in the same row** (Globe + "Online" AND MapPin + venue/city). All three modes are handled — ensure every event entry sets `location.kind`.
- **Date formatting uses `startsAt`.** The date badge always shows the start date only. Full start/end datetime display is handled by `EventDetail`.
- **`events-index` page key must exist.** `findPageByKey("events-index")!.slug[lang]` is called without a null check — the route registration in `page-registry.ts` is mandatory.
