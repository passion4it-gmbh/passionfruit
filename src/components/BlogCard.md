---
component: BlogCard
oneLiner: Teaser card for a blog post used in list and grid layouts
status: stable
tags: [card]
---

## Purpose

Renders a clickable card for a single blog post. Displays an optional 16:10 hero image, publication date, up to two tag badges, the post title, description excerpt, and a "Read more" link. The entire card is a single `<a>` element, making it fully keyboard-navigable.

## When to use

Use on blog index pages and any context where multiple posts are shown in a grid or list. Pass one entry from `getCollection("blog")` filtered to the current locale.

## When NOT to use

For a single post full-page view, use `BlogPost` instead. For a featured/hero post at the top of the index, consider a bespoke layout rather than this card.

## Props

| Prop    | Type                      | Required | Notes                                                             |
| ------- | ------------------------- | -------- | ----------------------------------------------------------------- |
| `entry` | `CollectionEntry<"blog">` | yes      | Blog collection entry for the current locale.                     |
| `lang`  | `Locale`                  | yes      | Drives date formatting and the "Read more" / "Weiterlesen" label. |

## Example

```astro
---
import { getCollection } from "astro:content";
import BlogCard from "~/components/BlogCard.astro";

const lang = "en";
const posts = await getCollection("blog", ({ id }) =>
  id.startsWith(`${lang}/`),
);
---

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {posts.map((post) => <BlogCard entry={post} lang={lang} />)}
</div>
```

## i18n keys

The component does not call `useTranslations`. The "Read more" / "Weiterlesen" label is hardcoded via an inline `lang === "de"` check, not a `t()` call.

| Key              | Used for                                       |
| ---------------- | ---------------------------------------------- |
| _(none via `t`)_ | Date formatting uses `formatDate(date, lang)`. |

## Gotchas

- **Hero image is optional.** When `entry.data.heroImage` is absent the image slot is skipped entirely — the card still renders cleanly without it.
- **Only the first two tags are shown.** Tags beyond index 1 are silently truncated (`tags.slice(0, 2)`).
- **Alt text equals the post title.** The `<Image>` component inherits `alt={entry.data.title}`, which satisfies the `jsx-a11y/alt-text` ESLint rule. Keep post titles meaningful.
- **Link resolution uses `page-registry`.** The href is built from `findPageByKey("blog-index")` + the locale-stripped entry slug. If the `blog-index` page key is missing the fallback is `"blog"`.
