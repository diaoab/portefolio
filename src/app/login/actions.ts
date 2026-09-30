"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { dictionaries, isLocale } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/site-url";
import type { Role } from "@/lib/session";
import { str, type FormState } from "@/lib/utils";

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email", 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = str(formData, "next", 200);

  const t = (await getT()).login;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: t.invalid };
  }
  if (!user.active) return { error: t.disabled };

  await createSession(user.id, user.role as Role);

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : null;
  redirect(safeNext ?? (user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ───────────── Mot de passe oublié ─────────────

const RESET_TTL = 60 * 60 * 1000; // 1 heure
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const email = str(formData, "email", 200).toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  // Même réponse que le compte existe ou non (pas de divulgation des emails inscrits)
  const ok = { ok: true, message: t.forgot.sent };
  if (!user || !user.active) return ok;

  // Anti-abus : 3 demandes max par heure et par compte
  const recent = await db.passwordResetToken.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESET_TTL) } } });
  if (recent >= 3) return ok;

  const token = randomBytes(32).toString("base64url");
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL) },
  });
  const m = dictionaries[isLocale(user.locale) ? user.locale : "fr"].mail;
  await sendMail({
    to: user.email,
    subject: m.resetSubject,
    paragraphs: [m.resetIntro],
    button: { label: m.resetButton, url: `${await siteUrl()}/reset-password/${token}` },
    footer: m.resetIgnore,
  }).catch((e) => console.error("Envoi de l'email de réinitialisation impossible :", e));
  return ok;
}

/** Jeton valide (non expiré) ou null. */
export async function findResetToken(token: string) {
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  return row && row.expiresAt > new Date() ? row : null;
}

export async function resetPasswordWithToken(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const row = await findResetToken(str(formData, "token", 200));
  if (!row) return { error: t.reset.invalid };
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: t.account.tooShort };
  if (next !== String(formData.get("confirm") ?? "")) return { error: t.account.mismatch };

  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(next, 10) } }),
    db.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);
  redirect("/login?reset=1");
}
