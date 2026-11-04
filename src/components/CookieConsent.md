---
component: CookieConsent
oneLiner: GDPR cookie consent banner (vanilla-cookieconsent) with DE/EN translations
status: stable
tags: [consent]
---

## Purpose

Renders the `vanilla-cookieconsent` banner and preferences modal. Dispatches `passionfruit:consent-changed` events that all analytics components listen to. Exposes `window.hasAnalyticsConsent()` as the synchronous consent check gate used by `GoogleAnalytics`, `GTMAnalytics`, and `PostHogAnalytics`.

## When to use

- Once, in the shared layout, on every page of the site.
- Whenever any analytics component is present — without `CookieConsent`, the analytics components have no consent signal and never load.

## When NOT to use

- More than once per page — `CookieConsent.run()` is called globally; a second instantiation will conflict.
- On a site with no analytics or third-party scripts — the banner is unnecessary overhead if no consent-gated content exists.

## Props

| Prop   | Type     | Required | Default | Notes                                                                                                                        |
| ------ | -------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `lang` | `string` | yes      | —       | Current page locale. Used to auto-detect the banner language. Accepts `"de"` or `"en"` — unknown values fall back to `"en"`. |

## Example

```astro
---
// In your shared layout, e.g. src/layouts/BaseLayout.astro
import CookieConsent from "~/components/CookieConsent.astro";
---

<html lang={lang}>
  <head></head>
  ...
  <body>
    <slot />
    <CookieConsent lang={lang} />
  </body>
</html>
```

## i18n keys

None — banner copy is hardcoded inside the component in both DE and EN. It does not use `useTranslations`. To change banner text, edit the `translations` object inside `CookieConsent.astro`.

## Gotchas

- **Two consent categories only:** `necessary` (always on, read-only) and `analytics`. There is no marketing/advertising category — ad consent signals in GA4/GTM are permanently denied.
- **Auto-detects locale from `document.documentElement.lang`.** Pass the correct `lang` attribute on `<html>` — the component ignores its own `lang` prop at runtime and reads the DOM attribute instead, on load and again after each `ClientRouter` navigation, so switching language translates the banner. The prop exists only for SSR consistency.
- **`window.__cookieConsentReady` flag.** Set to `true` after `CookieConsent.run()` completes. `window.hasAnalyticsConsent()` returns `false` until this flag is set, preventing a race where analytics runs before consent state is loaded.
- **Cookie settings button.** `Footer` renders the `id="cookie-settings"` button that opens the preferences modal on click, so visitors can change or withdraw consent later. Re-wired on `astro:after-swap` for SPA navigation.
- **Banner state survives navigation.** `ClientRouter` replaces every attribute on `<html>`, so an `astro:before-swap` listener copies the library's classes to the incoming document. Without it, the banner disappears after an undecided visitor's first click.
- **Cookie autoclear.** When the user revokes analytics consent, `vanilla-cookieconsent` clears cookies matching `/^_ph/`, `/^ph_/` and `/^_ga/`. The analytics components stop their trackers on the same event, and set host-only cookies because the cleanup can't reach a parent domain.
- **`vanilla-cookieconsent` CSS** is imported globally. `vanilla-cookieconsent` ships its own CSS-variable theming layer. The `<style is:global>` block in the component maps its accent variables to `--color-accent` and `--color-accent-hover`, so the banner follows the theme. Its neutral colors are still hex values, the only sanctioned case in a component; everywhere else, use Tailwind tokens. Do not import the library CSS elsewhere.
- **Consent Mode v2 integration** is handled by the individual analytics components, not here. `CookieConsent` only dispatches the event; analytics components interpret it.
