---
component: SpotifyFacade
oneLiner: Privacy-friendly click-to-load Spotify embed with poster preview
status: stable
tags: [facade, media]
---

## Purpose

Renders a static poster button (cover art + title + Play icon) that loads the Spotify iframe only when the user clicks. No Spotify scripts or cookies are set until opt-in. Supports episodes, tracks, shows, playlists, and albums via the `kind` prop. The embed URL uses `open.spotify.com/embed/{kind}/{id}`.

## When to use

Embed a podcast episode, track, or playlist anywhere in a page — blog posts, landing sections, case studies. Use whenever you would otherwise drop a raw `<iframe src="https://open.spotify.com/...">` tag.

## When NOT to use

- Do not bypass the facade with a direct `<iframe>`. The facade is the privacy contract — bare iframes load Spotify tracking immediately on page load.
- Do not pass a remote URL as `cover` — use a local `ImageMetadata` import via `astro:assets`.
- Do not use for YouTube content; use `YouTubeFacade` instead.

## Props

| Prop            | Type                                                      | Required | Default     | Notes                                                                   |
| --------------- | --------------------------------------------------------- | -------- | ----------- | ----------------------------------------------------------------------- |
| `episodeId`     | `string`                                                  | yes      | —           | Spotify entity ID. Despite the name, holds any Spotify ID (see `kind`). |
| `title`         | `string`                                                  | yes      | —           | Used as iframe `title` and embedded into the aria-label.                |
| `cover`         | `ImageMetadata`                                           | yes      | —           | Local image import. Do not pass a remote URL.                           |
| `coverAlt`      | `string`                                                  | yes      | —           | Read by screen readers via an `.sr-only` element on the button.         |
| `kind`          | `"episode" \| "track" \| "show" \| "playlist" \| "album"` | no       | `"episode"` | Picks the Spotify embed path segment.                                   |
| `platformLabel` | `string`                                                  | no       | `"Spotify"` | Eyebrow label shown above the title in accent colour.                   |
| `lang`          | `Locale`                                                  | no       | `"de"`      | Drives the aria-label via `t('podcast.play', { title })`.               |
| `class`         | `string`                                                  | no       | `""`        | Extra classes appended to the root element.                             |

## Example

```astro
---
import cover from "~/assets/blog/podcast-cover.jpg";
import SpotifyFacade from "~/components/SpotifyFacade.astro";
---

<SpotifyFacade
  episodeId="EPISODE_ID"
  kind="episode"
  title="Episode 12 — Bilingual marketing in practice"
  cover={cover}
  coverAlt="Podcast cover art with microphone"
  lang={lang}
/>
```

## i18n keys

| Key            | DE                            | EN                      |
| -------------- | ----------------------------- | ----------------------- |
| `podcast.play` | {title} auf Spotify abspielen | Play {title} on Spotify |

The `{title}` placeholder is interpolated at render time from the `title` prop. Add both `de.json` and `en.json` entries when adding a new locale.

## Gotchas

- **Always pass `lang`** when the surrounding page is locale-aware. The default is `"de"`, which will produce a German aria-label on English pages if omitted.
- **Don't bypass the facade.** If you find yourself reaching for `<iframe src="https://open.spotify.com/...">`, stop — that loads Spotify tracking immediately. The facade is the only compliant path.
- **Cover image is decorative on the button.** The `<Image>` inside the button has `alt=""` (decorative); the accessible description lives in the `.sr-only` `coverAlt` span. Do not duplicate the description in both places.
- **`episodeId` prop name is misleading.** The prop is named `episodeId` for historical reasons but accepts any Spotify entity ID. Pass a show ID with `kind="show"`, a playlist ID with `kind="playlist"`, etc.
- **Iframe dimensions are fixed.** On click, the injected iframe is always `height="232"`. This is the standard Spotify compact embed height. There is no prop to override it.
- **Adding a new locale.** Adding a third locale requires adding `podcast.play` to the new locale's JSON file. The component will throw at render time if the key is missing and the locale is passed.
