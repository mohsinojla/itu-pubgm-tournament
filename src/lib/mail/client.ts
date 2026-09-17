import nodemailer, { type Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

export const FROM_EMAIL = process.env.GMAIL_USER
  ? `"ITU × PUBGM Supremacy Cup" <${process.env.GMAIL_USER}>`
  : undefined;

/**
 * Sends an email via Gmail SMTP. Returns { error } instead of throwing so
 * callers can't accidentally treat a failed send as a success (the bug that
 * bit the previous Resend-based sender).
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ error: Error | null }> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { error: new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not configured") };
  }

  try {
    await getTransporter().sendMail({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
