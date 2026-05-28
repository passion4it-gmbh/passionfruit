---
component: PageContent
oneLiner: Generic pages-collection renderer with optional hero image and prose layout
status: stable
tags: [content]
---

## Purpose

Renders the body of a generic pages collection entry. Displays an optional hero image (full-width, 288px tall, rounded), the page title as an `<h1>`, and the markdown body in a `blog-prose` article constrained to `max-w-3xl`. Used for pages that are pure content — no custom sections or interactive elements.

## When to use

Use in `src/components/pages/` page components that are backed by the `pages` collection and need only a title + markdown body with no custom layout. Wire the entry from `getCollection("pages")` in the catch-all route.

## When NOT to use

Do not use for blog posts — use `BlogPost` instead (it has its own dark hero and back-link). Do not use for legal pages — use `LegalDocument` instead (it has a `lastUpdated` timestamp and different padding). Do not use when the page needs custom sections beyond a single prose block.

## Props

| Prop    | Type                       | Required | Notes                                                              |
| ------- | -------------------------- | -------- | ------------------------------------------------------------------ |
| `entry` | `CollectionEntry<"pages">` | yes      | Pages collection entry for the current locale.                     |
| `lang`  | `Locale`                   | yes      | Required by the component interface; currently not used for `t()`. |

## Example

```astro
---
import PageContent from "~/components/PageContent.astro";
import type { Locale } from "~/i18n";
import type { CollectionEntry } from "astro:content";

const { entry, lang } = Astro.props as {
  entry: CollectionEntry<"pages">;
  lang: Locale;
};
---

<PageContent {entry} {lang} />
```

## i18n keys

None. The component reads `entry.data.title` and renders the markdown body via `<Content />`. It does not call `useTranslations` or `t()`.

## Gotchas

- **`blog-prose` stylesheet.** The component imports `~/styles/blog-prose.css` directly. Do not re-import in the parent page.
- **`render()` is called internally.** Do not pre-render the entry in the parent page.
- **Hero image is optional.** When `entry.data.heroImage` is absent the image slot is skipped. Alt text is `entry.data.title`.
- **The container and section padding are built in.** The root element is `<div class="container section">`. Do not wrap in another container.
- **`lang` is declared in `Props` but not used in template logic.** Kept for interface consistency and future-proofing.
- **Not suitable for pages with custom layouts.** If a page needs hero sections, CTAs, or other components beyond the title and body, build a dedicated page component in `src/components/pages/` rather than using `PageContent`.
