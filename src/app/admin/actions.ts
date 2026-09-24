"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { uniqueSlug } from "@/lib/slug";
import { deleteUpload, isFile, saveUpload } from "@/lib/uploads";
import { generatePassword, str, type FormState } from "@/lib/utils";

export async function updateSettings(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const siteName = str(formData, "siteName", 60);
  const heroTitle = str(formData, "heroTitle", 120);
  if (!siteName) return { error: "Le nom du site est obligatoire." };
  if (!heroTitle) return { error: "Le titre principal est obligatoire." };

  try {
    const current = await getSettings();
    let logoUrl = current.logoUrl;
    const logo = formData.get("logo");
    if (isFile(logo)) {
      logoUrl = (await saveUpload(logo, ["image"])).url;
      await deleteUpload(current.logoUrl);
    } else if (formData.get("remove_logo") === "on") {
      await deleteUpload(current.logoUrl);
      logoUrl = null;
    }

    await db.siteSettings.update({
      where: { id: "site" },
      data: {
        siteName,
        logoUrl,
        heroTitle,
        heroTitleLine2: str(formData, "heroTitleLine2", 120),
        heroDescription: str(formData, "heroDescription", 400),
        metaDescription: str(formData, "metaDescription", 300),
        footerText: str(formData, "footerText", 200),
      },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Une erreur est survenue." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Paramètres du site enregistrés ✓" };
}

export type CreateUserState =
  | { error?: string; created?: { email: string; password: string; name: string } }
  | undefined;

export async function createUser(_: CreateUserState, formData: FormData): Promise<CreateUserState> {
  await requireAdmin();
  const fullName = str(formData, "fullName", 120);
  const email = str(formData, "email", 200).toLowerCase();
  const password = str(formData, "password", 100) || generatePassword();
  const role = formData.get("role") === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER";

  if (!fullName) return { error: "Le nom est obligatoire." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email invalide." };
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (await db.user.findUnique({ where: { email } })) return { error: "Un compte existe déjà avec cet email." };

  await db.user.create({
    data: {
      email,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      profile: { create: { fullName, slug: await uniqueSlug(fullName) } },
    },
  });
  revalidatePath("/admin", "layout");
  return { created: { email, password, name: fullName } };
}

export async function resetPassword(_: { password?: string } | undefined, formData: FormData) {
  await requireAdmin();
  const password = generatePassword();
  await db.user.update({
    where: { id: str(formData, "id") },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  return { password };
}

export async function toggleActive(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (id === admin.id) return;
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  await db.user.update({ where: { id }, data: { active: !user.active } });
  revalidatePath("/", "layout");
}

export async function togglePublished(formData: FormData) {
  await requireAdmin();
  const userId = str(formData, "id");
  const profile = await db.profile.findUniqueOrThrow({ where: { userId } });
  await db.profile.update({ where: { userId }, data: { published: !profile.published } });
  revalidatePath("/", "layout");
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (id === admin.id) return;
  const user = await db.user.findUnique({
    where: { id },
    include: { profile: true, projects: { include: { media: true } } },
  });
  if (!user) return;
  await db.user.delete({ where: { id } });
  // Nettoyage des fichiers une fois la suppression effectuée
  const files = [
    user.profile?.avatarUrl,
    user.profile?.coverUrl,
    ...user.projects.flatMap((p) => [p.coverUrl, ...p.media.map((m) => m.url)]),
  ];
  await Promise.all(files.map(deleteUpload));
  revalidatePath("/", "layout");
}
