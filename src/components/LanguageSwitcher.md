---
component: LanguageSwitcher
oneLiner: DE/EN toggle that resolves cross-locale slugs via page-registry lookup
status: stable
tags: [i18n]
---

## Purpose

Renders a `DE / EN` pill that links the current page to its counterpart in the other locale. Uses `getAlternateLocaleSlug` from `page-registry` to find the correct translated slug, falling back to the locale root (`/` or `/en/`) when no registered alternate is found.

## When to use

- In the site header on every page to let users switch locale.
- Anywhere locale switching is meaningful — detail pages (blog post, team member, career) should resolve to their translated sibling, not just the home page.

## When NOT to use

- On a single-locale site — passionfruit is always bilingual (DE + EN); never remove one locale or invent a third without extending the i18n system.
- As a standalone dropdown for more than two locales — the component is hardcoded to DE/EN. A multi-locale dropdown requires a different implementation.
- Inside dark backgrounds without adjusting text colors — the component uses `text-text` and `text-accent` which are light-surface tokens; wrap with appropriate overrides or extend the component.

## Props

| Prop            | Type     | Required | Default | Notes                                                                                                                                                                                                    |
| --------------- | -------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lang`          | `Locale` | yes      | —       | The current page's locale (`"de"` or `"en"`). Determines which label gets the active accent style.                                                                                                       |
| `currentSlug`   | `string` | no       | —       | The current page's slug (without locale prefix). Used to build the self-referencing href for the active locale. When omitted, links the active label to the locale root.                                 |
| `alternateSlug` | `string` | no       | —       | Explicit override for the other locale's slug. Use when the page's alternate slug differs from the registry lookup (e.g., dynamic collection entries). When omitted, `getAlternateLocaleSlug` is called. |

## Example

```astro
---
import LanguageSwitcher from "~/components/LanguageSwitcher.astro";
import type { Locale } from "~/i18n";

const lang = (Astro.params.lang as Locale) ?? "de";
const currentSlug = "leistungen"; // DE slug for this page
---

<!-- In a page header -->
<LanguageSwitcher lang={lang} currentSlug={currentSlug} />

<!-- For a blog post detail page, pass the alternate slug explicitly -->
<LanguageSwitcher
  lang={lang}
  currentSlug={entry.slug}
  alternateSlug={alternateEntry?.slug}
/>
```

## i18n keys

None — label text (`DE` / `EN`) and `aria-label` (`"Deutsch"` / `"English"`) are hardcoded in the component. These are stable language codes, not translatable UI copy, so the translation system adds no value here.

## Gotchas

- **`aria-current="page"`** is set on the active locale's `<a>`. Both labels are always real links (not a `<span>` for the active one) — screen readers rely on `aria-current` to identify the current language.
- **Fallback to locale root.** When `currentSlug` is omitted or `getAlternateLocaleSlug` returns nothing, the alternate link falls back to `getLocalizedPath("", otherLang)` — i.e., `/en/` or `/`. This is correct for pages not registered in `page-registry.ts`; register the page if a proper alternate is needed.
- **`getAlternateLocaleSlug` looks up `page-registry.ts` only.** Collection entries (blog posts, team members, etc.) are not in the registry. For these pages, resolve the alternate entry's slug at the page level and pass it as `alternateSlug`.
- **No third locale.** Adding a new locale requires changes to `~/i18n`, `page-registry.ts`, and this component's `otherLang` logic.
