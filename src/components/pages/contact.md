---
component: contact
oneLiner: Renders the bilingual contact page with a prose sidebar and an async form
status: stable
tags: [page]
---

## Purpose

Renders the bilingual contact page. Fetches the `contact` pages-collection entry for the current locale, renders its markdown body alongside a structured contact-info sidebar (email, phone, address), and an accessible async contact form with a mailto fallback.

## When to use

On a site that has the `contact` entry in `PAGES` (`src/lib/page-registry.ts`). Invoked by the catch-all route `src/pages/[...path].astro` — do not instantiate directly.

## When NOT to use

Do not use for a plain "get in touch" paragraph embedded in another page — use a `<Button>` pointing at the contact page. Do not use if you only need an email link; a `mailto:` anchor suffices for that.

## Props

| Prop          | Type     | Required | Default | Notes                                                       |
| ------------- | -------- | -------- | ------- | ----------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives i18n strings, collection lookup, and alternate slug. |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link.     |

## Example

Composes:

- `<BaseLayout>` (headerVariant: "on-dark")
- Dark hero with optional `<Image>` from the `pages` collection `heroImage`; hero heading and lead paragraph come from `entry.data.title` / `entry.data.description`, while `<BaseLayout>` receives its SEO `title` and meta `description` from `t("contact.title")` / `t("contact.description")`
- Two-column content section: prose `<Content />` + contact-info links (Mail, Phone, MapPin icons) left; async `<form>` card right
- `<Button type="submit">` with Send icon

The form submits to `PUBLIC_FORM_ENDPOINT` when set; falls back to a `mailto:` redirect when the env var is absent.

## i18n keys

| Key                    | Notes                                            |
| ---------------------- | ------------------------------------------------ |
| `contact.title`        | `<BaseLayout>` title and SEO meta                |
| `contact.description`  | `<BaseLayout>` meta description                  |
| `contact.info.email`   | Displayed email address and `mailto:` href       |
| `contact.info.phone`   | Displayed phone number and `tel:` href           |
| `contact.info.address` | Displayed address string                         |
| `contact.form.name`    | Name field label                                 |
| `contact.form.email`   | Email field label                                |
| `contact.form.message` | Message field label                              |
| `contact.form.send`    | Submit button default label                      |
| `contact.form.sending` | Submit button label while the fetch is in flight |
| `contact.form.success` | Success message shown after submission           |
| `contact.form.error`   | Error message shown on failed submission         |
| `site.name`            | Hero eyebrow label                               |

## Gotchas

- **Page entry is required.** If no `pages` collection entry with `translationKey: "contact"` exists for the locale, the component redirects to `/404`. Both DE and EN entries must be present.
- **`heroImage` is optional.** When absent, the hero is single-column. When present, a two-column grid splits text and image. Hero heading and lead paragraph come from `entry.data.title` / `entry.data.description`; SEO title and meta description come from `t("contact.title")` / `t("contact.description")` via `<BaseLayout>`.
- **`PUBLIC_FORM_ENDPOINT` is opt-in.** Without it, form submission opens a pre-filled `mailto:` in the user's mail client. Set the env var to any endpoint that accepts `{ name, email, message }` JSON via `POST`.
- **Form i18n strings are injected as `data-*` attributes.** This lets the inline `<script>` (which runs in the browser) access translated strings without re-exporting them.
- **Alternate slug requires both locales.** `getAlternateCollectionSlug` is called; if the alternate-locale entry is missing the hreflang link is absent.
