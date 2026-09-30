import "server-only";
import nodemailer from "nodemailer";
import { getSettings } from "./settings";

/**
 * Envoi d'emails via SMTP (Brevo, Resend, Mailgun, Gmail…) configuré dans .env.
 * Sans configuration SMTP, l'email est affiché dans la console du serveur (pratique en local).
 */
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

type Mail = {
  to: string;
  subject: string;
  /** Paragraphes du message (texte brut, échappé automatiquement). */
  paragraphs: string[];
  /** Citation mise en valeur (ex. le message d'un visiteur). */
  quote?: string;
  button?: { label: string; url: string };
  replyTo?: string;
  footer?: string;
};

export async function sendMail({ to, subject, paragraphs, quote, button, replyTo, footer }: Mail) {
  const { siteName } = await getSettings();
  const text = [...paragraphs, quote ? `\n« ${quote} »\n` : "", button ? `${button.label} : ${button.url}` : "", footer ?? ""]
    .filter(Boolean)
    .join("\n\n");

  if (!transport) {
    console.info(`\n📧 [email non envoyé — SMTP non configuré]\nÀ : ${to}\nObjet : ${subject}\n\n${text}\n`);
    return;
  }

  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d2030">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden">
    <tr><td style="background:#111114;padding:18px 28px;color:#ffffff;font-weight:700;font-size:16px">${escape(siteName)}</td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 16px;font-size:19px">${escape(subject)}</h1>
      ${paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.6;color:#4a4f63">${escape(p)}</p>`).join("")}
      ${quote ? `<blockquote style="margin:18px 0;padding:14px 16px;border-left:3px solid #7c5cff;background:#f6f4ff;border-radius:6px;white-space:pre-wrap;line-height:1.6">${escape(quote)}</blockquote>` : ""}
      ${button ? `<p style="margin:24px 0 8px"><a href="${escape(button.url)}" style="display:inline-block;background:#7c5cff;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${escape(button.label)}</a></p>` : ""}
    </td></tr>
    ${footer ? `<tr><td style="padding:16px 28px;border-top:1px solid #ececf2;font-size:12px;color:#8a8fa3">${escape(footer)}</td></tr>` : ""}
  </table></td></tr></table></body></html>`;

  await transport.sendMail({
    from: process.env.MAIL_FROM || `${siteName} <no-reply@localhost>`,
    to,
    subject,
    text,
    html,
    replyTo,
  });
}
