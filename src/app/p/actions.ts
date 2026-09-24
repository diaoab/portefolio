"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { visibleProfile } from "@/lib/public";
import { str, type FormState } from "@/lib/utils";

// Anti-spam simple : 5 messages max par IP et par tranche de 10 minutes.
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export async function sendMessage(_: FormState, formData: FormData): Promise<FormState> {
  // Champ piège invisible : rempli uniquement par les robots.
  if (str(formData, "website")) return { ok: true, message: "Message envoyé ✓" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (rateLimited(ip)) return { error: "Trop de messages envoyés. Réessayez dans quelques minutes." };

  const name = str(formData, "name", 120);
  const email = str(formData, "email", 200);
  const subject = str(formData, "subject", 200);
  const body = str(formData, "body", 5000);

  if (!name || !body) return { error: "Nom et message sont obligatoires." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Adresse email invalide." };

  const profile = await db.profile.findFirst({ where: { slug: str(formData, "slug", 60), ...visibleProfile } });
  if (!profile) return { error: "Ce portfolio n'est plus disponible." };

  await db.message.create({ data: { toUserId: profile.userId, name, email, subject, body } });
  return { ok: true, message: `Merci ${name} ! Votre message a bien été transmis à ${profile.fullName}.` };
}
