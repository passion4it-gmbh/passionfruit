---
component: privacy
oneLiner: Renders the bilingual privacy policy page via LegalDocument
status: stable
tags: [page, legal]
---

## Purpose

Renders the bilingual privacy policy page. Fetches the `privacy` pages-collection entry for the current locale, renders its markdown body inside `LegalDocument`, and wires the hreflang alternate link.

## When to use

On any site that processes personal data — this page is legally required under GDPR. Invoked by the catch-all route `src/pages/[...path].astro` via the `privacy` key in `PAGES`.

## When NOT to use

For imprint (Impressum) content, use `imprint` instead. For terms of service or cookie policy, create a new page component following the same `LegalDocument` pattern — do not extend this component.

## Props

| Prop          | Type     | Required | Default | Notes                                                   |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives collection lookup and hreflang alternate slug.   |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link. |

## Example

Composes:

- `<BaseLayout>` (no `headerVariant` — uses the default light header)
- `<LegalDocument title={entry.data.title} lang={lang}>` wrapping `<Content />`

Structurally identical to `imprint` — only the `translationKey` lookup (`"privacy"` vs `"imprint"`) and the content differ.

## i18n keys

None. This page template itself makes no `t()` calls. The `legal.lastUpdated` key is consumed by `LegalDocument.astro` when `lastUpdated` is passed — see the `LegalDocument` docs in `src/components/CLAUDE.md`. Ensure both `de.json` and `en.json` carry that key.

## Gotchas

- **Page entry is required.** If no `pages` collection entry with `translationKey: "privacy"` exists for the locale, the component redirects to `/404`. Both DE and EN entries must exist.
- **No `heroImage` rendered.** Legal pages intentionally skip the image hero.
- **No `headerVariant="on-dark"`.** Privacy uses the default light header, consistent with `imprint`.
- **Content lives in the collection, not i18n.** Update privacy policy text in `src/content/pages/{de,en}/privacy.md`, not in the i18n JSON files.
- **GDPR compliance is your responsibility.** The template ships placeholder privacy text; downstream users must replace it with an actual legal review before going live.
- **Alternate slug requires both locales.** `getAlternateCollectionSlug` is called for hreflang; the alternate entry must exist or the tag is silently absent.
