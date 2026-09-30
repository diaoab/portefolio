"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";
import { db } from "./db";
import { isLocale, LOCALE_COOKIE } from "./i18n";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  // Les emails envoyés à l'utilisateur suivent la langue qu'il a choisie
  const user = await getCurrentUser();
  if (user && user.locale !== locale) await db.user.update({ where: { id: user.id }, data: { locale } });
  revalidatePath("/", "layout");
}
