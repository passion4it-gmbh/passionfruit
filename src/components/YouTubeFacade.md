---
component: YouTubeFacade
oneLiner: Privacy-friendly click-to-load YouTube embed with poster image
status: stable
tags: [facade, media]
---

## Purpose

Renders a static 16:9 poster image with a Play button overlay that loads the YouTube iframe only when the user clicks. No YouTube scripts or cookies are set until opt-in. The embed uses `youtube-nocookie.com` (privacy-enhanced domain) with `autoplay=1&rel=0`.

## When to use

Embed a YouTube video in any page — blog posts, case study detail pages, landing sections. Use whenever you would otherwise drop a raw `<iframe src="https://www.youtube.com/...">` tag. Case studies with a `videoId` field use this component automatically via `CaseStudyDetail`.

## When NOT to use

- Do not bypass the facade with a direct `<iframe>`. The facade is the privacy contract — bare iframes load YouTube tracking immediately on page load.
- Do not pass a remote URL as `poster` — use a local `ImageMetadata` import via `astro:assets`.
- Do not use for Spotify or podcast content; use `SpotifyFacade` instead.

## Props

| Prop        | Type            | Required | Default | Notes                                                                         |
| ----------- | --------------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `videoId`   | `string`        | yes      | —       | The `v=` parameter from the YouTube URL.                                      |
| `poster`    | `ImageMetadata` | yes      | —       | Local image import. Do not pass a remote URL.                                 |
| `posterAlt` | `string`        | yes      | —       | Describes the poster for screen readers — describes the image, not the video. |
| `title`     | `string`        | no       | —       | Used as iframe `title` and embedded into the aria-label.                      |
| `lang`      | `Locale`        | no       | `"de"`  | Drives the aria-label via `t('video.play', { title })`.                       |
| `class`     | `string`        | no       | `""`    | Extra classes appended to the root element.                                   |

## Example

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

In case study detail pages, `CaseStudyDetail` wires this up automatically when `entry.data.videoId` is set, reusing `entry.data.portraitImage` as the poster:

```astro
<YouTubeFacade
  videoId={entry.data.videoId}
  poster={entry.data.portraitImage}
  posterAlt={`${entry.data.personName} | ${entry.data.clientName}`}
  title={`${t("caseStudies.watchInterview")} – ${entry.data.personName}`}
  lang={lang}
/>
```

## i18n keys

| Key          | DE                       | EN                  |
| ------------ | ------------------------ | ------------------- |
| `video.play` | Video abspielen: {title} | Play video: {title} |

The `{title}` placeholder is interpolated at render time from the `title` prop. When `title` is omitted, an empty string is interpolated — the aria-label falls back to `t('video.play', { title: '' })`. Add both `de.json` and `en.json` entries when adding a new locale.

## Gotchas

- **Always pass `lang`** when the surrounding page is locale-aware. The default is `"de"`, which will produce a German aria-label on English pages if omitted.
- **Don't bypass the facade.** If you find yourself reaching for `<iframe src="https://youtube.com/...">`, stop — that loads YouTube tracking immediately. The facade is the only compliant path.
- **Poster aspect ratio is enforced.** The component wraps the poster in a `aspect-video` div. If your poster image is not 16:9, it will be cropped with `object-cover`. Use a 1280×720 or wider source image.
- **Hover scale on the poster.** The poster image applies `group-hover:scale-105` — a 5% zoom on mouse-over. Ensure the poster image has enough bleed (no critical content at the very edges) to avoid awkward crops on hover.
- **`posterAlt` describes the image, not the video.** Write alt text for the still image shown before click, not for the video content. The `title` prop (via the aria-label) describes the video action.
- **Adding a new locale.** Adding a third locale requires adding `video.play` to the new locale's JSON file. The component will throw at render time if the key is missing and the locale is passed.
