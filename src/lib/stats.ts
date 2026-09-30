import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|linkedin|curl|wget|python|headless/i;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Compte une visite ou un téléchargement de CV pour un portfolio (sans cookie ni donnée personnelle).
 * Les robots et aperçus de liens sont ignorés.
 */
export async function track(profileId: string, field: "views" | "cvDownloads") {
  const ua = (await headers()).get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return;
  await db.dailyStat
    .upsert({
      where: { profileId_day: { profileId, day: today() } },
      create: { profileId, day: today(), [field]: 1 },
      update: { [field]: { increment: 1 } },
    })
    .catch(() => {});
}

/** Totaux et série journalière des 30 derniers jours. */
export async function statsFor(profileId: string) {
  const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10));
  const rows = await db.dailyStat.findMany({ where: { profileId, day: { gte: days[0] } } });
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const series = days.map((day) => ({ day, views: byDay.get(day)?.views ?? 0, cvDownloads: byDay.get(day)?.cvDownloads ?? 0 }));
  return {
    series,
    views: series.reduce((n, d) => n + d.views, 0),
    cvDownloads: series.reduce((n, d) => n + d.cvDownloads, 0),
  };
}
