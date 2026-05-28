---
component: GoogleAnalytics
oneLiner: Consent-gated GA4 integration with Consent Mode v2 and Astro SPA support
status: stable
tags: [analytics]
---

## Purpose

Loads Google Analytics 4 only after the user grants analytics consent via the `passionfruit:consent-changed` event. Implements Consent Mode v2 with ad cookies permanently denied and analytics cookies granted on consent. Handles Astro's client-side navigation (`astro:after-swap`) by firing synthetic `page_view` events.

## When to use

- When the site owner wants GA4 reporting (familiar Google dashboard, standard funnel analysis).
- As the sole analytics provider, or alongside `PostHogAnalytics` (both listen independently to the consent event).

## When NOT to use

- When Google Tag Manager is in use — prefer `GTMAnalytics` instead; both load from `googletagmanager.com` but via different mechanisms.
- When `PUBLIC_GA_MEASUREMENT_ID` is not set — the component silently no-ops, so it is safe to include but pointless.

## Props

None

## Example

```astro
---
// Typically placed in a shared Layout component
import GoogleAnalytics from "~/components/GoogleAnalytics.astro";
---

<head>
  <!-- ... -->
  <GoogleAnalytics />
</head>
```

## i18n keys

None

## Gotchas

- **Env-var gated.** Requires `PUBLIC_GA_MEASUREMENT_ID` (format `G-XXXXXXXXXX`) set at build time. When absent, the component renders nothing — silent no-op; no console error.
- **Consent required.** Calls `window.hasAnalyticsConsent()` before loading. If the user has not yet interacted with the cookie banner, GA4 does not load. It loads lazily on `passionfruit:consent-changed` when `analytics` is granted. `CookieConsent.astro` must be present on the page to provide this event and the `hasAnalyticsConsent` helper.
- **Consent Mode v2.** Ad-related consent signals (`ad_storage`, `ad_user_data`, `ad_personalization`) are permanently denied — passionfruit has no marketing/advertising category. Only `analytics_storage`, `functionality_storage`, and `security_storage` are granted.
- **IP anonymization** is enabled (`anonymize_ip: true`) and cannot be overridden via props.
- **SPA page views.** On `astro:after-swap`, if GA is already loaded it fires a synthetic `page_view` event; otherwise it retries `initGoogleAnalytics`. No duplicate page views on initial load.
- **`__gaLoaded` guard.** A `window.__gaLoaded` flag prevents double-initialization across idle callbacks and consent events.
- **Idle loading.** Uses `requestIdleCallback` (3 s timeout) or `setTimeout(200 ms)` fallback so GA never blocks first paint.
- **CSP.** GA4 loads `gtag/js` from `https://www.googletagmanager.com`. Add `www.googletagmanager.com` to `script-src` and `*.google-analytics.com` to `connect-src` in `public/_headers` or GA4 will be blocked silently.
