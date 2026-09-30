import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { visibleProfile } from "@/lib/public";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  const profiles = await db.profile.findMany({
    where: visibleProfile,
    select: { slug: true, updatedAt: true, user: { select: { projects: { where: { published: true }, select: { id: true, updatedAt: true } } } } },
  });
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...profiles.flatMap((p) => [
      { url: `${base}/p/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 },
      ...p.user.projects.map((proj) => ({ url: `${base}/p/${p.slug}/${proj.id}`, lastModified: proj.updatedAt, priority: 0.6 })),
    ]),
    { url: `${base}/legal`, priority: 0.1 },
    { url: `${base}/privacy`, priority: 0.1 },
  ];
}
