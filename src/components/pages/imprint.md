---
component: imprint
oneLiner: Renders the bilingual imprint (Impressum) page via LegalDocument
status: stable
tags: [page, legal]
---

## Purpose

Renders the bilingual imprint page. Fetches the `imprint` pages-collection entry for the current locale, renders its markdown body inside `LegalDocument`, and wires the hreflang alternate link.

## When to use

On any site — imprint is legally required in Germany and Austria for commercial web presence. Invoked by the catch-all route `src/pages/[...path].astro` via the `imprint` key in `PAGES`.

## When NOT to use

For privacy policy content, use `privacy` instead. For any other legal document (terms, AGB), create a new page component following the same `LegalDocument` pattern — do not extend this component.

## Props

| Prop          | Type     | Required | Default | Notes                                                   |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives collection lookup and hreflang alternate slug.   |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link. |

## Example

Composes:

- `<BaseLayout>` (no `headerVariant` — uses the default light header)
- `<LegalDocument title={entry.data.title} lang={lang}>` wrapping `<Content />`

Title and description are read from `entry.data`, not from i18n keys. `LegalDocument` renders the `<h1>`, optional last-updated timestamp, and the `blog-prose` markdown body.

## i18n keys

None. This page template itself makes no `t()` calls. The `legal.lastUpdated` key is consumed by `LegalDocument.astro` when `lastUpdated` is passed — see the `LegalDocument` docs in `src/components/CLAUDE.md`. Ensure both `de.json` and `en.json` carry that key.

## Gotchas

- **Page entry is required.** If no `pages` collection entry with `translationKey: "imprint"` exists for the locale, the component redirects to `/404`. Both DE and EN entries must exist.
- **No `heroImage` rendered.** Legal pages intentionally skip the image hero — `LegalDocument` provides no slot for it.
- **No `headerVariant="on-dark"`.** The imprint page uses the default (light) header; do not add a dark header variant without also adding hero markup to justify it.
- **Content lives in the collection, not i18n.** Update imprint text in `src/content/pages/{de,en}/imprint.md`, not in the i18n JSON files.
- **Alternate slug requires both locales.** `getAlternateCollectionSlug` is called for hreflang; the alternate entry must exist or the tag is silently absent.
