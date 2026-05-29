---
component: StickyStory
oneLiner: Sticky-copy storytelling with scrolling visuals and chapter dim-and-brighten
status: stable
tags: [section, motion]
---

## Purpose

Long-form storytelling layout: a left-column copy track that becomes `position: sticky` on desktop while right-column visuals scroll past. An `IntersectionObserver` marks the matching copy chapter as `data-active="true"` so chapters dim and brighten as the user reads. Mobile falls back to a plain stacked layout — no sticky behavior, no observer.

## When to use

- Multi-chapter narratives that benefit from media pinning — case studies, methodology walkthroughs, manifesto-style pages.
- Editorial deep dives where each visual is conceptually tied to a paragraph of copy.

## When NOT to use

- Short content (one or two chapters) — the effect adds nothing and forces awkward vertical space.
- Pages where users scroll quickly to a CTA — sticky scroll-jacking lite is the wrong vibe for transactional flows.
- When you can't supply distinct imagery per chapter — a single image with scrolling text reads better as a hero + body.

## Props

Consumes `StickyStoryProps` from `~/types/sections` (extends `SectionProps`).

| Prop       | Type                                                 | Required | Default     | Notes                                                  |
| ---------- | ---------------------------------------------------- | -------- | ----------- | ------------------------------------------------------ |
| `eyebrow`  | `string`                                             | no       | —           | Uppercase tracked label above the section heading.     |
| `headline` | `string`                                             | yes      | —           | Section `<h2>`; rendered in the optional header block. |
| `lede`     | `string`                                             | no       | —           | Body paragraph under the headline.                     |
| `chapters` | `StickyStoryChapter[]`                               | yes      | —           | Each chapter: `{ headline, body, image, imageAlt }`.   |
| `tone`     | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Passed to `<Section>`.                                 |
| `padding`  | `"sm" \| "md" \| "lg"`                               | no       | `"lg"`      | Passed to `<Section>`.                                 |

## Example

```astro
---
import StickyStory from "~/components/sections/StickyStory.astro";
import discoveryImg from "~/assets/story/discovery.jpg";
import designImg from "~/assets/story/design.jpg";
import buildImg from "~/assets/story/build.jpg";
---

<StickyStory
  eyebrow="Vorgehen"
  headline="Vom ersten Gespräch zum fertigen Produkt"
  chapters={[
    {
      headline: "Discovery",
      body: "Wir hören zu, bevor wir bauen. Eine Woche, in der wir verstehen, was wirklich zählt.",
      image: discoveryImg,
      imageAlt: "Skizzen auf Whiteboard",
    },
    {
      headline: "Design",
      body: "Aus Erkenntnissen werden Entscheidungen. Aus Entscheidungen Oberflächen.",
      image: designImg,
      imageAlt: "Designer am Laptop",
    },
    {
      headline: "Build",
      body: "Wir bauen iterativ, mit echten Nutzern, in echten Releases.",
      image: buildImg,
      imageAlt: "Entwickler an der Tastatur",
    },
  ]}
/>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **Sticky behavior is gated on `prefers-reduced-motion: no-preference`** _and_ `min-width: 768px`. Reduced-motion users get a normal stacked scroll. The observer also short-circuits in reduced-motion.
- **First chapter is forced `data-active="true"` at init** so the page doesn't start with every chapter dim. Don't add CSS that depends on no chapter being active on load.
- **Observer rootMargin is `-45% 0px -45% 0px`** — the active chapter is whichever media chapter is centered in the viewport. If you change chapter heights drastically (e.g., a chapter shorter than 50vh), expect jumpy activation.
- **Re-inits on `astro:page-load`** for ClientRouter compatibility — observers are re-attached after view transitions.
