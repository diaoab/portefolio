import "server-only";
import { cache } from "react";
import { db } from "./db";

/** Paramètres du site (créés avec les valeurs par défaut au premier appel). */
export const getSettings = cache(async () =>
  db.siteSettings.upsert({ where: { id: "site" }, update: {}, create: { id: "site" } }),
);
