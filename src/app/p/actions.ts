"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { dictionaries, isLocale } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { sendMail } from "@/lib/mail";
import { visibleProfile } from "@/lib/public";
import { siteUrl } from "@/lib/site-url";
import { str, type FormState } from "@/lib/utils";

const WINDOW = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/** Vérifie le captcha Cloudflare Turnstile quand il est configuré. */
async function captchaOk(formData: FormData, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: str(formData, "cf-turnstile-response", 4096), remoteip: ip }),
  }).catch(() => null);
  return !!res && ((await res.json()) as { success?: boolean }).success === true;
}

export async function sendMessage(_: FormState, formData: FormData): Promise<FormState> {
  const t = (await getT()).contact;
  // Champ piège invisible : rempli uniquement par les robots.
  if (str(formData, "website")) return { ok: true, message: t.sent };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  // Anti-spam persistant : l'IP est hachée (jamais stockée en clair) et comptée en base
  const ipHash = createHash("sha256").update(`${process.env.AUTH_SECRET}:${ip}`).digest("hex").slice(0, 32);
  const recent = await db.message.count({ where: { ipHash, createdAt: { gt: new Date(Date.now() - WINDOW) } } });
  if (recent >= MAX_PER_WINDOW) return { error: t.tooMany };
  if (!(await captchaOk(formData, ip))) return { error: (await getT()).spam.captcha };

  const name = str(formData, "name", 120);
  const email = str(formData, "email", 200);
  const subject = str(formData, "subject", 200);
  const body = str(formData, "body", 5000);

  if (!name || !body) return { error: t.required };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t.invalidEmail };

  const profile = await db.profile.findFirst({
    where: { slug: str(formData, "slug", 60), ...visibleProfile },
    include: { user: { select: { email: true, locale: true } } },
  });
  if (!profile) return { error: t.unavailable };

  await db.message.create({ data: { toUserId: profile.userId, name, email, subject, body, ipHash } });

  if (profile.notifyEmail) {
    const m = dictionaries[isLocale(profile.user.locale) ? profile.user.locale : "fr"].mail;
    await sendMail({
      to: profile.user.email,
      replyTo: `${name.replace(/[<>"]/g, "")} <${email}>`,
      subject: m.newMessageSubject(name),
      paragraphs: [m.newMessageIntro(name, email), ...(subject ? [m.subjectLine(subject)] : [])],
      quote: body,
      button: { label: m.openInbox, url: `${await siteUrl()}/dashboard/messages` },
      footer: `${m.replyHint} ${m.notifyFooter}`,
    }).catch((e) => console.error("Notification email impossible :", e));
  }
  return { ok: true, message: t.thanks(name, profile.fullName) };
}
