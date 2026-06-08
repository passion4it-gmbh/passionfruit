const SENDER_NAME = "Website contact form";

const LOCALE = {
  de: {
    subject: (name: string) => `Kontaktanfrage von ${name}`,
    textContent: (name: string, email: string, message: string) =>
      `Name: ${name}\nE-Mail: ${email}\n\n${message}`,
  },
  en: {
    subject: (name: string) => `Contact form: ${name}`,
    textContent: (name: string, email: string, message: string) =>
      `Name: ${name}\nEmail: ${email}\n\n${message}`,
  },
} as const;

export interface ContactEmailInput {
  name: string;
  email: string;
  message: string;
  recipient: string;
  sender: string;
  apiKey: string;
  senderName?: string;
  lang?: "de" | "en";
}

export async function sendContactEmail(
  input: ContactEmailInput,
): Promise<void> {
  const { name, email, message, recipient, sender, apiKey, senderName } = input;
  const l = input.lang === "de" ? "de" : "en";

  const body = {
    sender: { email: sender, name: senderName ?? SENDER_NAME },
    to: [{ email: recipient }],
    replyTo: { email, name },
    subject: LOCALE[l].subject(name),
    textContent: LOCALE[l].textContent(name, email, message),
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Brevo API request failed with status ${response.status}`);
  }
}
