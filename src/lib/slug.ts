import "server-only";
import { db } from "./db";
import { slugify } from "./utils";

const RESERVED = new Set(["admin", "dashboard", "login", "api", "new"]);

/** Renvoie un slug libre dérivé de `base` (ajoute -2, -3… si besoin). */
export async function uniqueSlug(base: string, excludeUserId?: string) {
  const root = slugify(base) || "portfolio";
  for (let i = 1; ; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    if (RESERVED.has(candidate)) continue;
    const taken = await db.profile.findUnique({ where: { slug: candidate } });
    if (!taken || taken.userId === excludeUserId) return candidate;
  }
}
