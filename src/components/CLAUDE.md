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
- **Don't bypass the facade.** If you find yourself reaching for `<iframe src="https://youtube.com/...">`, stop — see STYLE_GUIDE §10.
