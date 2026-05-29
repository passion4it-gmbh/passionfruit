---
component: GTMAnalytics
oneLiner: Consent-gated Google Tag Manager loader with Consent Mode v2 and revocation
status: stable
tags: [analytics]
---

## Purpose

Loads a Google Tag Manager container only after analytics consent is granted. Implements Consent Mode v2 defaults (all denied) before the container loads, then grants `analytics_storage`, `functionality_storage`, and `security_storage` on consent. Supports revocation: pushing a `consent update` with `analytics_storage: denied` stops tags from firing without unloading the GTM script.

## When to use

- When tag management via GTM is preferred over direct GA4 (i.e., marketers manage tags without code deploys).
- As an alternative to `GoogleAnalytics` — use one or the other, not both.

## When NOT to use

- Alongside `GoogleAnalytics` — both load from `googletagmanager.com`; using both risks duplicate events and `dataLayer` conflicts.
- When `PUBLIC_GTM_CONTAINER_ID` is not set — the component silently no-ops.
- When the container ID was previously used for another site — that site's tags will load alongside yours. Verify the container is clean before pointing it at a new domain.

## Props

None

## Example

```astro
---
// Typically placed in a shared Layout component
import GTMAnalytics from "~/components/GTMAnalytics.astro";
---

<head>
  <!-- ... -->
  <GTMAnalytics />
</head>
```

## i18n keys

None

## Gotchas

- **Env-var gated.** Requires `PUBLIC_GTM_CONTAINER_ID` (format `GTM-XXXXXXX`) set at build time. When absent, renders nothing — silent no-op.
- **Consent required.** Listens for `passionfruit:consent-changed`. Reads `event.detail.analytics` (boolean) to determine whether to grant or deny `analytics_storage`. `CookieConsent.astro` must be present to dispatch this event.
- **Consent Mode v2.** Sets all consent signals to `denied` by default, then issues an `update` granting analytics signals. Ad-related signals (`ad_storage`, `ad_user_data`, `ad_personalization`) remain permanently denied — passionfruit has no advertising category.
- **Revocation.** When `passionfruit:consent-changed` fires with `analytics: false`, a `consent update` with `analytics_storage: denied` is pushed to `dataLayer` — running GTM tags respect this without a page reload.
- **No clean unload.** The GTM script cannot be unloaded from memory once injected. Revocation prevents future tag fires but does not undo past ones.
- **`__gtmLoaded` guard.** Prevents double-loading the container script across idle callbacks and consent re-grants.
- **SPA navigation.** On `astro:after-swap`, pushes `{ event: "astro:after-swap" }` to `dataLayer` so GTM triggers can respond to client-side page changes.
- **CSP.** GTM loads from `googletagmanager.com` and may inject further scripts and iframes. Update `public/_headers` CSP if additional origins appear in your container.
