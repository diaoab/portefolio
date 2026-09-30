import "server-only";
import { cache } from "react";
import { db } from "./db";
import { getLocale } from "./i18n-server";

/**
 * Paramètres du site (créés avec les valeurs par défaut au premier appel).
 * Plusieurs requêtes simultanées peuvent tenter la création : on relit simplement la ligne en cas de conflit.
 */
export const getSettings = cache(async () => {
  const existing = await db.siteSettings.findUnique({ where: { id: "site" } });
  if (existing) return existing;
  try {
    return await db.siteSettings.create({ data: { id: "site" } });
  } catch {
    return db.siteSettings.findUniqueOrThrow({ where: { id: "site" } });
  }
});

/** Textes du site dans la langue courante (repli sur le français si la version anglaise est vide). */
export const getLocalizedSettings = cache(async () => {
  const s = await getSettings();
  if ((await getLocale()) !== "en") return s;
  return {
    ...s,
    heroTitle: s.heroTitleEn || s.heroTitle,
    heroTitleLine2: s.heroTitleEn ? s.heroTitleLine2En : s.heroTitleLine2,
    heroDescription: s.heroDescriptionEn || s.heroDescription,
    metaDescription: s.metaDescriptionEn || s.metaDescription,
    footerText: s.footerTextEn || s.footerText,
    legalText: s.legalTextEn || s.legalText,
    privacyText: s.privacyTextEn || s.privacyText,
  };
});
