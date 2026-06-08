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

The form uses one of three delivery tiers, selected by `PUBLIC_FORM_ENDPOINT` at build time:

1. **Unset (default)** — submission opens a pre-filled `mailto:` in the visitor's mail client. Zero config.
2. **`/api/contact`** — POSTs to the bundled Cloudflare Pages Function (`functions/api/contact.ts`), which validates the payload, verifies a Turnstile token (when `PUBLIC_TURNSTILE_SITE_KEY` is set), and delivers via Brevo transactional email.
3. **Any other URL** — POSTs `{ name, email, message, honeypot, turnstileToken }` JSON to that URL; use for BYO external form services. You must add the endpoint's host to the `connect-src` directive in `public/_headers`, or the browser will silently block the fetch.

Note: `contact.info.email` (the i18n key) is the address **displayed** in the contact-info sidebar and used for the mailto fallback link. `CONTACT_RECIPIENT` (a Cloudflare Pages secret) is where Brevo **delivers** mail in the function tier — these are independent.

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
- **Three delivery tiers — see the Example section.** The active tier is determined at build time by `PUBLIC_FORM_ENDPOINT`. For Tier 3 (any external URL), add the endpoint's host to `connect-src` in `public/_headers` — the browser blocks cross-origin fetches that aren't in the allowlist.
- **Spam protection (function tier only).** A hidden honeypot field is always present. When `PUBLIC_TURNSTILE_SITE_KEY` is set, Cloudflare Turnstile loads from `challenges.cloudflare.com` and the token is verified server-side before delivery. Set `PUBLIC_TURNSTILE_SITE_KEY` to an empty string to disable Turnstile (honeypot still active).
- **Displayed email ≠ delivery recipient.** `contact.info.email` (in `de.json` / `en.json`) is what visitors see and what the mailto link uses. `CONTACT_RECIPIENT` (a Cloudflare Pages secret, never a `PUBLIC_*` var) is where Brevo sends mail in the function tier.
- **Privacy notice.** The form collects name, email, and message only. No data is stored server-side; it is forwarded immediately via Brevo and discarded.
- **Form i18n strings are injected as `data-*` attributes.** This lets the inline `<script>` (which runs in the browser) access translated strings without re-exporting them.
- **Alternate slug requires both locales.** `getAlternateCollectionSlug` is called; if the alternate-locale entry is missing the hreflang link is absent.
