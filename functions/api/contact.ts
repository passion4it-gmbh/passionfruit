import { sendContactEmail } from "./_provider.js";

export interface Env {
  CONTACT_RECIPIENT?: string;
  CONTACT_SENDER?: string;
  BREVO_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_SENDER_NAME?: string;
}

interface ContactBody {
  name?: string;
  email?: string;
  message?: string;
  honeypot?: string;
  turnstileToken?: string;
  lang?: string;
}

type JsonErrorCode = "validation" | "config" | "delivery";

function json(
  body: { ok: boolean; error?: JsonErrorCode },
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Spam protection: Turnstile + honeypot + Cloudflare edge limits — no app-level rate limiting by design.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Parse JSON
  let body: ContactBody;
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return json({ ok: false, error: "validation" }, 400);
  }

  // 2. Honeypot
  if (body.honeypot) {
    return json({ ok: true }, 200);
  }

  // 3. Turnstile (gated)
  if (env.TURNSTILE_SECRET_KEY) {
    const params = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: body.turnstileToken ?? "",
    });
    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: params },
    );
    const { success } = (await verifyRes.json()) as { success: boolean };
    if (!success) {
      return json({ ok: false, error: "validation" }, 400);
    }
  }

  // 4. Validate
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();

  if (
    !name ||
    !email ||
    !message ||
    !EMAIL_RE.test(email) ||
    name.length > 100 ||
    email.length > 254 ||
    message.length > 5000
  ) {
    return json({ ok: false, error: "validation" }, 400);
  }

  // 5. Config
  const recipient = env.CONTACT_RECIPIENT;
  const sender = env.CONTACT_SENDER;
  const apiKey = env.BREVO_API_KEY;

  if (!recipient || !sender || !apiKey) {
    return json({ ok: false, error: "config" }, 500);
  }

  // 6. Dispatch
  const lang: "de" | "en" = body.lang === "de" ? "de" : "en";
  try {
    await sendContactEmail({
      name,
      email,
      message,
      recipient,
      sender,
      apiKey,
      senderName: env.CONTACT_SENDER_NAME,
      lang,
    });
  } catch {
    return json({ ok: false, error: "delivery" }, 502);
  }

  return json({ ok: true }, 200);
};
