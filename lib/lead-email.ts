import "server-only";
import { createTransport, type Transporter } from "nodemailer";

/* ------------------------------------------------------------------ */
/* LEAD NOTIFICATION EMAIL                                             */
/* ------------------------------------------------------------------ */
/*
 * SMTP (any provider, e.g. Gmail app password, Zoho, Brevo free SMTP):
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEAD_NOTIFY_EMAIL, and
 * optionally SMTP_FROM. Falls back to Resend (RESEND_API_KEY) for older
 * setups. With neither configured, it logs a warning and returns — the
 * lead is saved either way, and a failed email never fails a request.
 */

export type LeadEmail = { subject: string; text: string; replyTo?: string };

const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.LEAD_NOTIFY_EMAIL);

const resendConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.LEAD_NOTIFY_EMAIL);

const recipients = () => process.env.LEAD_NOTIFY_EMAIL!.split(",").map((email) => email.trim());

let transport: Transporter | null = null;

function smtp(): Transporter {
  const port = Number(process.env.SMTP_PORT) || 587;
  transport ??= createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 587/25 upgrade with STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transport;
}

export async function sendLeadEmail({ subject, text, replyTo }: LeadEmail): Promise<void> {
  try {
    if (smtpConfigured()) {
      await smtp().sendMail({
        from: process.env.SMTP_FROM || `Jaseir leads <${process.env.SMTP_USER}>`,
        to: recipients(),
        replyTo,
        subject,
        text,
      });
      return;
    }

    if (resendConfigured()) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.LEAD_NOTIFY_FROM || "Jaseir leads <onboarding@resend.dev>",
          to: recipients(),
          reply_to: replyTo,
          subject,
          text,
        }),
        cache: "no-store",
      });
      if (!response.ok) console.error(`[leads] Resend ${response.status}: ${(await response.text()).slice(0, 200)}`);
      return;
    }

    console.warn(
      `[leads] email not sent (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and LEAD_NOTIFY_EMAIL): ${subject}`,
    );
  } catch (error) {
    console.error("[leads] email failed:", error);
  }
}
