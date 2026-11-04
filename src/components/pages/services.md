---
component: services
oneLiner: Bilingual services page with dark hero, numbered FeatureList, and CTA band
status: stable
tags: [page]
---

## Purpose

Renders the bilingual services page: a dark `AsymmetricHero` (optional heroImage from the `pages` collection), the services as a numbered `FeatureList`, and a `CtaBand` pointing to the contact page.

## When to use

On a site that has the `services` entry in `PAGES` (`src/lib/page-registry.ts`). Invoked by the catch-all route `src/pages/[...path].astro` — do not instantiate directly.

## When NOT to use

For a single service detail page, create a new page component — this template is a summary index of all services. Do not use this page if the business offers only one service; a single landing section on the home page is cleaner.

## Props

| Prop          | Type     | Required | Default | Notes                                                       |
| ------------- | -------- | -------- | ------- | ----------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives i18n strings, the services list, and alternate slug. |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link.     |

## Example

Composes:

- `<BaseLayout>` (headerVariant: "on-dark")
- `<AsymmetricHero tone="dark">` — text-only, or image-right when the `pages` entry has a `heroImage`
- `<FeatureList>` fed by `getServices(lang)` from `src/data/services.ts`
- `<CtaBand>` → contact page

## i18n keys

| Key                        | Notes                                   |
| -------------------------- | --------------------------------------- |
| `services.title`           | Page `<title>`, hero headline           |
| `services.description`     | Meta description, hero lede             |
| `home.features.title`      | FeatureList headline (shared with Home) |
| `home.ctaSection.title`    | CTA band headline (shared with Home)    |
| `home.ctaSection.subtitle` | CTA band lede (shared with Home)        |
| `cta.contact`              | CTA button label                        |

## Gotchas

- **`heroImage` is optional.** Sourced from the `pages` collection entry with `translationKey: "services"`. Without it the hero is text-only (headline left, lede right).
- **Services live in `src/data/services.ts`**, per locale, as `FeatureListItem`s (`title`, `body`, `bullets`). Add, remove or reword services there — the home page teaser reads the same list.
- **CTA heading reuses `home.ctaSection.*` keys.** This is intentional — the same copy is acceptable here. If services need a distinct CTA message, add new i18n keys and update both `de.json` and `en.json`.
- **Bilingual page entry optional.** Unlike `contact` and legal pages, this template does not redirect on a missing page entry — the `heroImage` lookup just returns `undefined`. A missing entry is non-fatal.
