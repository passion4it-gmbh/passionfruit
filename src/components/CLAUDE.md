# Components

This directory holds Astro components shared across pages. **One component per content type** — don't introduce a generic `<Card>` or `<Section>`; create `BlogCard`, `TeamCard`, etc. instead. See [`../../STYLE_GUIDE.md`](../../STYLE_GUIDE.md) for design rules (colors, typography, cards, animations); this file is for component-specific usage.

## Conventions

- **Astro over React.** Only reach for React when interactivity genuinely demands it.
- **No hex literals.** Tailwind utility classes that map to `@theme` tokens in `src/styles/global.css`.
- **Icons:** `@lucide/astro` only. No emojis.
- **i18n:** `useTranslations(locale)` from `~/i18n`. Adding a new string means updating both `src/i18n/de.json` and `src/i18n/en.json` in the same commit.
- **Images:** `<Image>` from `astro:assets`. Alt text is mandatory (ESLint enforces `jsx-a11y/alt-text` as error).

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
