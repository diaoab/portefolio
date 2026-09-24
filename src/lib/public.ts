import "server-only";
import { cache } from "react";
import { db } from "./db";

/** Condition commune : portfolio publié et compte actif. */
export const visibleProfile = { published: true, user: { active: true } } as const;

export const getPublicProfile = cache(async (slug: string) =>
  db.profile.findFirst({
    where: { slug, ...visibleProfile },
    include: {
      user: {
        select: {
          id: true,
          projects: {
            where: { published: true },
            orderBy: { position: "asc" },
            include: { _count: { select: { media: true } } },
          },
        },
      },
    },
  }),
);
