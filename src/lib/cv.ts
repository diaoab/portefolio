import type { Profile } from "@prisma/client";
import type { Dict } from "./i18n";
import { splitList } from "./utils";

export type CvEntry = { heading: string; details: string };

/** Découpe un champ de parcours : un bloc par entrée (séparés par une ligne vide), 1re ligne = intitulé. */
export function parseEntries(value: string): CvEntry[] {
  return value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [heading = "", ...rest] = block.split("\n");
      return { heading: heading.trim(), details: rest.join("\n").trim() };
    });
}

/** « 2021 – 2023 · Développeuse · Wave » → période, intitulé, structure. */
export function splitHeading(heading: string) {
  const parts = heading.split(/\s+[·|•]\s+/).map((p) => p.trim()).filter(Boolean);
  const hasPeriod = parts.length > 1 && /\d/.test(parts[0]!);
  const [period, title, ...org] = hasPeriod ? parts : ["", ...parts];
  return { period: period ?? "", title: title ?? heading, org: org.join(" · ") };
}

export type CvItem = { period: string; role: string; org: string; description: string };

/** Texte stocké → entrées structurées (pour l'éditeur guidé). */
export function toItems(value: string): CvItem[] {
  return parseEntries(value).map((e) => {
    const h = splitHeading(e.heading);
    return { period: h.period, role: h.title, org: h.org, description: e.details };
  });
}

/** Entrées structurées → texte stocké (une entrée par bloc, 1re ligne = « période · poste · structure »). */
export function fromItems(items: CvItem[]) {
  return items
    .map((i) => ({ ...i, heading: [i.period, i.role, i.org].map((x) => x.trim().replace(/\s+/g, " ")).filter(Boolean).join(" · ") }))
    .filter((i) => i.heading || i.description.trim())
    .map((i) => [i.heading, i.description.trim().replace(/\n\s*\n+/g, "\n")].filter(Boolean).join("\n"))
    .join("\n\n");
}

export const CV_TEMPLATES = ["modern", "classic", "minimal"] as const;
export type CvTemplate = (typeof CV_TEMPLATES)[number];
export const isCvTemplate = (v: unknown): v is CvTemplate => CV_TEMPLATES.includes(v as CvTemplate);

type CvFields = Pick<Profile, "fullName" | "headline" | "bio" | "skills" | "experience" | "education">;

/** Éléments manquants pour que le CV soit considéré comme terminé. */
export function cvMissing(p: CvFields, t: Dict): string[] {
  const n = t.cv.needs;
  return [
    !p.fullName.trim() && n.fullName,
    !p.headline.trim() && n.headline,
    !p.bio.trim() && n.bio,
    !splitList(p.skills).length && n.skills,
    !parseEntries(p.experience).length && !parseEntries(p.education).length && n.path,
  ].filter((x): x is string => !!x);
}

export const isCvComplete = (p: CvFields) =>
  !!(p.fullName.trim() && p.headline.trim() && p.bio.trim() && splitList(p.skills).length) &&
  (parseEntries(p.experience).length > 0 || parseEntries(p.education).length > 0);

export const cvUrl = (slug: string, lang: string, extra: Record<string, string> = {}) =>
  `/api/cv/${slug}?${new URLSearchParams({ lang, ...extra })}`;
