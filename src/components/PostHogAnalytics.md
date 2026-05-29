---
component: PostHogAnalytics
oneLiner: Consent-gated PostHog EU analytics with session replay and autocapture
status: stable
tags: [analytics]
---

## Purpose

Loads the PostHog JS SDK only after analytics consent is granted. Configured for the EU-hosted PostHog instance by default. Enables session recording (with all inputs masked), autocapture, performance monitoring, and page-leave tracking. Handles Astro SPA navigation by firing `$pageview` on `astro:after-swap`.

## When to use

- When session replay, funnel analysis, feature flags, or heatmaps are needed (capabilities GA4 lacks).
- Alongside `GoogleAnalytics` — both load independently on consent; no conflict.
- When EU data residency is required (default host is `https://eu.i.posthog.com`).

## When NOT to use

- When `PUBLIC_POSTHOG_API_KEY` is not set — component silently no-ops.
- When only basic page-view analytics are needed and GA4 is already configured — PostHog adds a second CDN request; justify the payload.

## Props

None

## Example

```astro
---
// Typically placed in a shared Layout component
import PostHogAnalytics from "~/components/PostHogAnalytics.astro";
---

<head>
  <!-- ... -->
  <PostHogAnalytics />
</head>
```

## i18n keys

None

## Gotchas

- **Env-var gated.** Requires `PUBLIC_POSTHOG_API_KEY` at build time. When absent, renders nothing — silent no-op. Optionally set `PUBLIC_POSTHOG_HOST` (ingest, defaults to `https://eu.i.posthog.com`) and `PUBLIC_POSTHOG_UI_HOST` (dashboard, defaults to `https://eu.posthog.com`).
- **Consent required.** Calls `window.hasAnalyticsConsent()` before initializing. Listens for `passionfruit:consent-changed` for deferred consent. `CookieConsent.astro` must be on the page.
- **EU instance.** The default `api_host` points to PostHog's EU ingest endpoint. If you need the US instance, set `PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` and `PUBLIC_POSTHOG_UI_HOST=https://app.posthog.com`.
- **No prop exposes session recording control — must edit the component source to disable.** Session recording is on by default with `maskAllInputs: true`. To turn it off, open the component and set `disable_session_recording: true` in the PostHog `init` config.
- **`person_profiles: 'identified_only'`** — anonymous visitors do not get a person profile, reducing EU GDPR exposure.
- **`window.posthog.__loaded` guard.** Prevents re-initialization across idle callbacks and consent events.
- **Cookie autoclear.** The `CookieConsent` config clears PostHog cookies (`/^_ph/`, `/^ph_/`) when the user revokes analytics consent.
- **CSP.** PostHog loads `array.js` from `https://us-assets.i.posthog.com` (the SDK CDN, even for EU instances). Add this origin to `script-src` in `public/_headers` or PostHog will be blocked silently.
