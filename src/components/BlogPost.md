---
component: BlogPost
oneLiner: Full-page blog post renderer with dark hero, prose body, and back-link
status: stable
tags: [content]
---

## Purpose

Renders a complete blog post detail page. The component owns the hero section (dark background with optional blurred hero image, tags, title, date, author) and the content section (prose-typed article body rendered from the collection entry's markdown). It resolves the back-link to the blog index automatically via `page-registry`.

## When to use

Use exactly once per blog post route — as the primary page body in `src/pages/[...path].astro` when `props.collection === "blog"`. Do not use on listing pages; use `BlogCard` there.

## When NOT to use

Do not use inside another section or layout fragment. This component renders two full `<section>` elements and expects to be mounted directly in the page body.

## Props

| Prop    | Type                      | Required | Notes                                            |
| ------- | ------------------------- | -------- | ------------------------------------------------ |
| `entry` | `CollectionEntry<"blog">` | yes      | The blog collection entry to render.             |
| `lang`  | `Locale`                  | yes      | Drives i18n strings, date formatting, back-link. |

## Example

```astro
---
import BlogPost from "~/components/BlogPost.astro";
import type { Locale } from "~/i18n";
import type { CollectionEntry } from "astro:content";

const { entry, lang } = Astro.props as {
  entry: CollectionEntry<"blog">;
  lang: Locale;
};
---

<BlogPost {entry} {lang} />
```

## i18n keys

| Key                | DE                  | EN             |
| ------------------ | ------------------- | -------------- |
| `cta.backToBlog`   | Zurück zum Blog     | Back to Blog   |
| `blog.publishedAt` | Veröffentlicht am … | Published on … |
| `blog.author`      | Von …               | By …           |

## Gotchas

- **`blog-prose` stylesheet.** The component imports `~/styles/blog-prose.css` directly. That stylesheet scopes rich markdown typography (`blog-prose` class) — do not duplicate this import in the parent page.
- **Hero image is decorative.** When `heroImage` is present it renders as a full-bleed background at `opacity-15` with `alt=""`. The post title is the accessible heading; the image is purely atmospheric.
- **Hero image is optional.** When absent, the dark hero section still renders with a grid pattern and gradient — the page remains visually coherent.
- **`render()` is called internally.** The component awaits `render(entry)` to get `<Content />`. Do not pre-render the entry in the parent page.
- **Back-link uses `page-registry`.** `findPageByKey("blog-index")` must return a valid entry or the fallback `"blog"` slug is used.
