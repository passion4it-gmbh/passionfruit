---
component: home
oneLiner: Bilingual home page composed from section archetypes and live collection teasers
status: stable
tags: [page]
---

## Purpose

Renders the home page for either locale. It is the template's showcase: a dark image hero, the services as a `FeatureList`, a featured testimonial as an `EditorialQuote`, the newest case studies and blog posts pulled from their collections, the FAQ, and a closing `CtaBand`. Every block hides itself when its data is empty, so a fresh site never shows a broken section.

## When to use

Only from `src/pages/index.astro` (DE) and `src/pages/en/index.astro` (EN), which are one-line wrappers passing `lang`.

## When NOT to use

Don't copy it into other pages — compose those from the same archetypes directly. Don't add page-level `<script>`s for animations; entrances come from `<Motion>`.

## Props

| Prop   | Type     | Required | Default | Notes                              |
| ------ | -------- | -------- | ------- | ---------------------------------- |
| `lang` | `Locale` | yes      | —       | Selects strings, data and entries. |

## Example

```astro
---
import Home from "~/components/pages/home.astro";
---

<Home lang="de" />
```

Composes, top to bottom:

- `<AsymmetricHero tone="dark">` with `src/assets/home/hero.png`, primary CTA → contact, secondary → services. The headline's last word gets `.gradient-text` via the `headline` slot.
- `<FeatureList>` from `getServices(lang)` (`src/data/services.ts`), ghost CTA → services
- `<EditorialQuote tone="dark">` with the first entry of `getTestimonials(lang)` (`src/data/testimonials.ts`)
- Case studies: newest 3 by `publishedAt`, `<CaseStudyCard>` grid, link → case-studies index
- Blog: newest 2 posts, header column + two `<BlogCard>`s, link → blog index
- `<FAQ>` from `getFAQs(lang)` (`src/data/faqs.ts`)
- `<CtaBand>` → contact

## i18n keys

| Key                                                            | Notes                                   |
| -------------------------------------------------------------- | --------------------------------------- |
| `site.name`, `site.description`                                | `<title>` and meta description          |
| `home.hero.headline` / `subheadline` / `cta`                   | Hero; last headline word is highlighted |
| `services.title`                                               | Services eyebrow + secondary hero CTA   |
| `home.features.title` / `subtitle` / `cta`                     | FeatureList header and link             |
| `caseStudies.title`, `home.work.title` / `cta`                 | Case studies header and link            |
| `blog.title`, `blog.description`, `home.journal.title` / `cta` | Blog header and link                    |
| `home.faq.title`                                               | FAQ headline                            |
| `home.ctaSection.title` / `subtitle` / `cta`                   | Closing CTA band                        |

## Gotchas

- **Only the first testimonial is shown.** The quote is display-sized on purpose; order `src/data/testimonials.ts` with the strongest quote first. Empty the array to drop the section.
- **The highlighted word is always the last word** of `home.hero.headline`. Phrase the headline so its last word is the one worth emphasising.
- **Hero image alt is empty** — the passionfruit is mood, not information. Give it real alt text if a replacement image carries meaning.
