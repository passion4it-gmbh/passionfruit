# Contact form delivery — design

Date: 2026-06-08
Branch: `feat/contact-form-delivery`

## 1. Context

The template's contact page (`src/components/pages/contact.astro`) ships a working
form with two delivery behaviours, decided at build time:

- **mailto fallback** (default) — submit opens the visitor's mail client, pre-filled,
  addressed to `contact.info.email`. Zero config, always works.
- **`PUBLIC_FORM_ENDPOINT`** — if set, the form `fetch`-POSTs `{ name, email, message }`
  JSON to that URL, with sending/success/error states.

Three gaps for the template's actual audience (non-technical users deploying to
Cloudflare Pages):

1. `PUBLIC_FORM_ENDPOINT` is undocumented — it appears only in the component sidecar,
   not in `.env.example`. The POST path is effectively invisible.
2. There is no managed, GDPR-clean, EU-resident delivery path. A user who wants the
   form to actually email them has to find and wire up a third-party service unaided,
   and most no-code form backends are US-based (international-transfer exposure).
3. The code conflates two distinct concepts: the **displayed** contact email
   (`contact.info.email`, a fixture shown on the page) and the **delivery recipient**
   (where submissions land). There is no separate recipient setting; the mailto path
   reuses the displayed address.

There is also no spam protection on the POST path, which was the original concern that
started this work: a naively exposed delivery target invites abuse.

## 2. Goal

Ship a generic, low-friction, GDPR-clean contact-form delivery path for downstream
users. Three graceful tiers over one form and one in-house endpoint. The Cloudflare
side is fully automated by `/deploy` using the API token it already collects; the only
manual step is a one-time provider key paste. Brevo (EU) is the documented reference
adapter, but the seam stays vendor-neutral. mailto remains the zero-config fallback so
the form works from minute zero, before any provider is wired up.

This improves the **template**. No real (passion4it) contact details enter the repo;
"direct it to my business" is a per-deployment recipient secret, set at deploy time.

The canonical first consumer is the public showcase at `passionfruit.passion4it.de` — a
deployment of this template that demonstrates the framework's features. Its
`CONTACT_RECIPIENT` Cloudflare secret points at a passion4it inbox, so inbound demo
inquiries are captured as leads. The displayed contact email on that showcase stays the
generic fixture (consistent with the rest of the Greenleaf demo content); only delivery
is real. Displayed ≠ delivered, by design.

## 3. Decisions

| #   | Decision                                                                                                                                                                                                                                                                        | Why                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Delivery handled by a Cloudflare Pages Function at `functions/api/contact.ts` (file-based routing).                                                                                                                                                                             | Auto-deploys with every push alongside the static site. No separate Worker, no Astro SSR mode change, no extra deploy step. The function is invisible to the user.       |
| D2  | The existing `PUBLIC_FORM_ENDPOINT` is the tier switch — no new mode flag. Unset → mailto. `/api/contact` → in-house function + provider. Any other URL → BYO external service.                                                                                                 | Reuses the seam already in the component. Elegant: the function tier is just "point the endpoint at our own route."                                                      |
| D3  | The function calls a thin provider adapter. Brevo (EU transactional email) is the shipped reference adapter; the boundary is generic and swappable (Resend / Postmark / etc. = one file).                                                                                       | Satisfies "generic" without locking the template to one vendor. Brevo is the EU/GDPR reference, not a hard dependency.                                                   |
| D4  | Spam protection: Cloudflare Turnstile + honeypot field + server-side validation. Turnstile is **gated** — absent secret means the function skips verification rather than failing.                                                                                              | Turnstile is privacy-friendly (no tracking cookie, no consent banner) unlike reCAPTCHA. Gating keeps the zero-config tier working; protection layers in once configured. |
| D5  | Separate the **displayed** contact email (`contact.info.email`, fixture, replaced at `/onboard`) from the **delivery recipient** (`CONTACT_RECIPIENT`, a server-side secret set at deploy time). The form never hardcodes a recipient.                                          | This is the correct fix for "direct it to my business": routing is deploy config, not a template edit. Keeps fixtures generic and coherent.                              |
| D6  | All credentials are server-side only, never `PUBLIC_*`: provider API key, recipient, sender, Turnstile secret. The only public value is the Turnstile **sitekey**.                                                                                                              | A bearer secret in the browser bundle can be scraped and abused. This is the whole reason a function exists rather than a client-side call.                              |
| D7  | Template fixtures stay generic — no passion4it or other real values committed.                                                                                                                                                                                                  | CLAUDE.md §1: this repo is the template; `example.com` / "Greenleaf Digital" are replaceable fixtures.                                                                   |
| D8  | `/deploy` gains an optional "contact form" step that, via the Cloudflare API token it already collects: creates a Turnstile widget (returns sitekey + secret), pushes all server secrets to the Pages project, sets `PUBLIC_FORM_ENDPOINT=/api/contact` and the public sitekey. | Confirmed possible against Cloudflare docs (Turnstile widget-create API + Pages env/secret API). Removes all dashboard work except the irreducible provider step.        |
| D9  | GDPR posture: privacy-notice line with a link to the privacy page beside the submit button; data minimization (already satisfied — name/email/message only); EU provider residency + DPA documented; a retention note; no reCAPTCHA. Notice line, not a blocking checkbox.      | For a user-initiated inquiry the lawful basis is Art. 6(1)(b)/(f); a transparency notice is sufficient and lower-friction. A checkbox is an easy later upgrade.          |
| D10 | CSP in `public/_headers` extended to allow `challenges.cloudflare.com` (Turnstile script/frame/connect).                                                                                                                                                                        | Turnstile is blocked silently otherwise. CLAUDE.md §14 rule: new third-party host ⇒ update CSP.                                                                          |

## 4. The three tiers

| Tier                  | Trigger                             | Behaviour                                                                                       | Spam protection                   | GDPR                                                                      |
| --------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| 1 — mailto            | `PUBLIC_FORM_ENDPOINT` unset        | Opens visitor's mail client, pre-filled, to displayed address.                                  | N/A (no server, no stored data)   | No processor; data never leaves the visitor's client until they hit send. |
| 2 — in-house function | `PUBLIC_FORM_ENDPOINT=/api/contact` | Form POSTs JSON to our function; function verifies + sends via provider to `CONTACT_RECIPIENT`. | Turnstile + honeypot + validation | EU provider (Brevo), DPA, notice line, minimization.                      |
| 3 — BYO service       | `PUBLIC_FORM_ENDPOINT=https://…`    | Form POSTs JSON to the user's chosen external endpoint. Function unused.                        | Whatever the service provides     | User's responsibility; documented checklist.                              |

A non-technical user is never blocked: they sit on Tier 1 until they choose to wire up
delivery, and the upgrade is one `/deploy` step.

## 5. Architecture and data flow

**Client (Tier 2):** the form collects name / email / message, plus a hidden honeypot
field and (when a sitekey is present) a Turnstile token. On submit it POSTs JSON to the
same-origin `/api/contact`. Success and error states already exist in the component;
they are reused. When no sitekey is present the Turnstile widget is simply not rendered.

**Function (`functions/api/contact.ts`):** on POST it (1) rejects immediately if the
honeypot is non-empty; (2) verifies the Turnstile token against Cloudflare's siteverify
endpoint **only if** a Turnstile secret is configured; (3) validates required fields,
email shape, and length bounds; (4) hands off to the provider adapter to send a message
from `CONTACT_SENDER` to `CONTACT_RECIPIENT`; (5) returns a small JSON result. Missing
provider configuration yields a clear server error rather than a silent pass.

**Provider adapter:** a single-purpose module that takes the validated message plus
sender/recipient and performs the provider call. Brevo's transactional-email API is the
shipped implementation. Swapping providers means replacing this one module; the function
contract does not change.

**No data store.** Submissions are emailed, not persisted. (See §9, YAGNI.)

## 6. Files added / changed

Added:

- `functions/api/contact.ts` — the Pages Function POST handler (honeypot, Turnstile,
  validation, adapter dispatch).
- `functions/api/_provider.ts` — the provider adapter (Brevo reference implementation
  behind a vendor-neutral function signature).
- `functions/api/contact.test.ts` — node:test coverage (honeypot reject, Turnstile-skip
  when no secret, validation failures, adapter called on valid input, missing-config error).

Changed:

- `src/components/pages/contact.astro` — render the Turnstile widget and honeypot field
  (gated on `PUBLIC_TURNSTILE_SITE_KEY`); add the privacy-notice line with a link to the
  privacy page; include the honeypot value and Turnstile token in the POST body.
- `src/components/pages/contact.md` — document the three tiers, the env vars, and the
  displayed-vs-recipient distinction.
- `.env.example` — add `PUBLIC_FORM_ENDPOINT` and `PUBLIC_TURNSTILE_SITE_KEY` (public,
  build-time) and document the server-only secrets (`CONTACT_RECIPIENT`, `CONTACT_SENDER`,
  `BREVO_API_KEY`, `TURNSTILE_SECRET_KEY`) as Cloudflare secrets set at deploy time, not
  committed.
- `public/_headers` — extend CSP to allow `challenges.cloudflare.com`.
- `src/i18n/de.json` and `src/i18n/en.json` — new strings in lockstep: privacy-notice
  line (with link text), spam-check failure message. Bilingual check must pass.
- `.claude/skills/deploy.md` — new optional "contact form" step (create Turnstile widget,
  prompt for provider key + sender, verify sender reminder, push secrets, set the two
  public vars).
- `CLAUDE.md` — document contact-form delivery (env vars, tiers, CSP note, the
  displayed-vs-recipient rule).

## 7. The provider step (the one manual surface)

Irreducible because the provider account belongs to the user and cannot be driven on
their behalf. One time, in the provider dashboard, the user: verifies a sender (email or
domain — required for transactional sending and deliverability), generates an API key,
and pastes the key to `/deploy` once. `/deploy` stores it as an encrypted Cloudflare
secret; the user never handles it again. This is irreducible for any provider, including
no-code form services ("sign up, get key, paste").

## 8. GDPR specifics

- **Transparency (Art. 13):** a notice line beside submit — "By submitting you agree to
  our [Privacy Policy]" — linking the existing privacy page. Bilingual.
- **Lawful basis:** responding to a user-initiated inquiry (Art. 6(1)(b)/(f)). No bundled
  marketing consent. A blocking consent checkbox is intentionally not required (documented
  as an optional upgrade).
- **Data minimization:** name / email / message only — already the case; no new fields.
- **Processor / residency:** Brevo is EU-resident with a DPA available; documented as the
  GDPR-clean reference. The Tier-3 checklist warns that US-based services trigger
  international-transfer obligations.
- **Spam protection choice:** Turnstile (no tracking cookie, no consent gate), explicitly
  not Google reCAPTCHA.
- **Retention:** documented recommendation to delete inquiries on a defined schedule
  (provider-side); the template stores nothing itself.

## 9. Out of scope (YAGNI)

- Persisting submissions to KV / D1 — email delivery is sufficient; revisit only if a
  user asks for an in-site inbox.
- Shipping multiple provider adapters — one reference (Brevo) plus the seam; others are a
  one-file swap, documented but not pre-built.
- Application-level rate limiting beyond Turnstile — Cloudflare WAF/rate-limiting can be
  layered at the edge later if abuse appears.
- File attachments, CRM sync, autoresponders.

## 10. Testing

- `functions/api/contact.test.ts` (node:test): honeypot rejection; Turnstile verification
  skipped when no secret; validation failures (missing field, bad email, oversized body);
  adapter invoked with correct args on valid input; clear error when provider config is
  absent. The adapter's network call is mocked.
- `pnpm build` passes (lint, typecheck, bilingual check).
- Manual: Tier 1 (mailto) unaffected with no env; Tier 2 end-to-end on a preview deploy
  after `/deploy` wiring.

## 11. Resolved decisions (review answers)

1. **Provider:** Brevo only for now — single shipped reference adapter. No second provider
   pre-documented; the seam keeps swapping cheap if one is wanted later.
2. **Privacy gate:** notice line beside submit (no blocking consent checkbox). Matches D9.
3. **Routing:** confirmed deploy-time `CONTACT_RECIPIENT` secret. Template fixtures stay
   generic; the `passionfruit.passion4it.de` showcase sets the secret to a passion4it inbox
   (see §2). Nothing real is committed to the repo.
