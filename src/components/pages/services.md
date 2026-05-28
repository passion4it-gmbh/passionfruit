---
component: services
oneLiner: Renders the bilingual services page with icon-driven service cards and a CTA
status: stable
tags: [page]
---

## Purpose

Renders the bilingual services page. Composes a dark hero (optional heroImage), three alternating two-column service sections (icon, heading, description, feature checklist, placeholder graphic), and a dark CTA strip pointing to the contact page.

## When to use

On a site that has the `services` entry in `PAGES` (`src/lib/page-registry.ts`). Invoked by the catch-all route `src/pages/[...path].astro` — do not instantiate directly.

## When NOT to use

For a single service detail page, create a new page component — this template is a summary index of all services. Do not use this page if the business offers only one service; a single landing section on the home page is cleaner.

## Props

| Prop          | Type     | Required | Default | Notes                                                   |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives i18n strings, feature lists, and alternate slug. |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link. |

## Example

Composes:

- `<BaseLayout>` (headerVariant: "on-dark")
- Dark hero with optional `<Image>` from the `pages` collection `heroImage`
- Three alternating service rows (inline, no sub-component): Palette / Code / Lightbulb icons from `@lucide/astro`, feature checklists with `<CheckCircle>` icons
- Dark CTA strip with `<Button>` → contact page

Service titles, descriptions, and feature bullet lists are hardcoded in the component (with inline `lang === "de"` branching for features). Titles and descriptions use i18n keys; feature strings are hardcoded per locale.

## i18n keys

| Key                                | Notes                                  |
| ---------------------------------- | -------------------------------------- |
| `services.title`                   | Page `<title>`, hero heading, SEO meta |
| `services.description`             | Meta description, hero lead            |
| `services.webDesign.title`         | First service section heading          |
| `services.webDesign.description`   | First service section body             |
| `services.development.title`       | Second service section heading         |
| `services.development.description` | Second service section body            |
| `services.consulting.title`        | Third service section heading          |
| `services.consulting.description`  | Third service section body             |
| `home.ctaSection.title`            | CTA strip heading (shared with Home)   |
| `home.ctaSection.subtitle`         | CTA strip subtext (shared with Home)   |
| `cta.contact`                      | CTA button label                       |
| `site.name`                        | Hero eyebrow label                     |

## Gotchas

- **`heroImage` is optional.** Sourced from the `pages` collection entry with `translationKey: "services"`. When absent, the hero is single-column text. When present, a two-column grid is used.
- **Service features are hardcoded.** The four bullet points under each service are inline arrays with `lang === "de"` branching — not i18n keys. To customize them, edit the component source directly.
- **Three services are hardcoded.** Adding or removing services requires editing the `services` array in the component — there is no CMS-driven service collection.
- **CTA heading reuses `home.ctaSection.*` keys.** This is intentional — the same copy is acceptable here. If services need a distinct CTA message, add new i18n keys and update both `de.json` and `en.json`.
- **Bilingual page entry optional.** Unlike `contact` and legal pages, this template does not redirect on a missing page entry — the `heroImage` lookup just returns `undefined`. A missing entry is non-fatal.
