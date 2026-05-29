---
component: Header
oneLiner: Sticky site header with locale-aware nav and mobile menu
status: stable
tags: [layout]
---

## Purpose

Renders the persistent top bar of every page: the site logo, a horizontal desktop nav, a `LanguageSwitcher`, and a collapsible mobile hamburger menu. Handles scroll-aware background for the `on-dark` variant (transparent at top, `bg-surface-dark/80` after 80 px of scroll).

## When to use

Include once in every page layout, directly inside the `<body>` or a root layout component before the page `<main>`. Pass `currentSlug` and `alternateSlug` from the page's `getStaticPaths` entry so the `LanguageSwitcher` can produce the correct cross-locale link.

## When NOT to use

- Do not render `Header` inside individual page components — it belongs in the shared layout only.
- Do not pass `variant="on-dark"` on light-background pages; the transparent-to-dark scroll transition looks wrong against a light surface.

## Props

| Prop            | Type                      | Required | Default      | Notes                                                                                  |
| --------------- | ------------------------- | -------- | ------------ | -------------------------------------------------------------------------------------- |
| `lang`          | `Locale`                  | yes      | —            | Drives nav link paths and `LanguageSwitcher`.                                          |
| `currentSlug`   | `string`                  | no       | `undefined`  | Slug of the current page within its locale; used for active state.                     |
| `alternateSlug` | `string`                  | no       | `undefined`  | Slug of the equivalent page in the other locale.                                       |
| `variant`       | `"on-dark" \| "on-light"` | no       | `"on-light"` | Controls logo, link, and hamburger colours. Use `on-dark` for hero-over-image layouts. |

## Example

```astro
---
import Header from "~/components/Header.astro";
---

<!-- Light page -->
<Header lang={lang} currentSlug="blog" alternateSlug="blog" />

<!-- Dark hero page — header starts transparent, fills in on scroll -->
<Header lang={lang} currentSlug="" alternateSlug="" variant="on-dark" />
```

## i18n keys

| Key                      | DE         | EN           |
| ------------------------ | ---------- | ------------ |
| `navigation.home`        | Startseite | Home         |
| `navigation.about`       | Über uns   | About        |
| `navigation.services`    | Leistungen | Services     |
| `navigation.blog`        | Blog       | Blog         |
| `navigation.caseStudies` | Referenzen | Case Studies |
| `navigation.team`        | Team       | Team         |
| `navigation.contact`     | Kontakt    | Contact      |

Nav links are hardcoded as `navItems` in the component frontmatter. Localized slugs (`ueber-uns` ↔ `about`, `leistungen` ↔ `services`, etc.) are defined inline via `lang === "de"` ternaries — `page-registry.ts` is not imported; the two must be kept in sync manually.

## Gotchas

- **Nav data source.** Nav items are a static array inside `Header.astro`, not derived from `page-registry.ts`. If you add or rename a page, update both `page-registry.ts` and the `navItems` array.
- **Mobile menu JS.** The mobile toggle is driven by an inline `<script>` that re-initialises on `astro:after-swap`. If you add a second `Header` to a page the script will wire up duplicate listeners.
- **Scroll transition scope.** The scroll-aware bg swap only activates when `variant="on-dark"` (detected via the presence of `bg-transparent` on the element). On `on-light` pages the header remains `bg-surface/80` regardless of scroll position.
- **Keyboard.** Pressing `Escape` while the mobile menu is open closes it and returns focus to the toggle button.
- **No slots.** Header renders no `<slot />`. Extra content (e.g., banners) belongs above or below the `<Header />` call in the layout.
