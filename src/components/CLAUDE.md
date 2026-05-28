# Components

This directory holds Astro components shared across pages. **One component per content type** — don't introduce a generic `<Card>` or `<Section>`; create `BlogCard`, `TeamCard`, etc. instead. See [`../../STYLE_GUIDE.md`](../../STYLE_GUIDE.md) for design rules (colors, typography, cards, animations); this file is for component-specific usage.

## Conventions

- **Astro over React.** Only reach for React when interactivity genuinely demands it.
- **No hex literals.** Tailwind utility classes that map to `@theme` tokens in `src/styles/global.css`.
- **Icons:** `@lucide/astro` only. No emojis.
- **i18n:** `useTranslations(locale)` from `~/i18n`. Adding a new string means updating both `src/i18n/de.json` and `src/i18n/en.json` in the same commit.
- **Images:** `<Image>` from `astro:assets`. Alt text is mandatory (ESLint enforces `jsx-a11y/alt-text` as error).

## `CollectionFilter.astro`

Generic taxonomy-driven filter bar. Any collection page (blog, events, case studies, careers…) passes its facet data; the component renders anchor-link chips that update URL query params. The page re-renders server-side with the filtered collection — **no client JS required for core filtering**.

### Props

| Prop         | Type                       | Required | Default             | Notes                                                                      |
| ------------ | -------------------------- | -------- | ------------------- | -------------------------------------------------------------------------- |
| `facets`     | `Facet[]`                  | yes      | —                   | Taxonomy groups; each becomes a row of chips.                              |
| `selected`   | `Record<string, string[]>` | yes      | —                   | Active selections keyed by facet key, built from `Astro.url.searchParams`. |
| `lang`       | `Locale`                   | yes      | —                   | Drives i18n strings.                                                       |
| `baseUrl`    | `string`                   | yes      | —                   | Pass `Astro.url.pathname`. Used as the base for all filter link hrefs.     |
| `tone`       | `"on-light" \| "on-dark"`  | no       | `"on-light"`        | Adjusts idle chip appearance for light vs dark page sections.              |
| `resetLabel` | `string`                   | no       | `t('filter.reset')` | Override the reset link text.                                              |
| `class`      | `string`                   | no       | `""`                | Extra classes on the root `<nav>`.                                         |

`Facet` shape:

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

### How a page builds `facets` and `selected`

```astro
---
import { getCollection } from "astro:content";
import CollectionFilter from "~/components/CollectionFilter.astro";
import type { Facet } from "~/components/CollectionFilter.astro";
import type { Locale } from "~/i18n";

// lang comes from the page's getStaticPaths or a parent layout
const lang = (Astro.params.lang ?? "de") as Locale;
const selectedTags = Astro.url.searchParams.getAll("tag");

// Collect tag counts from the blog collection for this locale
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

const selected: Record<string, string[]> = {
  tag: selectedTags,
};

// Filter server-side: URL params drive which posts render
const filtered = selectedTags.length
  ? posts.filter((p) => p.data.tags.some((tag) => selectedTags.includes(tag)))
  : posts;
---

<CollectionFilter {facets} {selected} {lang} baseUrl={Astro.url.pathname} />
```

### i18n keys added (`filter.*`)

| Key                | DE                  | EN             |
| ------------------ | ------------------- | -------------- |
| `filter.reset`     | Filter zurücksetzen | Reset filters  |
| `filter.allLabel`  | Alle                | All            |
| `filter.ariaLabel` | Inhalte filtern     | Filter content |

### a11y

- Root is a `<nav>` with `aria-label` from `t('filter.ariaLabel')`.
- Chips are real `<a>` elements — fully keyboard navigable without JS.
- `aria-current="true"` on active chips signals state to screen readers (valid on `<a>` elements, unlike `aria-pressed` which is button-only).
- `focus-visible` ring on all chips.
- 44px minimum touch target height enforced via padding.
- Transitions are gated on `prefers-reduced-motion: no-preference`.

## Legal pages

### `LegalDocument.astro`

Reusable wrapper for legal pages (imprint, privacy, future terms/AGB). Renders a constrained-width prose container with the page title, an optional last-updated timestamp, and a slot for the markdown body. Uses `blog-prose` typography.

| Prop          | Type     | Required | Default | Notes                                                                     |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------------------------- |
| `title`       | `string` | yes      | —       | Rendered as the page `<h1>`.                                              |
| `lang`        | `Locale` | yes      | —       | Drives locale-aware date formatting; label from `t('legal.lastUpdated')`. |
| `lastUpdated` | `Date`   | no       | —       | When provided, renders a formatted timestamp below the heading.           |
| `class`       | `string` | no       | —       | Extra classes appended to the outer `<section>`.                          |

Slot: the markdown `<Content />` from the page collection entry.

```astro
<LegalDocument
  title={entry.data.title}
  lang={lang}
  lastUpdated={new Date("2025-01-01")}
>
  <Content />
</LegalDocument>
```

Adding a new legal page: create `src/content/pages/{de,en}/<slug>.md` with matching `translationKey`, wire up a page component in `src/components/pages/`, add the route to `src/lib/page-registry.ts`. The `legal.lastUpdated` i18n key is already in both `de.json` and `en.json`.

## Case Studies

Three components handle the case studies collection end-to-end. All three are locale-aware and use brand tokens exclusively.

### `CaseStudyCard.astro`

Grid card for the index page. Portrait image on top (4:5 aspect ratio), pull-quote + person info below. An optional Play badge indicates a video is available. Tags render as `Badge` chips. The entire card is wrapped in an invisible full-bleed anchor for keyboard and pointer access.

| Prop    | Type                             | Required | Notes                                       |
| ------- | -------------------------------- | -------- | ------------------------------------------- |
| `entry` | `CollectionEntry<"caseStudies">` | yes      | Drives image, quote, person, tags, videoId. |
| `lang`  | `Locale`                         | yes      | Used for link generation and i18n strings.  |

The card href is built from `findPageByKey("case-studies-index")` + the entry slug. `portraitFit: "contain"` adds padding around the image (use for logos).

### `CaseStudyDetail.astro`

Full-page detail view. Renders a hero quote, a two-column layout (portrait left, person meta right), optional `YouTubeFacade` embed, markdown body via `<slot />`, and prev/next sibling navigation.

| Prop    | Type                             | Required | Notes                                        |
| ------- | -------------------------------- | -------- | -------------------------------------------- |
| `entry` | `CollectionEntry<"caseStudies">` | yes      | Full entry including rendered body content.  |
| `lang`  | `Locale`                         | yes      | Drives back-link, sibling nav, i18n strings. |

When `videoId` is set, `YouTubeFacade` is embedded using `portraitImage` as the poster. Pass `lang` so the aria-label is localised.

Sibling navigation is derived at render time by querying all locale-matching entries sorted newest-first — no static data required.

### `CaseStudiesFilter.astro`

Thin wrapper around `CollectionFilter`. Reads all case studies for the current locale, extracts unique `category` and `tag` values with counts, and passes them as `facets`. Only renders if there is at least one facet with values.

| Prop       | Type                       | Required | Default      | Notes                                                                                |
| ---------- | -------------------------- | -------- | ------------ | ------------------------------------------------------------------------------------ |
| `lang`     | `Locale`                   | yes      | —            | Passed through to `CollectionFilter`.                                                |
| `baseUrl`  | `string`                   | yes      | —            | Pass `Astro.url.pathname`.                                                           |
| `selected` | `Record<string, string[]>` | yes      | —            | Keys: `"category"`, `"tag"`. Build from URL search params.                           |
| `tone`     | `"on-light" \| "on-dark"`  | no       | `"on-light"` | Pass `"on-dark"` when embedding in a dark-surface section (inverts idle chip style). |
| `class`    | `string`                   | no       | `""`         | Extra classes on the root element.                                                   |

Category facet is suppressed when all entries share the same category (single-facet collapses are noise).

#### YouTubeFacade integration

Case studies with a `videoId` embed via the existing `YouTubeFacade`. The `portraitImage` is reused as poster — no separate `posterImage` field needed. The `title` prop is built from `t("caseStudies.watchInterview")` + the person name.

```astro
<YouTubeFacade
  videoId={entry.data.videoId}
  poster={entry.data.portraitImage}
  posterAlt={`${entry.data.personName} | ${entry.data.clientName}`}
  title={`${t("caseStudies.watchInterview")} – ${entry.data.personName}`}
  lang={lang}
/>
```

## Media facades

Privacy-friendly click-to-load embeds — static poster + Play button until the user opts in. See [`../../STYLE_GUIDE.md`](../../STYLE_GUIDE.md) §10 for the design rationale and provider rules.

### `YouTubeFacade.astro`

Embeds via `youtube-nocookie.com` (privacy-enhanced domain).

| Prop        | Type            | Required | Default | Notes                                                             |
| ----------- | --------------- | -------- | ------- | ----------------------------------------------------------------- |
| `videoId`   | `string`        | yes      | —       | The `v=` parameter from the YouTube URL.                          |
| `poster`    | `ImageMetadata` | yes      | —       | Local image import. Don't pass a remote URL.                      |
| `posterAlt` | `string`        | yes      | —       | Describes the poster for screen readers — not the video.          |
| `title`     | `string`        | no       | —       | Used as the iframe title and embedded into the aria-label.        |
| `lang`      | `Locale`        | no       | `"de"`  | Drives the localized aria-label via `t('video.play', { title })`. |
| `class`     | `string`        | no       | `""`    | Extra classes appended to the root.                               |

```astro
---
import poster from "~/assets/blog/intro-talk.jpg";
import YouTubeFacade from "~/components/YouTubeFacade.astro";
---

<YouTubeFacade
  videoId="dQw4w9WgXcQ"
  poster={poster}
  posterAlt="Speaker on stage, warm conference lighting"
  title="Intro talk — passion4it 2026"
  lang={lang}
/>
```

### `SpotifyFacade.astro`

Embeds via `open.spotify.com/embed/{kind}/{id}`. Defaults to podcast episodes but works for tracks, shows, playlists, and albums.

| Prop            | Type                                                      | Required | Default     | Notes                                                                   |
| --------------- | --------------------------------------------------------- | -------- | ----------- | ----------------------------------------------------------------------- |
| `episodeId`     | `string`                                                  | yes      | —           | Spotify ID. Despite the name, holds any Spotify entity ID (see `kind`). |
| `title`         | `string`                                                  | yes      | —           | Used as iframe title and aria-label.                                    |
| `cover`         | `ImageMetadata`                                           | yes      | —           | Local image import.                                                     |
| `coverAlt`      | `string`                                                  | yes      | —           | Read by screen readers via an `.sr-only` element.                       |
| `kind`          | `"episode" \| "track" \| "show" \| "playlist" \| "album"` | no       | `"episode"` | Picks the Spotify embed path.                                           |
| `platformLabel` | `string`                                                  | no       | `"Spotify"` | Eyebrow label shown above the title.                                    |
| `lang`          | `Locale`                                                  | no       | `"de"`      | Drives the aria-label via `t('podcast.play', { title })`.               |
| `class`         | `string`                                                  | no       | `""`        | Extra classes appended to the root.                                     |

```astro
<SpotifyFacade
  episodeId="EPISODE_ID"
  kind="episode"
  title="Episode 12 — Bilingual marketing in practice"
  cover={cover}
  coverAlt="Podcast cover art with microphone"
  lang={lang}
/>
```

### Rules for both facades

- **Always pass `lang`** when the surrounding page is locale-aware — the aria-label is built from `t('video.play', { title })` / `t('podcast.play', { title })`. Adding a new locale means adding both keys in `de.json` and `en.json`.
- **Don't bypass the facade.** If you find yourself reaching for `<iframe src="https://youtube.com/...">`, stop — see STYLE_GUIDE §11.

## Social proof

### `TrustSection.astro`

Horizontal strip of partner/client logos with an optional eyebrow heading. Logos are grayscale at rest and reveal color on hover — a low-noise way to signal credibility without visual shouting.

| Prop      | Type                                                        | Required | Default | Notes                                                                  |
| --------- | ----------------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------- |
| `logos`   | `Array<{ src: ImageMetadata; alt: string; href?: string }>` | yes      | —       | Local image imports only. Pass meaningful `alt` — logo name is enough. |
| `eyebrow` | `string`                                                    | no       | —       | Short label above the logo row (e.g., "Trusted by"). Sentence case.    |
| `class`   | `string`                                                    | no       | —       | Extra classes appended to the root `<section>`.                        |

- `href` wraps the logo in an `<a target="_blank" rel="noopener noreferrer">`. When set, the `alt` text moves to `aria-label` on the anchor and the `<Image>` gets `alt=""` (decorative). When absent, `alt` goes on the image directly.
- Images are rendered via `<Image>` at `height={40}` (`h-10`). Don't pass width — it is derived from the source aspect ratio.
- The section already has `border-y border-border` and `py-16`. Don't wrap it in another section with the same treatment.

```astro
---
import logoAcme from "~/assets/logos/acme.svg";
import logoWidget from "~/assets/logos/widget.png";
import TrustSection from "~/components/TrustSection.astro";
---

<TrustSection
  eyebrow="Trusted by"
  logos={[
    { src: logoAcme, alt: "Acme Corp", href: "https://acme.example.com" },
    { src: logoWidget, alt: "Widget GmbH" },
  ]}
/>
```

### `ComparisonTable.astro`

Two-or-three-column feature comparison grid (e.g., "Us vs. Them" or "Free vs. Pro vs. Enterprise"). On desktop it renders as a semantic `<table>`; on mobile it collapses into per-column cards so no horizontal scrolling is required.

| Prop      | Type                                                        | Required | Default | Notes                                                                                            |
| --------- | ----------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------ |
| `columns` | `Array<{ name: string; highlight?: boolean }>`              | yes      | —       | Column headers. Set `highlight: true` on the column you want to call out.                        |
| `rows`    | `Array<{ feature: string; values: (boolean \| string)[] }>` | yes      | —       | `values` must have the same length as `columns`. `boolean` renders icons; `string` renders text. |
| `lang`    | `Locale`                                                    | no       | `"de"`  | Drives the screen-reader labels for Check/X icons (`comparison.yes` / `comparison.no`).          |
| `class`   | `string`                                                    | no       | —       | Extra classes on the root `<div>`.                                                               |

- `boolean` values: `true` → `<Check>` in `text-accent`; `false` → `<X>` in `text-muted`.
- `string` values: rendered as plain text in `text-text`.
- `highlight` column: `bg-accent/5` cells + `ring-1 ring-inset ring-accent/20` border on both desktop and mobile.
- Feature/value strings come from the **caller** — no new i18n keys needed for content. The only template-owned keys are `comparison.feature`, `comparison.yes`, `comparison.no` (already in `de.json` / `en.json`).

```astro
---
import ComparisonTable from "~/components/ComparisonTable.astro";
---

<ComparisonTable
  lang={lang}
  columns={[
    { name: "Basis" },
    { name: "Pro", highlight: true },
    { name: "Konkurrenz" },
  ]}
  rows={[
    { feature: "SSL-Zertifikat", values: [true, true, true] },
    { feature: "Eigene Domain", values: [false, true, true] },
    { feature: "Support", values: ["E-Mail", "24/7", "E-Mail"] },
    { feature: "Speicher", values: ["1 GB", "50 GB", "10 GB"] },
  ]}
/>
```

## Careers

Components for the job postings collection. No external HR-platform dependency — content is plain markdown. The collection uses the same `glob` loader and bilingual `translationKey` pattern as `blog` and `team`.

### `CareerCard.astro`

Card representation of a job opening. Used on the careers index page to list all open positions.

| Prop    | Type                         | Required | Notes                                                       |
| ------- | ---------------------------- | -------- | ----------------------------------------------------------- |
| `entry` | `CollectionEntry<"careers">` | yes      | A careers collection entry from `getCollection("careers")`. |
| `lang`  | `Locale`                     | yes      | Drives i18n labels and link locale prefix.                  |

The card links to `/{careersIndexSlug}/{entrySlug}/` (or `/en/{slug}/` for EN). It shows an employment-type badge, the job title, a two-line summary, location, and department.

```astro
---
import { getCollection } from "astro:content";
import CareerCard from "~/components/CareerCard.astro";

const jobs = await getCollection("careers");
const deJobs = jobs.filter((j) => j.id.startsWith("de/"));
---

{deJobs.map((job) => <CareerCard entry={job} lang="de" />)}
```

### `CareerPost.astro`

Full job posting detail view. Renders a dark hero with metadata (location, employment type, department, posted date, optional deadline), the markdown body, and an "Apply" CTA that opens `applyUrl` in a new tab.

| Prop    | Type                         | Required | Notes                          |
| ------- | ---------------------------- | -------- | ------------------------------ |
| `entry` | `CollectionEntry<"careers">` | yes      | The careers entry to render.   |
| `lang`  | `Locale`                     | yes      | Drives i18n strings and dates. |

Used by `src/pages/[...path].astro` when `props.collection === "careers"`. The page also emits a `JobPosting` JSON-LD via `StructuredData.astro` (built by `buildJobPostingLd` in `src/lib/structured-data.ts`).

### `src/components/pages/careers-index.astro`

The careers index page component, consumed by the static-page routing in `page-registry.ts`. Lists all jobs for the current locale, sorted by `postedAt` descending.

Page key: `careers-index`. Bilingual slugs: `{ de: "karriere", en: "careers" }`.

### `buildJobPostingLd` (in `src/lib/structured-data.ts`)

Builds a Schema.org-valid `JobPosting` JSON-LD object for a careers entry. Maps `employmentType` enum values to Schema.org constants (`FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `INTERN`). Includes `baseSalary` when `salaryMin` or `salaryMax` is set; includes `validThrough` when `closesAt` is set.

Emitted via `<StructuredData type="JobPosting" data={jobPostingLd} />` in `[...path].astro`.

## Events

Three components form the events trilogy: `EventCard` (list item), `EventDetail` (full-page), and `EventsFilter` (filter bar wrapping `CollectionFilter`).

### `EventCard.astro`

Card representation for a single event in a listing. Shows a hero image (or an accent-gradient placeholder), date badge, location kind indicator, title, summary, and a primary CTA — either a registration link or a "View details" link.

| Prop    | Type                        | Required | Notes                                   |
| ------- | --------------------------- | -------- | --------------------------------------- |
| `entry` | `CollectionEntry<"events">` | yes      | The event collection entry.             |
| `lang`  | `Locale`                    | yes      | Drives i18n strings and localized href. |

```astro
<EventCard entry={event} lang={lang} />
```

### `EventDetail.astro`

Full-page event detail view. Renders back-navigation, optional hero image, title, summary, date/time card, location card (with map link when `location.url` is set), speakers section (resolved via `getEntries`), markdown body, and a registration CTA for future events.

| Prop    | Type                        | Required | Notes                                        |
| ------- | --------------------------- | -------- | -------------------------------------------- |
| `entry` | `CollectionEntry<"events">` | yes      | The event collection entry.                  |
| `lang`  | `Locale`                    | yes      | Drives i18n strings and localized back-link. |

Consumed by `src/pages/[...path].astro` — do not instantiate directly in page components.

### `EventsFilter.astro`

Thin wrapper around `CollectionFilter`. Derives `category` and `tag` facets with counts from the entries the caller passes in, then delegates rendering to `CollectionFilter`. The caller is responsible for reading the collection once and passing the locale-filtered slice — `EventsFilter` does **not** call `getCollection` internally.

| Prop       | Type                          | Required | Notes                                                               |
| ---------- | ----------------------------- | -------- | ------------------------------------------------------------------- |
| `entries`  | `CollectionEntry<"events">[]` | yes      | Locale-filtered events; read the collection once in the index page. |
| `lang`     | `Locale`                      | yes      | Drives i18n strings for facet labels.                               |
| `selected` | `Record<string, string[]>`    | yes      | Active filter values keyed by facet key.                            |
| `baseUrl`  | `string`                      | yes      | Pass `Astro.url.pathname`.                                          |

```astro
---
import { getCollection } from "astro:content";

const allEvents = await getCollection("events", ({ id }) =>
  id.startsWith(`${lang}/`),
);
const selectedCategories = Astro.url.searchParams.getAll("category");
const selectedTags = Astro.url.searchParams.getAll("tag");
const selected = { category: selectedCategories, tag: selectedTags };
---

<EventsFilter entries={allEvents} {lang} {selected} baseUrl={Astro.url.pathname} />
```

### i18n keys (`events.*`)

| Key                        | DE                                   | EN                                   |
| -------------------------- | ------------------------------------ | ------------------------------------ |
| `events.title`             | Veranstaltungen                      | Events                               |
| `events.description`       | Webinare, Workshops und Konferenzen… | Webinars, workshops and conferences… |
| `events.noResults`         | Keine Veranstaltungen gefunden.      | No events found.                     |
| `events.register`          | Jetzt anmelden                       | Register now                         |
| `events.details`           | Details ansehen                      | View details                         |
| `events.backToEvents`      | Zurück zu den Veranstaltungen        | Back to events                       |
| `events.dateTime`          | Datum & Uhrzeit                      | Date & Time                          |
| `events.speakers`          | Referenten                           | Speakers                             |
| `events.openMap`           | Auf Karte anzeigen                   | View on map                          |
| `events.location.online`   | Online                               | Online                               |
| `events.location.inPerson` | Vor Ort                              | In person                            |
| `events.location.hybrid`   | Hybrid (Vor Ort + Online)            | Hybrid (in person + online)          |
| `events.location.atVenue`  | Veranstaltungsort                    | Venue                                |
| `events.filter.category`   | Kategorie                            | Category                             |
| `events.filter.tag`        | Thema                                | Topic                                |
