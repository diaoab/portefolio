import type { Profile, Project } from "@prisma/client";
import type { Locale } from "./i18n";

const pick = (fr: string, en: string, locale: Locale) => (locale === "en" && en.trim() ? en : fr);

/** Profil dans la langue demandée : les champs anglais remplacent les français s'ils sont remplis. */
export function localizeProfile<P extends Pick<Profile, "headline" | "headlineEn" | "bio" | "bioEn" | "experience" | "experienceEn" | "education" | "educationEn" | "languages" | "languagesEn">>(
  p: P,
  locale: Locale,
): P {
  return {
    ...p,
    headline: pick(p.headline, p.headlineEn, locale),
    bio: pick(p.bio, p.bioEn, locale),
    experience: pick(p.experience, p.experienceEn, locale),
    education: pick(p.education, p.educationEn, locale),
    languages: pick(p.languages, p.languagesEn, locale),
  };
}

export function localizeProject<P extends Pick<Project, "title" | "titleEn" | "summary" | "summaryEn" | "content" | "contentEn">>(p: P, locale: Locale): P {
  return {
    ...p,
    title: pick(p.title, p.titleEn, locale),
    summary: pick(p.summary, p.summaryEn, locale),
    content: pick(p.content, p.contentEn, locale),
  };
}

/** Markdown léger → texte brut (pour le PDF et les descriptions SEO). */
export function stripMarkdown(md: string) {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .trim();
}
