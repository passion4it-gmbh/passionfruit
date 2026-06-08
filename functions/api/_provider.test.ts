import { test, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import { sendContactEmail, type ContactEmailInput } from "./_provider.js";

const SAMPLE_INPUT: ContactEmailInput = {
  name: "Alice Example",
  email: "alice@example.com",
  message: "Hello, I have a question.",
  recipient: "owner@site.com",
  sender: "noreply@site.com",
  apiKey: "test-api-key-123",
};

const originalFetch: typeof globalThis.fetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("sendContactEmail calls Brevo API with correct payload", async () => {
  const mockFetch = mock.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(null, { status: 201 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  await sendContactEmail(SAMPLE_INPUT);

  assert.equal(mockFetch.mock.calls.length, 1);

  const [url, init] = mockFetch.mock.calls[0].arguments as [
    string,
    RequestInit,
  ];
  assert.equal(url, "https://api.brevo.com/v3/smtp/email");
  assert.equal((init.method ?? "").toUpperCase(), "POST");

  const headers = new Headers(init.headers as HeadersInit);
  assert.equal(headers.get("api-key"), SAMPLE_INPUT.apiKey);

  const body = JSON.parse(init.body as string) as {
    to: Array<{ email: string }>;
    sender: { email: string };
    replyTo: { email: string; name: string };
    subject: string;
    textContent: string;
  };
  assert.equal(body.to[0].email, SAMPLE_INPUT.recipient);
  assert.equal(body.sender.email, SAMPLE_INPUT.sender);
  assert.equal(body.sender.name, "Website contact form");
  assert.equal(body.replyTo.email, SAMPLE_INPUT.email);
  assert.equal(body.replyTo.name, SAMPLE_INPUT.name);
  assert.equal(body.subject, `Contact form: ${SAMPLE_INPUT.name}`);
  assert.ok(body.textContent.includes(`Name: ${SAMPLE_INPUT.name}`));
  assert.ok(body.textContent.includes(`Email: ${SAMPLE_INPUT.email}`));
  assert.ok(body.textContent.includes(SAMPLE_INPUT.message));
});

test("sendContactEmail uses German subject and labels when lang is de", async () => {
  const mockFetch = mock.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(null, { status: 201 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  await sendContactEmail({ ...SAMPLE_INPUT, lang: "de" });

  const [, init] = mockFetch.mock.calls[0].arguments as [string, RequestInit];
  const body = JSON.parse(init.body as string) as {
    subject: string;
    textContent: string;
  };
  assert.equal(body.subject, `Kontaktanfrage von ${SAMPLE_INPUT.name}`);
  assert.ok(body.textContent.includes(`E-Mail: ${SAMPLE_INPUT.email}`));
  assert.ok(body.textContent.includes(SAMPLE_INPUT.message));
});

test("sendContactEmail uses custom senderName when provided", async () => {
  const mockFetch = mock.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(null, { status: 201 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  await sendContactEmail({ ...SAMPLE_INPUT, senderName: "Acme Contact Form" });

  const [, init] = mockFetch.mock.calls[0].arguments as [string, RequestInit];
  const body = JSON.parse(init.body as string) as {
    sender: { name: string };
  };
  assert.equal(body.sender.name, "Acme Contact Form");
});

test("sendContactEmail rejects on non-2xx response", async () => {
  const mockFetch = mock.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(null, { status: 400 })),
  );
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

  await assert.rejects(() => sendContactEmail(SAMPLE_INPUT), /400/);
});
