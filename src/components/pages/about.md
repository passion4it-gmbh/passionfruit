---
component: about
oneLiner: Renders the bilingual About page with hero, stats, values, team preview, and CTA
status: stable
tags: [page]
---

## Purpose

Renders the bilingual About page. Composes an inline dark hero (optional heroImage), a floating stats strip, a four-value grid, a full team preview using `TeamCard`, and a contact CTA section.

## When to use

On a site that has the `about` entry in `PAGES` (`src/lib/page-registry.ts`). Invoked by the catch-all route `src/pages/[...path].astro` — do not instantiate directly.

## When NOT to use

Do not use as a standalone component. For a compact team preview embedded in another page, render `TeamCard` entries inline instead of pulling in this full page template.

## Props

| Prop          | Type     | Required | Default | Notes                                                          |
| ------------- | -------- | -------- | ------- | -------------------------------------------------------------- |
| `lang`        | `Locale` | yes      | —       | Drives i18n strings, collection filtering, and alternate slug. |
| `currentSlug` | `string` | yes      | —       | Passed through to `BaseLayout` for the active nav link.        |

## Example

Composes:

- `<BaseLayout>` (headerVariant: "on-dark")
- Inline dark hero section with optional `<Image>` from `pages` collection `heroImage`
- Stats strip (glass card: 4 hardcoded stats with i18n labels)
- Values grid (4 icon+text cards, icons from `@lucide/astro`)
- `<TeamCard>` repeated for each locale-matching team member
- `<Button>` → team page CTA
- `<Button>` → contact page CTA

## i18n keys

| Key                                      | Notes                              |
| ---------------------------------------- | ---------------------------------- |
| `about.title`                            | Page `<title>` and SEO description |
| `about.description`                      | Meta description                   |
| `about.story.eyebrow`                    | Eyebrow label in hero              |
| `about.story.title`                      | Hero `<h1>`                        |
| `about.story.text`                       | Hero lead paragraph                |
| `about.values.eyebrow`                   | Values section eyebrow             |
| `about.values.title`                     | Values section heading             |
| `about.values.quality.title`             | First value card heading           |
| `about.values.quality.description`       | First value card body              |
| `about.values.transparency.title`        | Second value card heading          |
| `about.values.transparency.description`  | Second value card body             |
| `about.values.innovation.title`          | Third value card heading           |
| `about.values.innovation.description`    | Third value card body              |
| `about.values.accessibility.title`       | Fourth value card heading          |
| `about.values.accessibility.description` | Fourth value card body             |
| `about.stats.projects`                   | Stats strip label                  |
| `about.stats.satisfaction`               | Stats strip label                  |
| `about.stats.technologies`               | Stats strip label                  |
| `about.stats.languages`                  | Stats strip label                  |
| `team.title`                             | Team section eyebrow               |
| `team.description`                       | Team section heading               |
| `navigation.team`                        | Team CTA button label              |
| `home.ctaSection.title`                  | Contact CTA heading                |
| `home.ctaSection.subtitle`               | Contact CTA subtext                |
| `cta.contact`                            | Contact CTA button label           |

## Gotchas

- **`heroImage` is optional.** When absent, the hero fills the full column width. When present, a two-column grid splits text and image.
- **Team is queried at build time.** `getCollection("team")` is called inside the component — changes to team entries require a rebuild.
- **Stats values are hardcoded** (`50+`, `98%`, `12+`, `2`). Replace them in the component source, not via i18n.
- **Bilingual slug pair required.** Both `de` and `en` entries with `translationKey: "about"` must exist in `src/content/pages/`. Missing either causes a redirect to `/404` at the alternate-slug lookup.
- **`getAlternateCollectionSlug`** is called for the hreflang link. If the alternate locale page entry is missing, the alternate slug will be `undefined` and the hreflang tag will be absent.
