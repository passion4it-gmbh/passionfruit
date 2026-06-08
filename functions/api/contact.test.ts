import { test, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import { onRequestPost } from "./contact.js";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const FULL_ENV = {
  CONTACT_RECIPIENT: "owner@site.com",
  CONTACT_SENDER: "noreply@site.com",
  BREVO_API_KEY: "test-api-key-123",
};

const VALID_BODY = {
  name: "Alice Example",
  email: "alice@example.com",
  message: "Hello, I have a question.",
};

function makeContext(
  payload: Record<string, string | undefined>,
  env: Record<string, string | undefined>,
): Parameters<typeof onRequestPost>[0] {
  const request = new Request("https://x/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { request, env } as unknown as Parameters<typeof onRequestPost>[0];
}

const originalFetch: typeof globalThis.fetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// 1. Honeypot non-empty → 200 ok:true, Brevo NOT called
test("honeypot: non-empty string → silent drop, no Brevo call", async () => {
  const mockFetch = mock.fn(() =>
    Promise.resolve(new Response(null, { status: 201 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  const ctx = makeContext({ ...VALID_BODY, honeypot: "x" }, FULL_ENV);
  const response: Response = await onRequestPost(ctx);

  assert.equal(response.status, 200);
  const body = (await response.json()) as { ok: boolean };
  assert.equal(body.ok, true);

  const brevoCall = mockFetch.mock.calls.find(
    (c) => (c.arguments[0] as string) === BREVO_URL,
  );
  assert.equal(brevoCall, undefined);
});

// 2. No TURNSTILE_SECRET_KEY → siteverify not called, Brevo called once, 200 ok:true
test("no turnstile secret: skips siteverify, sends to Brevo", async () => {
  const mockFetch = mock.fn(() =>
    Promise.resolve(new Response(null, { status: 201 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  const ctx = makeContext(VALID_BODY, FULL_ENV);
  const response: Response = await onRequestPost(ctx);

  assert.equal(response.status, 200);
  const body = (await response.json()) as { ok: boolean };
  assert.equal(body.ok, true);

  const siteverifyCalls = mockFetch.mock.calls.filter(
    (c) => (c.arguments[0] as string) === SITEVERIFY_URL,
  );
  assert.equal(siteverifyCalls.length, 0);

  const brevoCalls = mockFetch.mock.calls.filter(
    (c) => (c.arguments[0] as string) === BREVO_URL,
  );
  assert.equal(brevoCalls.length, 1);
});

// 3. Turnstile secret set, siteverify returns success:false → 400 validation, Brevo NOT called
test("turnstile: siteverify fails → 400 validation, no Brevo call", async () => {
  const mockFetch = mock.fn((url: string) => {
    if (url === SITEVERIFY_URL) {
      return Promise.resolve(
        new Response(JSON.stringify({ success: false }), { status: 200 }),
      );
    }
    return Promise.resolve(new Response(null, { status: 201 }));
  });
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  const ctx = makeContext(
    { ...VALID_BODY, turnstileToken: "bad-token" },
    { ...FULL_ENV, TURNSTILE_SECRET_KEY: "ts-secret" },
  );
  const response: Response = await onRequestPost(ctx);

  assert.equal(response.status, 400);
  const body = (await response.json()) as { ok: boolean; error: string };
  assert.equal(body.ok, false);
  assert.equal(body.error, "validation");

  const brevoCalls = mockFetch.mock.calls.filter(
    (c) => (c.arguments[0] as string) === BREVO_URL,
  );
  assert.equal(brevoCalls.length, 0);
});

// 4. Turnstile secret set, siteverify returns success:true → Brevo called once, 200 ok:true
test("turnstile: siteverify succeeds → Brevo called, 200 ok:true", async () => {
  const mockFetch = mock.fn((url: string) => {
    if (url === SITEVERIFY_URL) {
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );
    }
    return Promise.resolve(new Response(null, { status: 201 }));
  });
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  const ctx = makeContext(
    { ...VALID_BODY, turnstileToken: "good-token" },
    { ...FULL_ENV, TURNSTILE_SECRET_KEY: "ts-secret" },
  );
  const response: Response = await onRequestPost(ctx);

  assert.equal(response.status, 200);
  const body = (await response.json()) as { ok: boolean };
  assert.equal(body.ok, true);

  const brevoCalls = mockFetch.mock.calls.filter(
    (c) => (c.arguments[0] as string) === BREVO_URL,
  );
  assert.equal(brevoCalls.length, 1);
});

// 5a. Validation: missing message → 400 validation
test("validation: missing message → 400 validation", async () => {
  const mockFetch = mock.fn(() =>
    Promise.resolve(new Response(null, { status: 201 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  const ctx = makeContext(
    { name: "Alice", email: "alice@example.com" },
    FULL_ENV,
  );
  const response: Response = await onRequestPost(ctx);

  assert.equal(response.status, 400);
  const body = (await response.json()) as { ok: boolean; error: string };
  assert.equal(body.ok, false);
  assert.equal(body.error, "validation");

  const brevoCalls = mockFetch.mock.calls.filter(
    (c) => (c.arguments[0] as string) === BREVO_URL,
  );
  assert.equal(brevoCalls.length, 0);
});

// 5b. Validation: invalid email → 400 validation
test("validation: invalid email → 400 validation", async () => {
  const mockFetch = mock.fn(() =>
    Promise.resolve(new Response(null, { status: 201 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  const ctx = makeContext(
    { name: "Alice", email: "nope", message: "Hello" },
    FULL_ENV,
  );
  const response: Response = await onRequestPost(ctx);

  assert.equal(response.status, 400);
  const body = (await response.json()) as { ok: boolean; error: string };
  assert.equal(body.ok, false);
  assert.equal(body.error, "validation");

  const brevoCalls = mockFetch.mock.calls.filter(
    (c) => (c.arguments[0] as string) === BREVO_URL,
  );
  assert.equal(brevoCalls.length, 0);
});

// 5c. Validation: message too long → 400 validation
test("validation: message > 5000 chars → 400 validation", async () => {
  const mockFetch = mock.fn(() =>
    Promise.resolve(new Response(null, { status: 201 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  const ctx = makeContext(
    { name: "Alice", email: "alice@example.com", message: "x".repeat(5001) },
    FULL_ENV,
  );
  const response: Response = await onRequestPost(ctx);

  assert.equal(response.status, 400);
  const body = (await response.json()) as { ok: boolean; error: string };
  assert.equal(body.ok, false);
  assert.equal(body.error, "validation");

  const brevoCalls = mockFetch.mock.calls.filter(
    (c) => (c.arguments[0] as string) === BREVO_URL,
  );
  assert.equal(brevoCalls.length, 0);
});

// 7. Locale forwarding: lang:"de" → subject starts with "Kontaktanfrage von"
test("forwards de locale → German subject to Brevo", async () => {
  let capturedInit: RequestInit | undefined;
  const mockFetch = mock.fn((url: string, init?: RequestInit) => {
    if (url === BREVO_URL) {
      capturedInit = init;
    }
    return Promise.resolve(new Response(null, { status: 201 }));
  });
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  const ctx = makeContext({ ...VALID_BODY, lang: "de" }, FULL_ENV);
  const response: Response = await onRequestPost(ctx);

  assert.equal(response.status, 200);
  const responseBody = (await response.json()) as { ok: boolean };
  assert.equal(responseBody.ok, true);

  assert.ok(capturedInit?.body, "Brevo request body should be captured");
  const brevoPayload = JSON.parse(capturedInit!.body as string) as {
    subject: string;
  };
  assert.ok(
    brevoPayload.subject.startsWith("Kontaktanfrage von"),
    `Expected German subject, got: ${brevoPayload.subject}`,
  );
});

// 6. Config: missing BREVO_API_KEY → 500 config, Brevo not called
test("config: missing BREVO_API_KEY → 500 config", async () => {
  const mockFetch = mock.fn(() =>
    Promise.resolve(new Response(null, { status: 201 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  const { BREVO_API_KEY: _omitted, ...envWithoutKey } = FULL_ENV;
  const ctx = makeContext(VALID_BODY, envWithoutKey);
  const response: Response = await onRequestPost(ctx);

  assert.equal(response.status, 500);
  const body = (await response.json()) as { ok: boolean; error: string };
  assert.equal(body.ok, false);
  assert.equal(body.error, "config");

  const brevoCalls = mockFetch.mock.calls.filter(
    (c) => (c.arguments[0] as string) === BREVO_URL,
  );
  assert.equal(brevoCalls.length, 0);
});
