# Contact Form Consolidation — Part A (locale-aware email) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the template's contact-form notification email locale-aware (DE/EN by the submission's page locale), folded into the existing PR #35 branch so the canonical feature lands complete before `passionfruit-site` forks it.

**Architecture:** The form already knows its `lang`; send it in the POST body. The handler normalizes it to `"de" | "en"` and forwards it to the provider. The provider builds a parallel, localized subject + labelled body from a small self-contained map (email copy stays in the function — it is internal ops text, not site i18n).

**Tech Stack:** Astro 6 contact component (inline TS script), Cloudflare Pages Function, Brevo transactional email, node:test via tsx.

> **No-code-in-plan note:** Per the maintainer's standing rule, this plan describes tests and implementations in precise prose, not code blocks. Exact paths, commands, and expected outputs are given.

**Spec:** `docs/superpowers/specs/2026-06-08-contact-form-consolidation-design.md` (Part A, §4)
**Branch:** `feat/contact-form-delivery` (current; extends PR #35)

---

## File structure

Modified only (no new files):

- `functions/api/_provider.ts` — `ContactEmailInput` gains optional `lang`; subject + `textContent` become locale-aware via a small inline localized builder.
- `functions/api/_provider.test.ts` — update the existing payload assertions to the new body format; add a DE-locale test and confirm the default (no `lang`) is EN.
- `functions/api/contact.ts` — `ContactBody` gains optional `lang`; normalize to `"de" | "en"` and pass to `sendContactEmail`.
- `functions/api/contact.test.ts` — add a test that a `lang: "de"` submission produces a German subject in the Brevo call.
- `src/components/pages/contact.astro` — add `data-lang={lang}` to the form; the inline script reads it and includes `lang` in the POST body.

---

## Contract (define once; referenced by all tasks)

**Localized email content** — given `lang` (`"de" | "en"`) and `{ name, email, message }`:

- **DE:** subject = `Kontaktanfrage von <name>`; `textContent` = three parts joined by newlines: `Name: <name>`, `E-Mail: <email>`, then a blank line followed by `<message>`.
- **EN:** subject = `Contact form: <name>`; `textContent` = `Name: <name>`, `Email: <email>`, blank line, `<message>`.

Both languages use the same structure (labelled name/email + the message); only the labels and subject differ. The Brevo `replyTo` (the submitter) is unchanged and still carries the address for one-click reply — so dropping the old EN `Reply to:` body line loses nothing.

**`lang` plumbing:**

- `ContactEmailInput.lang?: "de" | "en"`. In `sendContactEmail`, normalize: treat `lang === "de"` as German, anything else (including `undefined`) as English.
- `ContactBody.lang?: string` in the handler. The handler computes `const lang: "de" | "en" = body.lang === "de" ? "de" : "en"` and passes it into `sendContactEmail`.
- The client sends `lang` from the form's `data-lang` attribute (the component already has the `lang` prop).

Everything else in the provider (neutral `SENDER_NAME` default, `senderName` override, `sender`/`to`/`replyTo`/headers/throw-on-non-2xx) and handler (6-step control flow, env, secrets) is UNCHANGED.

---

## Task A1: Provider — locale-aware subject and body

**Files:**

- Modify: `functions/api/_provider.ts`
- Modify: `functions/api/_provider.test.ts`

- [ ] **Step 1: Update the existing test to the new EN body format, and add the DE-locale test (red)**

In `functions/api/_provider.test.ts`:

- In the existing "calls Brevo API with correct payload" test, replace the two `textContent` assertions (currently: includes `message`, and includes `Reply to: <email>`) with assertions for the new EN default format: `body.textContent` includes `Name: Alice Example`, includes `Email: alice@example.com`, and includes the message; keep `body.subject` equal to `Contact form: Alice Example`. (SAMPLE_INPUT has no `lang`, so it must default to EN.)
- Add a new test "uses German subject and labels when lang is de": call `sendContactEmail({ ...SAMPLE_INPUT, lang: "de" })`, parse the Brevo body, assert `body.subject` equals `Kontaktanfrage von Alice Example`, and `body.textContent` includes `E-Mail: alice@example.com` (the German label) and the message.

- [ ] **Step 2: Run the provider tests — expect failure**

Run: `pnpm exec tsx --test functions/api/_provider.test.ts`
Expected: FAIL — the EN body no longer matches (old code emits `... Reply to:`), and `lang` is not yet a field / German branch not implemented.

- [ ] **Step 3: Implement the locale-aware provider**

In `functions/api/_provider.ts`:

- Add `lang?: "de" | "en"` to `ContactEmailInput`.
- Add a small inline localized builder (a `const` record keyed by `"de"`/`"en"`, or a tiny helper) producing `{ subject, textContent }` per the Contract above.
- In `sendContactEmail`, normalize `const l = input.lang === "de" ? "de" : "en"`, build `subject` and `textContent` from the localized content for `l`, and use them in the Brevo `body`. Leave `sender` (with `senderName ?? SENDER_NAME`), `to`, `replyTo`, headers, and the non-2xx throw unchanged.

- [ ] **Step 4: Run the provider tests — expect pass**

Run: `pnpm exec tsx --test functions/api/_provider.test.ts`
Expected: PASS (4 tests: the updated payload test, the new DE test, the custom-senderName test, the non-2xx rejection test).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (no `any`; `lang` is the `"de" | "en"` union).

- [ ] **Step 6: Commit**

Run: `git add functions/api/_provider.ts functions/api/_provider.test.ts && git commit -m "feat: locale-aware contact notification email (provider)"`

---

## Task A2: Handler — forward the submission locale

**Files:**

- Modify: `functions/api/contact.ts`
- Modify: `functions/api/contact.test.ts`

- [ ] **Step 1: Add the failing handler test (red)**

In `functions/api/contact.test.ts`: add a test "forwards de locale → German subject to Brevo". Build a context with a valid body that also includes `lang: "de"`, a full valid env, and NO `TURNSTILE_SECRET_KEY` (so Turnstile is skipped). Stub `globalThis.fetch` so the Brevo call (`https://api.brevo.com/v3/smtp/email`) succeeds; capture the request init. Call `onRequestPost`; assert the response is 200 `ok:true` and that the captured Brevo request body's `subject` starts with `Kontaktanfrage von`. (Mirror the existing helper/stub style in this file.)

- [ ] **Step 2: Run — expect failure**

Run: `pnpm exec tsx --test functions/api/contact.test.ts`
Expected: FAIL — the handler does not yet forward `lang`, so the subject is the English default.

- [ ] **Step 3: Implement forwarding**

In `functions/api/contact.ts`:

- Add `lang?: string` to the `ContactBody` interface.
- After validation, compute `const lang: "de" | "en" = body.lang === "de" ? "de" : "en"`.
- Add `lang` to the `sendContactEmail({ ... })` call (alongside the existing fields).
  Nothing else in the control flow changes.

- [ ] **Step 4: Run handler tests — expect pass**

Run: `pnpm exec tsx --test functions/api/contact.test.ts`
Expected: PASS (all prior cases plus the new DE-forwarding test).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

Run: `git add functions/api/contact.ts functions/api/contact.test.ts && git commit -m "feat: forward submission locale to contact email provider"`

---

## Task A3: Component — send the page locale in the POST

**Files:**

- Modify: `src/components/pages/contact.astro`

- [ ] **Step 1: Add `data-lang` to the form and send it**

In `src/components/pages/contact.astro`:

- On the `<form id="contact-form" ...>` element, add `data-lang={lang}` alongside the existing `data-*` attributes (the component already receives `lang: Locale` in props).
- In the inline submit `<script>`, read it once near the other `form.dataset.*` reads: `const lang = form.dataset.lang ?? "en";`.
- Add `lang` to the POST body object (the one currently `{ name, email, message, honeypot, turnstileToken }`) so it becomes `{ name, email, message, honeypot, turnstileToken, lang }`. The mailto fallback branch is unchanged.

- [ ] **Step 2: Typecheck + build**

Run: `pnpm typecheck`
Expected: PASS.
Run: `pnpm build`
Expected: PASS (lint, bilingual check, astro build).

- [ ] **Step 3: Commit**

Run: `git add src/components/pages/contact.astro && git commit -m "feat: send page locale with contact form submission"`

---

## Final verification

- [ ] **Full functions suite + build**

Run: `pnpm exec tsx --test 'functions/api/*.test.ts'`
Expected: all PASS (provider incl. DE branch; handler incl. DE forwarding).
Run: `pnpm build`
Expected: PASS.

- [ ] **Push to PR #35**

Run: `git push` (branch already tracks `origin/feat/contact-form-delivery`; this updates PR #35).

---

## Self-review notes

- **Spec coverage (Part A, §4):** D2 (folded into PR #35 branch) — all commits land on `feat/contact-form-delivery`. D3 (localized map in `_provider.ts`, parallel labelled body) — Task A1. D7 (de vs else→en fallback) — Contract + Tasks A1/A2. Component `data-lang` + body field — Task A3.
- **Deliberate behaviour change:** the EN notification body changes from `<message>\n\nReply to: <email>` to the labelled `Name:/Email:` + message format, for parallelism with DE. `replyTo` still carries the address, so reply-by-one-click is unaffected. The existing test assertion for `Reply to:` is updated in Task A1 Step 1 (not left to break).
- **Type consistency:** `lang` is `"de" | "en"` in `ContactEmailInput` and the handler's normalized local; `ContactBody.lang` is the raw optional `string` from the wire, normalized before use. No `any`.
- **Part B is a separate plan.** Site convergence (`passionfruit-site`) is written as its own plan AFTER this merges to template `main`, because its git-merge mechanics depend on the site's current branch state (per spec §5 / §8).
