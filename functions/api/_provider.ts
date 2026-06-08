const SENDER_NAME = "passionfruit contact form";

export interface ContactEmailInput {
  name: string;
  email: string;
  message: string;
  recipient: string;
  sender: string;
  apiKey: string;
}

export async function sendContactEmail(
  input: ContactEmailInput,
): Promise<void> {
  const { name, email, message, recipient, sender, apiKey } = input;

  const body = {
    sender: { email: sender, name: SENDER_NAME },
    to: [{ email: recipient }],
    replyTo: { email, name },
    subject: `Contact form: ${name}`,
    textContent: `${message}\n\nReply to: ${email}`,
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
