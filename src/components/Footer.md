---
component: Footer
oneLiner: Dark-surface site footer with nav, legal links, and copyright
status: stable
tags: [layout]
---

## Purpose

Renders the persistent bottom section of every page: a three-column grid (brand + tagline, main nav links, legal links), a bottom bar with the copyright year and the passionfruit attribution. Always dark-surface (`bg-surface-dark text-text-on-dark`).

## When to use

Include once in every page layout, after the page `<main>` and before `</body>`. Pair with `Header` — both receive the same `lang` prop from the parent layout.

## When NOT to use

- Do not suppress the Footer on landing pages just to save space. If you must hide it, wrap in a conditional in the layout rather than deleting it.
- Do not embed Footer inside page components; it belongs in the shared layout only.

## Props

| Prop   | Type     | Required | Default | Notes                                    |
| ------ | -------- | -------- | ------- | ---------------------------------------- |
| `lang` | `Locale` | yes      | —       | Drives link paths and translated labels. |

## Example

```astro
---
import Footer from "~/components/Footer.astro";
---

<Footer lang={lang} />
```

## i18n keys

| Key                   | DE                                       | EN                             |
| --------------------- | ---------------------------------------- | ------------------------------ |
| `navigation.home`     | Startseite                               | Home                           |
| `navigation.about`    | Über uns                                 | About                          |
| `navigation.services` | Leistungen                               | Services                       |
| `navigation.blog`     | Blog                                     | Blog                           |
| `navigation.team`     | Team                                     | Team                           |
| `navigation.contact`  | Kontakt                                  | Contact                        |
| `footer.privacy`      | Datenschutz                              | Privacy Policy                 |
| `footer.imprint`      | Impressum                                | Imprint                        |
| `footer.copyright`    | © {year} Greenleaf Digital. Alle Rechte… | © {year} Greenleaf Digital…    |
| `footer.builtWith`    | Erstellt mit passionfruit                | Built with passionfruit        |
| `site.tagline`        | Digitale Lösungen mit Leidenschaft       | Digital solutions with passion |

Nav links (`navLinks`) and legal links (`legalLinks`) are built inline in the component frontmatter from `getLocalizedPath` + `t()`. Localized legal slugs: `datenschutz` ↔ `privacy`, `impressum` ↔ `imprint`. These must stay in sync with `src/lib/page-registry.ts`.

## Gotchas

- **Social links are a placeholder.** The brand column has a `<!-- TODO: Add social links -->` comment. Fill these in during `/onboard` — they are not driven by i18n or props.
- **Copyright year is dynamic.** `currentYear` is derived from `new Date().getFullYear()` at build time, not at request time. For a static site this is fine; for on-demand rendering it would need to be runtime-resolved.
- **`footer.builtWith` split.** The component splits `t('footer.builtWith')` on the word `"passionfruit"` to wrap the word in an `<a>`. The i18n string must contain exactly one occurrence of `passionfruit` or the split will break.
- **No slots.** Footer renders no `<slot />`. For a newsletter section or cookie reset button, add a component above `<Footer />` in the layout.
- **Case Studies absent from footer nav.** The footer `navLinks` array omits the case-studies page (present in `Header`). If you add it, update both arrays consistently.
