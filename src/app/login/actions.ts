"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/lib/session";
import { str, type FormState } from "@/lib/utils";

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email", 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = str(formData, "next", 200);

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email ou mot de passe incorrect." };
  }
  if (!user.active) return { error: "Ce compte a été désactivé. Contactez l'administrateur." };

  await createSession(user.id, user.role as Role);

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : null;
  redirect(safeNext ?? (user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
