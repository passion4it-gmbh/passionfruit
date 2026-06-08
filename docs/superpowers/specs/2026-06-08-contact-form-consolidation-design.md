# Contact form consolidation — design

Date: 2026-06-08
Branch: `feat/contact-form-delivery` (Part A); a site branch for Part B
Builds on: `docs/superpowers/specs/2026-06-08-contact-form-delivery-design.md`

## 1. Context

Two contact-form-via-Brevo implementations exist in parallel:

- **Template (`passionfruit`)** — the feature built on PR #35 (`feat/contact-form-delivery`):
  three tiers (mailto / `/api/contact` function / BYO) switched by `PUBLIC_FORM_ENDPOINT`,
  gated Turnstile + honeypot + validation, Brevo via a generic `functions/api/_provider.ts`,
  recipient/sender supplied as deploy-time secrets (`CONTACT_RECIPIENT`, `CONTACT_SENDER`,
  optional `CONTACT_SENDER_NAME`), neutral From-name default, privacy notice, CSP host,
  `/deploy` Step 9 automation, full tests. **English-only** notification email.
- **Site (`passionfruit-site`)** — a fork (`upstream` = the template) with its own
  independently-built form on the unmerged `feat/contact-form` branch:
  `functions/api/_contact.ts` (pure helpers: `validateContact`, `isHoneypotTripped`,
  `buildBrevoPayload`) + `contact.ts`, honeypot + validation, **no Turnstile**, Brevo with
  **hardcoded** passion4it constants (`TO_EMAIL = info@passion4it.de`,
  `FROM_EMAIL = kontakt@passion4it.de`, `FROM_NAME = "PASSION4IT Kontaktformular"`),
  **German** subject/body, only `BREVO_API_KEY` env. It also carries unrelated contact-page
  polish (real phone via i18n, dial-safe `tel:`, DNS docs).

The two diverge on the same files. The forking model (site tracks the template via
`upstream`) is the intended way to consume this template, so divergence is the problem to
remove.

## 2. Goal

One canonical contact-form implementation, living in the template. `passionfruit-site`
becomes a configured instance of it (passion4it values supplied as Cloudflare secrets, not
hardcoded), gaining Turnstile in the process. The template gains a locale-aware notification
email so the bilingual template — and passion4it specifically — get a German notification for
German submissions without hardcoding. After consolidation the site's contact-delivery code is
identical to the template; only secrets differ, so future upstream merges stay clean.

## 3. Decisions

| #   | Decision                                                                                                                                                                                                                                                | Why                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Template is canonical; the site converges onto it via `git merge upstream/main`, resolving the contact-delivery conflict in favour of upstream.                                                                                                         | The fork→upstream-merge workflow is the intended consumption model. Removes the duplicate implementation at the root.                                                                                                                                     |
| D2  | The locale-aware notification email is folded into PR #35 (not a separate PR), so the canonical feature lands complete before the site forks it.                                                                                                        | PR #35 is unmerged and this directly extends it. Avoids a second template PR and a half-built canonical state.                                                                                                                                            |
| D3  | Notification email is localized DE/EN by the **submission's** locale (the page `lang`), via a small self-contained map in `_provider.ts`. Not sourced from site i18n.                                                                                   | The email is internal ops text, not site content; keeping it in the function avoids importing large i18n JSON into the edge function and keeps it I/O-free. Parallel localized structure (labelled `Name`/`E-Mail`/message) reads well in both languages. |
| D4  | The site supplies passion4it values as Cloudflare secrets (`CONTACT_RECIPIENT`, `CONTACT_SENDER`, `CONTACT_SENDER_NAME="PASSION4IT Kontaktformular"`, `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`; `BREVO_API_KEY` already set), NOT hardcoded. | This is the whole point of converging: the site's code becomes identical to the canonical template; only configuration differs. `CONTACT_SENDER_NAME` preserves the German From-name the site had.                                                        |
| D5  | The site's bespoke `functions/api/_contact.ts` + `_contact.test.ts` are deleted; `_provider.ts` + `contact.ts` + the functions toolchain come from upstream.                                                                                            | Single implementation. The template's `_provider.ts` is already a clean, separated, tested module.                                                                                                                                                        |
| D6  | The site's contact-page polish (real phone via i18n, dial-safe `tel:`, page content) is PRESERVED during the merge — only the form-delivery parts of `contact.astro` adopt upstream.                                                                    | That polish is unrelated to delivery and is correct, deployment-specific work. Consolidation targets delivery, not content.                                                                                                                               |
| D7  | Default locale fallback in the handler: `lang === "de"` → German, anything else (including missing/invalid) → English.                                                                                                                                  | The form always sends a valid `lang`; the fallback only matters for malformed requests, where neutral English is safe.                                                                                                                                    |

## 4. Part A — canonical template: locale-aware notification email

Folded into PR #35 (`feat/contact-form-delivery`). Three edits + tests:

1. **`src/components/pages/contact.astro`** — add `data-lang={lang}` to the `<form>` (mirrors
   the existing `data-msg-*` pattern). The inline submit script reads it and includes `lang` in
   the POST JSON body, alongside the existing `name/email/message/honeypot/turnstileToken`.
2. **`functions/api/contact.ts`** — read `lang` from the parsed body; normalize to `"de"` or
   `"en"` per D7; pass it through to `sendContactEmail`.
3. **`functions/api/_provider.ts`** — `ContactEmailInput` gains an optional `lang` field
   (`"de" | "en"`). A small inline localized map produces the subject and a **parallel**
   labelled body for each language: DE `Kontaktanfrage von <name>` / body `Name:`, `E-Mail:`,
   blank line, message; EN `Contact form: <name>` / body `Name:`, `Email:`, blank line,
   message. `replyTo` (submitter) is unchanged. The neutral-default From-name and
   `senderName` override remain.
4. **`functions/api/_provider.test.ts`** — assert the DE and EN branches produce the expected
   subject prefix and labelled body; default-fallback (no/invalid `lang`) yields English.
   `functions/api/contact.test.ts` — confirm the handler forwards `lang` and the suite still
   passes.

No change to the tier model, secrets, CSP, or docs beyond noting `lang` in the body shape
where the body shape is documented (`.env.example` BYO note, sidecar).

## 5. Part B — `passionfruit-site` converges onto the canonical template

Sequenced AFTER Part A merges to template `main`.

**Merge mechanism.** In `passionfruit-site`: `git fetch upstream && git merge upstream/main`
on a fresh branch. Expect conflicts on the contact-delivery files (both forks changed them).
Resolve by taking upstream's canonical versions and deleting the site's bespoke files:

- Delete `functions/api/_contact.ts`, `functions/api/_contact.test.ts`.
- Adopt upstream `functions/api/_provider.ts`, `functions/api/contact.ts`,
  `functions/api/_provider.test.ts`, `functions/api/contact.test.ts`, `functions/tsconfig.json`,
  and the `package.json`/`tsconfig.json` toolchain changes (reconcile with whatever functions
  toolchain the site already has — the site already runs function tests, so de-duplicate
  scripts rather than double them).

**`contact.astro` (careful merge, not clobber).** Adopt upstream's form-delivery additions
(gated Turnstile widget + script, honeypot — the site already names the field `company`,
privacy notice, `data-lang`, and the `lang`/`turnstileToken` POST fields). PRESERVE the site's
contact-page polish: real phone via i18n, dial-safe `tel:` href, and any site-specific page
content/hero. The end state: the delivery-related markup/script equals upstream; the page
content stays the site's.

**i18n.** Add the template's new privacy-notice `contact.form.*` keys to the site's `de.json`
and `en.json` (lockstep). Keep the site's existing contact strings.

**CSP.** Add `https://challenges.cloudflare.com` to `script-src`, `frame-src`, `connect-src`
in the site's `public/_headers` (it currently lacks it).

**Configuration (secrets, not code).** Set as Cloudflare Pages secrets / `.dev.vars` for local:
`CONTACT_RECIPIENT=info@passion4it.de`, `CONTACT_SENDER=kontakt@passion4it.de`,
`CONTACT_SENDER_NAME=PASSION4IT Kontaktformular`, `BREVO_API_KEY` (already set), plus new
`TURNSTILE_SECRET_KEY` and build-time `PUBLIC_TURNSTILE_SITE_KEY` and
`PUBLIC_FORM_ENDPOINT=/api/contact`. Update the site's `.env.example` and `.dev.vars` docs to
list these. The template's `/deploy` Step 9 performs the Cloudflare-side wiring (create
Turnstile widget, push secrets).

**Net divergence after Part B:** the site's contact-delivery code (functions + the form's
delivery markup/script) is identical to the template. Only secrets, the contact-page content,
and the site's other polish differ.

## 6. Testing

- Part A: `pnpm test` (provider + handler tests incl. new locale branches), `pnpm typecheck`,
  `pnpm build` in the template.
- Part B: in the site, `pnpm test` (the adopted function tests), `pnpm build`; a local
  `wrangler pages dev` smoke using `.dev.vars` to POST a sample submission per locale; then a
  Cloudflare **preview** deploy on the site PR to verify the real form end-to-end (Turnstile
  challenge + Brevo delivery to `info@passion4it.de`, German subject for the DE page).

## 7. Out of scope (YAGNI)

- Re-genericizing or removing the site's tier model: the site uses `PUBLIC_FORM_ENDPOINT=/api/contact`;
  the mailto/BYO tiers stay available (inherited) but unused — no need to strip them.
- Migrating the email copy into site i18n (D3 keeps it in the function).
- Any change to the site's unrelated contact-page polish beyond preserving it.
- Persisting submissions, rate limiting beyond Turnstile/honeypot (already out of scope upstream).

## 8. Open questions

None outstanding — direction (template canonical), locale-aware email (#1), and secrets-based
site config are all confirmed. The only thing deferred to the implementation plan is the exact
git state of the site's branches (whether its `feat/contact-form` work is on `main` yet), which
determines the precise merge/branch commands.
