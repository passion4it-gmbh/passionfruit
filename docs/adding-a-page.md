# Adding a New Page

This guide walks through adding a new static page to your passionfruit site.

---

## 1. Create the page component

Create `src/components/pages/<key>.astro`. Use an existing page as a reference.

```astro
---
import BaseLayout from "~/layouts/BaseLayout.astro";
import { useTranslations, type Locale } from "~/i18n";

interface Props {
  lang: Locale;
  currentSlug: string;
}

const { lang, currentSlug } = Astro.props;
const { t } = useTranslations(lang);
---

<BaseLayout
  title={t("mypage.title")}
  description={t("mypage.description")}
  lang={lang}
  currentSlug={currentSlug}
>
  <section class="mx-auto max-w-3xl px-6 py-24">
    <h1 class="text-4xl font-bold">{t("mypage.heading")}</h1>
    <p class="mt-4">{t("mypage.intro")}</p>
  </section>
</BaseLayout>
```

## 2. Register the page

Add an entry to the `PAGES` array in `src/lib/page-registry.ts`:

```ts
{
  key: 'mypage' as const,
  slug: { de: 'meine-seite', en: 'my-page' },
  component: () => import('~/components/pages/mypage.astro'),
},
```

Update the `PageKey` type union at the top of the same file to include `'mypage'`.

## 3. Add navigation links

If the page should appear in the site navigation, add it to:

- `src/components/Header.astro` — main nav
- `src/components/Footer.astro` — footer nav

Use the existing entries as a pattern.

## 4. Add i18n keys

Add translation keys in both locale files:

**`src/i18n/de.json`**

```json
"mypage": {
  "title": "Meine Seite — Firmenname",
  "description": "Kurzbeschreibung fuer Meta-Tags",
  "heading": "Meine Seite",
  "intro": "Willkommen auf der neuen Seite."
}
```

**`src/i18n/en.json`**

```json
"mypage": {
  "title": "My Page — Company Name",
  "description": "Short description for meta tags",
  "heading": "My Page",
  "intro": "Welcome to the new page."
}
```

## 5. Add collection content (optional)

If the page displays dynamic content (like blog posts or team members), create
collection entries in `src/content/<collection>/{de,en}/`. Each entry needs a
`translationKey` field that matches across both locales.

## 6. Verify

```bash
pnpm build
```

This runs the linter, type checker, bilingual check, and Astro build.
If everything passes, your page is ready.
