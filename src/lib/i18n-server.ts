import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, dictionaries, isLocale, LOCALE_COOKIE, type Locale } from "./i18n";

/** Langue choisie (cookie), sinon celle du navigateur, sinon le français. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^en\b/i.test(accept) ? "en" : DEFAULT_LOCALE;
});

export async function getT() {
  return dictionaries[await getLocale()];
}
