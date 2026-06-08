# Contact Form Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the template a generic, GDPR-clean contact-form delivery path: a Cloudflare Pages Function that verifies and emails submissions via an EU provider (Brevo), with mailto as the zero-config fallback and a BYO-endpoint escape hatch.

**Architecture:** One static form posts JSON to a same-origin Pages Function (`functions/api/contact.ts`). The function runs honeypot + Turnstile + validation, then dispatches to a vendor-neutral provider adapter (`functions/api/_provider.ts`, Brevo reference impl). The existing `PUBLIC_FORM_ENDPOINT` env var is the tier switch (unset = mailto, `/api/contact` = bundled function, any URL = BYO). All credentials are server-side Cloudflare secrets; only the Turnstile sitekey is public.

**Tech Stack:** Astro 6 (static), Cloudflare Pages Functions, `@cloudflare/workers-types`, Brevo transactional email API, Cloudflare Turnstile, node:test via tsx.

> **No-code-in-plan note:** Per the maintainer's standing rule, this plan describes tests and implementations in precise prose rather than code blocks. The implementing agent writes the actual code. Exact paths, commands, and expected outputs are given.

**Spec:** `docs/superpowers/specs/2026-06-08-contact-form-delivery-design.md`

---

## File structure

Created:

- `functions/api/contact.ts` — POST handler. Parses body, runs honeypot/Turnstile/validation, dispatches to the provider, returns a small JSON result. Owns the request/response contract.
- `functions/api/_provider.ts` — `sendContactEmail()`. The Brevo transactional-email call behind a vendor-neutral signature. The only file that knows about Brevo.
- `functions/api/contact.test.ts` — node:test coverage for the handler (honeypot, Turnstile-gating, validation, config error, dispatch).
- `functions/api/_provider.test.ts` — node:test coverage for the Brevo adapter (URL, auth header, body shape, error throw).
- `functions/tsconfig.json` — type-checks the functions layer with Workers types (the root `tsc` run excludes it because it assumes DOM/browser libs).

Modified:

- `package.json` — add `@cloudflare/workers-types` devDep; add `test:functions` script; chain it into `test`; add the functions typecheck to `typecheck`.
- `tsconfig.json` — add `functions` to `exclude` so the root `tsc --noEmit` does not compile Worker code under browser libs.
- `src/components/pages/contact.astro` — render Turnstile widget + honeypot field (gated on the public sitekey), add the privacy-notice line, include honeypot + Turnstile token in the POST body.
- `src/i18n/de.json` + `src/i18n/en.json` — three new `contact.form.*` strings, in lockstep.
- `public/_headers` — CSP allows `https://challenges.cloudflare.com`.
- `.env.example` — document `PUBLIC_FORM_ENDPOINT`, `PUBLIC_TURNSTILE_SITE_KEY`, and the server-only secrets.
- `src/components/pages/contact.md` — document the three tiers and the displayed-vs-recipient split.
- `CLAUDE.md` — a contact-form-delivery subsection.
- `.claude/skills/deploy/SKILL.md` — a new optional "Step 9: Wire the contact form".

---

## Contracts (define once, referenced by every task)

These names and shapes are fixed across tasks. Do not rename.

**Provider — `functions/api/_provider.ts`:**

- Exports `sendContactEmail(input)`, returns `Promise<void>`, throws on failure.
- `input` fields: `name: string`, `email: string`, `message: string`, `recipient: string`, `sender: string`, `apiKey: string`.
- Behaviour: `fetch` POST to `https://api.brevo.com/v3/smtp/email`. Headers: `api-key: <apiKey>`, `content-type: application/json`, `accept: application/json`. JSON body: `sender` = `{ email: sender, name: "passionfruit contact form" }`; `to` = `[{ email: recipient }]`; `replyTo` = `{ email, name }` (the submitter, so replies reach them); `subject` = `Contact form: <name>`; `textContent` = the message plus a trailing line `Reply to: <email>`. On a non-2xx response, throw an `Error` whose message includes the HTTP status.

**Handler — `functions/api/contact.ts`:**

- Exports `onRequestPost: PagesFunction<Env>`.
- `Env` = `{ CONTACT_RECIPIENT?: string; CONTACT_SENDER?: string; BREVO_API_KEY?: string; TURNSTILE_SECRET_KEY?: string }`.
- Request body (JSON): `{ name?, email?, message?, honeypot?, turnstileToken? }`, all strings.
- Response: always JSON via a local `json(body, status)` helper that sets `content-type: application/json`. Body shape `{ ok: boolean; error?: "validation" | "config" | "delivery" }`.
- Control flow, in order:
  1. Parse JSON; if parsing fails → `json({ ok: false, error: "validation" }, 400)`.
  2. **Honeypot:** if `honeypot` is a non-empty string → `json({ ok: true }, 200)` and send nothing (silent drop; bots get a success signal).
  3. **Turnstile (gated):** if `env.TURNSTILE_SECRET_KEY` is truthy, POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with a `URLSearchParams` body of `secret` and `response` (= `turnstileToken ?? ""`); parse the JSON `success` boolean; if not `success` → `json({ ok: false, error: "validation" }, 400)`. If the secret is absent, skip this block entirely.
  4. **Validate:** trim `name`, `email`, `message`; each must be non-empty; `email` must match a simple `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`; lengths: name ≤ 100, email ≤ 254, message ≤ 5000. Any failure → `json({ ok: false, error: "validation" }, 400)`.
  5. **Config:** if any of `CONTACT_RECIPIENT`, `CONTACT_SENDER`, `BREVO_API_KEY` is missing → `json({ ok: false, error: "config" }, 500)`.
  6. **Dispatch:** call `sendContactEmail({ name, email, message, recipient, sender, apiKey })`. On throw → `json({ ok: false, error: "delivery" }, 502)`. On success → `json({ ok: true }, 200)`.

**Client (contact.astro):** the existing inline script already branches on `response.ok` — success state when ok, generic `contact.form.error` otherwise. No per-error-code handling is added (YAGNI; that is why the handler collapses spam/validation into one client-visible failure and no separate spam i18n string is introduced).

---

## Task 1: Functions layer toolchain + Brevo provider adapter

**Files:**

- Create: `functions/api/_provider.ts`
- Create: `functions/api/_provider.test.ts`
- Create: `functions/tsconfig.json`
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Install Workers types**

Run: `pnpm add -D @cloudflare/workers-types`
Expected: dependency added under `devDependencies`; lockfile updated.

- [ ] **Step 2: Create `functions/tsconfig.json`**

Content (config, not app code): extend `../tsconfig.json`; set `compilerOptions.types` to `["@cloudflare/workers-types"]` and `compilerOptions.lib` to `["ES2022", "WebWorker"]`; set `include` to `["**/*.ts"]`; set `exclude` to `["**/*.test.ts"]` (test files run under Node/tsx, not the Worker lib, so they are not type-checked here).

- [ ] **Step 3: Exclude functions from the root typecheck and wire scripts**

In `tsconfig.json`, add `"functions"` to the `exclude` array (root `tsc` assumes browser libs and must not compile Worker code).
In `package.json` scripts: change `typecheck` to also run `tsc --noEmit -p functions/tsconfig.json` after the existing `tsc --noEmit`; add `"test:functions": "tsx --test functions/api/*.test.ts"`; change `test` to append `&& pnpm test:functions`.

- [ ] **Step 4: Write the failing provider test**

In `functions/api/_provider.test.ts` (node:test + `node:assert/strict`): import `sendContactEmail` from `./_provider`. In a test, replace `globalThis.fetch` with a `mock.fn` returning a `Response` with status 201. Call `sendContactEmail` with sample input. Assert: fetch called once; first arg equals `https://api.brevo.com/v3/smtp/email`; the request init has method `POST`, header `api-key` equal to the passed key, and a parsed JSON body whose `to[0].email` equals the recipient, `sender.email` equals the sender, `replyTo.email` equals the submitter email, and `subject` contains the submitter name. A second test: when `fetch` resolves with status 400, assert `sendContactEmail` rejects (use `assert.rejects`). Restore `globalThis.fetch` in an `afterEach`/`finally`.

- [ ] **Step 5: Run the test to verify it fails**

Run: `pnpm exec tsx --test functions/api/_provider.test.ts`
Expected: FAIL — module `./_provider` has no export `sendContactEmail` (or file not found).

- [ ] **Step 6: Implement the provider**

Write `functions/api/_provider.ts` implementing `sendContactEmail` exactly per the **Provider** contract above. Use the global `fetch`. Throw on non-2xx with the status in the message.

- [ ] **Step 7: Run tests and typecheck to verify they pass**

Run: `pnpm exec tsx --test functions/api/_provider.test.ts`
Expected: PASS (2/2).
Run: `pnpm typecheck`
Expected: PASS — both the root `tsc` and `tsc -p functions/tsconfig.json` succeed.

- [ ] **Step 8: Commit**

Run: `git add functions/ package.json tsconfig.json pnpm-lock.yaml && git commit -m "feat: add Brevo provider adapter and functions toolchain"`

---

## Task 2: Contact function handler

**Files:**

- Create: `functions/api/contact.ts`
- Create: `functions/api/contact.test.ts`

- [ ] **Step 1: Write the failing handler tests**

In `functions/api/contact.test.ts` (node:test): import `onRequestPost` from `./contact`. Add a helper that builds a fake context `{ request, env }` where `request` is a `new Request("https://x/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })` and `env` is a plain object; cast the context to the handler's parameter type as needed (tests are not type-checked). Stub `globalThis.fetch` with `mock.fn`; for tests that exercise Turnstile, branch the stub on the request URL (siteverify vs Brevo).

Cases (assert on `response.status` and the parsed JSON `ok`/`error`, and on whether the Brevo fetch ran):

1. Honeypot non-empty (`honeypot: "x"`), full valid env → status 200, `ok: true`, and **no** call to the Brevo endpoint.
2. No `TURNSTILE_SECRET_KEY`, valid body, full env → Turnstile siteverify **not** called; Brevo called once; status 200, `ok: true`.
3. `TURNSTILE_SECRET_KEY` set, siteverify stub returns `{ success: false }` → status 400, `error: "validation"`, Brevo **not** called.
4. `TURNSTILE_SECRET_KEY` set, siteverify returns `{ success: true }`, valid body, full env → Brevo called once; status 200, `ok: true`.
5. Validation: body missing `message` → 400 `validation`; body with `email: "nope"` → 400 `validation`; body with a `message` longer than 5000 chars → 400 `validation`. Brevo not called in any.
6. Config: valid body, env missing `BREVO_API_KEY` → 500 `config`; Brevo not called.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec tsx --test functions/api/contact.test.ts`
Expected: FAIL — `./contact` has no export `onRequestPost`.

- [ ] **Step 3: Implement the handler**

Write `functions/api/contact.ts` implementing `onRequestPost` and the local `json()` helper exactly per the **Handler** contract above. Import `sendContactEmail` from `./_provider`. Read all inputs from `context.request` (JSON) and `context.env`.

- [ ] **Step 4: Run tests and typecheck to verify they pass**

Run: `pnpm exec tsx --test functions/api/contact.test.ts`
Expected: PASS (all cases).
Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add functions/api/contact.ts functions/api/contact.test.ts && git commit -m "feat: add contact form Pages Function handler"`

---

## Task 3: Contact form component + i18n strings

**Files:**

- Modify: `src/components/pages/contact.astro`
- Modify: `src/i18n/de.json`
- Modify: `src/i18n/en.json`

- [ ] **Step 1: Add the three i18n strings to both locales**

Under `contact.form` in **both** `src/i18n/de.json` and `src/i18n/en.json`, add (lockstep, same keys):

- `privacyNoticePrefix` — DE: `"Mit dem Absenden stimmen Sie unserer "`; EN: `"By submitting, you agree to our "`.
- `privacyLinkLabel` — DE: `"Datenschutzerklärung"`; EN: `"Privacy Policy"`.
- `privacyNoticeSuffix` — DE: `" zu."`; EN: `"."`.

Add any unknown words (e.g. none expected here) to `project-words.txt` only if `cspell` flags them.

- [ ] **Step 2: Verify the bilingual + build still pass before touching the component**

Run: `node scripts/check-bilingual.mjs`
Expected: PASS (both locales symmetric).

- [ ] **Step 3: Add Turnstile, honeypot, and the privacy notice to the component**

In `src/components/pages/contact.astro` frontmatter: read `const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;`. Import `findPageByKey` from `~/lib/page-registry`; resolve the privacy page and build `privacyHref` as `lang === "de" ? "/" + slug.de : "/en/" + slug.en`.

In the form markup (inside the existing `<form id="contact-form">`, before the submit `<Button>`):

- A **honeypot** field — a wrapper positioned far off-screen (e.g. utility classes `absolute -left-[9999px] h-px w-px overflow-hidden`), `aria-hidden="true"`, containing a text `<input name="company" tabindex="-1" autocomplete="off" />`. Real users never see or fill it.
- The **Turnstile widget**, rendered only when `turnstileSiteKey` is set: a `<div class="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto"></div>`.
- The **privacy notice** `<p>` (muted, small): `{t("contact.form.privacyNoticePrefix")}` + `<a href={privacyHref} class="underline">{t("contact.form.privacyLinkLabel")}</a>` + `{t("contact.form.privacyNoticeSuffix")}`.

After `</BaseLayout>` content, when `turnstileSiteKey` is set, include the Turnstile script once: `<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`.

- [ ] **Step 4: Send honeypot + Turnstile token in the POST body**

In the component's inline submit `<script>`, where the JSON body is built: read the honeypot via `form.querySelector('input[name="company"]')` value, and the Turnstile token via `form.querySelector('input[name="cf-turnstile-response"]')` value (Turnstile injects this hidden input). Add both to the POST body object as `honeypot` and `turnstileToken`. The mailto fallback branch is unchanged.

- [ ] **Step 5: Verify build, typecheck, and a11y lint**

Run: `pnpm typecheck`
Expected: PASS.
Run: `pnpm lint:a11y`
Expected: PASS — no alt-text/role errors introduced (the honeypot input has a name and is `aria-hidden`).
Run: `pnpm build`
Expected: PASS (sync + lint + typecheck + astro build + bilingual check).

- [ ] **Step 6: Commit**

Run: `git add src/components/pages/contact.astro src/i18n/de.json src/i18n/en.json && git commit -m "feat: add Turnstile, honeypot, and privacy notice to contact form"`

---

## Task 4: CSP allowance for Turnstile

**Files:**

- Modify: `public/_headers`

- [ ] **Step 1: Extend the CSP**

In the `Content-Security-Policy` line under `/*`, add `https://challenges.cloudflare.com` to three directives: `script-src`, `frame-src`, and `connect-src`. Leave every other directive untouched.

- [ ] **Step 2: Verify the build and that the value parses**

Run: `pnpm build`
Expected: PASS.
Run: `rg "challenges.cloudflare.com" dist/_headers`
Expected: the directive appears in the built `_headers` (confirms `postbuild-headers.mjs` preserved it).

- [ ] **Step 3: Commit**

Run: `git add public/_headers && git commit -m "feat: allow Cloudflare Turnstile in CSP"`

---

## Task 5: Documentation — env example, sidecar, CLAUDE.md

**Files:**

- Modify: `.env.example`
- Modify: `src/components/pages/contact.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Document the env vars in `.env.example`**

Append a "Contact form" block. Document the two **public, build-time** vars with empty values and comments: `PUBLIC_FORM_ENDPOINT=` (unset = mailto fallback; `/api/contact` = bundled function + Brevo; any other URL = BYO external service) and `PUBLIC_TURNSTILE_SITE_KEY=` (public Turnstile sitekey; spam protection is skipped when empty). Below them, a comment block listing the **server-only** secrets that are **not** committed and are set as Cloudflare Pages secrets at deploy time: `CONTACT_RECIPIENT`, `CONTACT_SENDER`, `BREVO_API_KEY`, `TURNSTILE_SECRET_KEY`.

- [ ] **Step 2: Update the component sidecar**

In `src/components/pages/contact.md`, replace the single "submits to `PUBLIC_FORM_ENDPOINT`" note with: the three tiers (mailto / `/api/contact` function + Brevo / BYO URL); the displayed-vs-delivery-recipient distinction (`contact.info.email` is shown; `CONTACT_RECIPIENT` is where mail lands); and the new gated Turnstile + honeypot + privacy-notice behaviour. Keep the existing frontmatter and section order.

- [ ] **Step 3: Document the feature in CLAUDE.md**

Add a short "Contact form delivery" subsection (near §9 Analytics/consent, since both are env-gated integrations). Cover: the three tiers and their trigger env var; the rule that delivery credentials are Cloudflare secrets, never `PUBLIC_*`; the displayed-vs-recipient split; the Turnstile CSP host; and a pointer to `/deploy` Step 9 for automated wiring. Add `challenges.cloudflare.com` to the CSP note in §14.

- [ ] **Step 4: Verify docs build clean**

Run: `pnpm check:spelling`
Expected: PASS (add any flagged proper nouns like `Turnstile`, `Brevo` to `project-words.txt`).
Run: `node scripts/check-component-docs.mjs --root=src/components`
Expected: PASS (sidecar still valid).

- [ ] **Step 5: Commit**

Run: `git add .env.example src/components/pages/contact.md CLAUDE.md project-words.txt && git commit -m "docs: document contact form delivery tiers and env vars"`

---

## Task 6: Deploy skill — automated contact-form wiring

**Files:**

- Modify: `.claude/skills/deploy/SKILL.md`

- [ ] **Step 1: Add "Step 9: Wire the contact form (optional)"**

After "Step 7: Trigger first deploy" (and before/around the custom-domain step), add an optional Step 9 runbook. It instructs the assistant, using the `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` already collected, to:

1. Ask whether the user wants a working (non-mailto) contact form. If no, stop — mailto is the default.
2. **Create a Turnstile widget** via the Cloudflare API: `POST https://api.cloudflare.com/client/v4/accounts/<account_id>/challenges/widgets` with JSON `{ "name": "<project> contact", "domains": ["<site-domain>"], "mode": "managed" }`, `Authorization: Bearer <token>`. Required token scopes: `Turnstile:Edit` (and `Account Settings:Read`). Capture `sitekey` and `secret` from the response.
3. **Collect provider details** from the user: Brevo API key, a **verified** Brevo sender address (remind them to verify a sender/domain in Brevo first — required for transactional sending), and the recipient inbox.
4. **Set the Pages project env vars** via `PATCH https://api.cloudflare.com/client/v4/accounts/<account_id>/pages/projects/<project>` updating `deployment_configs.production.env_vars` (and `preview` if desired): plain-text `PUBLIC_FORM_ENDPOINT` = `/api/contact` and `PUBLIC_TURNSTILE_SITE_KEY` = the sitekey; `secret_text` entries for `BREVO_API_KEY`, `TURNSTILE_SECRET_KEY` (the widget secret), `CONTACT_RECIPIENT`, `CONTACT_SENDER`. Note that the `PUBLIC_*` ones must be build-time vars so Astro inlines them.
5. **Redeploy** so the new build picks up the public vars.
6. State the single irreducible manual step clearly: the user pasting the Brevo key + verifying a sender; everything else is automated.

Cross-reference the spec and note the showcase deployment (`passionfruit.passion4it.de`) sets `CONTACT_RECIPIENT` to a passion4it inbox.

- [ ] **Step 2: Verify the skill file is well-formed**

Run: `rg "^## Step 9" .claude/skills/deploy/SKILL.md`
Expected: the new heading is present.
Run: `pnpm exec prettier --check .claude/skills/deploy/SKILL.md`
Expected: PASS (or run `--write` then re-check).

- [ ] **Step 3: Commit**

Run: `git add .claude/skills/deploy/SKILL.md && git commit -m "feat: automate contact form wiring in deploy skill"`

---

## Final verification

- [ ] **Full local CI**

Run: `pnpm test`
Expected: bilingual + component-docs + og + **functions** tests all PASS.
Run: `pnpm check:all`
Expected: spelling + a11y + build + link check all PASS.

- [ ] **Tier-1 regression (mailto still works with no config)**

With no `PUBLIC_FORM_ENDPOINT` / `PUBLIC_TURNSTILE_SITE_KEY` set, run `pnpm dev`, open the contact page, confirm: no Turnstile widget renders, the privacy notice shows, and submitting opens a pre-filled mailto. (Manual.)

- [ ] **Open a PR** per CLAUDE.md §15 (squash-merge target `main`). Tier-2 end-to-end is verified on the Cloudflare preview deploy after `/deploy` Step 9 wiring.

---

## Self-review notes

- **Spec coverage:** D1 (Task 2), D2 (already-present env switch; documented Task 5), D3 (Task 1), D4 (Tasks 2+3), D5 (Tasks 5+6 — recipient is deploy config), D6 (handler env in Task 2, deploy secrets Task 6), D7 (no fixtures touched anywhere), D8 (Task 6), D9 (Task 3 privacy notice; no checkbox), D10 (Task 4). GDPR §8 → Task 3 + Task 5 docs. Testing §10 → Tasks 1–2 + Final verification.
- **Deliberate spec deviation:** the spec's optional "spam-check failure message" i18n string is dropped (YAGNI) — the client shows one generic error state, so the handler collapses spam/validation to a single client-visible failure. Noted in the Contracts section.
- **Type consistency:** `sendContactEmail` input fields and the `Env` shape are fixed in Contracts and reused verbatim in Tasks 1–2. `error` values are the closed set `validation | config | delivery`.
