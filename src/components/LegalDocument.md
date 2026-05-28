---
component: LegalDocument
oneLiner: Legal page wrapper with title, optional last-updated date, and prose slot
status: stable
tags: [content, legal]
---

## Purpose

Reusable wrapper for legal pages (imprint, privacy policy, future terms/AGB). Renders a constrained-width prose container with the page `<h1>`, an optional locale-formatted last-updated timestamp, and a slot for the markdown body. Uses `blog-prose` typography. Handles its own section padding and container — the parent page only needs to pass the entry's `<Content />` into the default slot.

## When to use

Use in `src/components/pages/` page components backed by the `pages` collection that represent legal documents. Wire `entry.data.title`, `lang`, and `lastUpdated` from the page component, then pass `<Content />` into the slot.

## When NOT to use

Do not use for non-legal content pages — use `PageContent` instead (simpler, hero-image-capable). Do not use for blog posts — use `BlogPost`.

## Props

| Prop          | Type     | Required | Default | Notes                                                                          |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------------------------------ |
| `title`       | `string` | yes      | —       | Rendered as the page `<h1>`.                                                   |
| `lang`        | `Locale` | yes      | —       | Drives locale-aware date formatting; label text from `t("legal.lastUpdated")`. |
| `lastUpdated` | `Date`   | no       | —       | When provided, renders a formatted timestamp below the heading.                |
| `class`       | `string` | no       | —       | Extra classes appended to the outer `<section>`.                               |

Slot: the default slot receives the markdown `<Content />` from the page collection entry.

## Example

```astro
---
import { getCollection, render } from "astro:content";
import LegalDocument from "~/components/LegalDocument.astro";

const lang = "en";
const entries = await getCollection(
  "pages",
  ({ id }) => id === `${lang}/imprint`,
);
const entry = entries[0]!;
const { Content } = await render(entry);
---

<LegalDocument
  title={entry.data.title}
  lang={lang}
  lastUpdated={new Date("2025-01-01")}
>
  <Content />
</LegalDocument>
```

## i18n keys

| Key                 | DE                    | EN            |
| ------------------- | --------------------- | ------------- |
| `legal.lastUpdated` | Zuletzt aktualisiert: | Last updated: |

## Gotchas

- **`blog-prose` stylesheet.** The component imports `~/styles/blog-prose.css` directly. Do not re-import in the parent page.
- **Section padding is built in.** The component renders `<section class="py-20 md:py-28">` with a `container` inside. Do not add additional section/container wrappers at the page level.
- **`lastUpdated` uses `formatDate`, not `toLocaleDateString`.** The locale-aware `formatDate(date, lang)` function handles both DE and EN formatting. Always pass a `Date` object, not a pre-formatted string.
- **Adding a new legal page.** Create `src/content/pages/{de,en}/<slug>.md` with matching `translationKey`, wire a page component in `src/components/pages/`, and add the route to `src/lib/page-registry.ts`. The `legal.lastUpdated` i18n key is already in both `de.json` and `en.json`.
- **Slot is the caller's responsibility.** The component renders `<slot />` inside the prose article. You must pass `<Content />` from `render(entry)` — the component does not call `render()` internally.
