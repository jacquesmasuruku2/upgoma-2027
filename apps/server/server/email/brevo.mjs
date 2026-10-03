import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST;
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
  const password = process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASS;
  const port = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587);

  if (!host || !user || !password || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("La configuration Brevo SMTP est incomplète.");
  }

  const fromEmail = process.env.MAIL_FROM || process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL;
  if (!fromEmail) throw new Error("MAIL_FROM doit être configuré pour envoyer des e-mails.");

  const fromName = process.env.MAIL_FROM_NAME || process.env.BREVO_SENDER_NAME;
  const from = fromName && !fromEmail.includes("<")
    ? { name: fromName, address: fromEmail }
    : fromEmail;

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    }),
    from,
  };
}

export async function deliverEmail(message) {
  const { transporter, from } = createTransporter();
  try {
    await transporter.sendMail({ from, ...message });
  } finally {
    transporter.close();
  }
}

export async function deliverEmails(messages) {
  if (!messages.length) return { sent: 0, failed: 0 };

  const { transporter, from } = createTransporter();
  let nextIndex = 0;
  let sent = 0;
  let failed = 0;

  const worker = async () => {
    while (nextIndex < messages.length) {
      const index = nextIndex++;
      try {
        await transporter.sendMail({ from, ...messages[index] });
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error("[email] Message delivery failed:", error instanceof Error ? error.message : "unknown error");
      }
    }
  };

  try {
    await Promise.all(Array.from({ length: Math.min(5, messages.length) }, worker));
  } finally {
    transporter.close();
  }

  return { sent, failed };
}
