"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { getSettings } from "@/lib/settings";
import { uniqueSlug } from "@/lib/slug";
import { deleteUserWithFiles } from "@/lib/users";
import { handleImageField } from "@/lib/upload-fields";
import { generatePassword, str, type FormState } from "@/lib/utils";

export async function updateSettings(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const siteName = str(formData, "siteName", 60);
  const heroTitle = str(formData, "heroTitle", 120);
  const t = await getT();
  if (!siteName) return { error: t.settings.nameRequired };
  if (!heroTitle) return { error: t.settings.titleRequired };

  try {
    const current = await getSettings();
    const logoUrl = await handleImageField(formData, "logo", current.logoUrl, t);

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
        heroTitleEn: str(formData, "heroTitleEn", 120),
        heroTitleLine2En: str(formData, "heroTitleLine2En", 120),
        heroDescriptionEn: str(formData, "heroDescriptionEn", 400),
        metaDescriptionEn: str(formData, "metaDescriptionEn", 300),
        footerTextEn: str(formData, "footerTextEn", 200),
        legalText: str(formData, "legalText", 20000),
        legalTextEn: str(formData, "legalTextEn", 20000),
        privacyText: str(formData, "privacyText", 20000),
        privacyTextEn: str(formData, "privacyTextEn", 20000),
      },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : t.common.error };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: t.settings.saved };
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
  const t = (await getT()).admin;

  if (!fullName) return { error: t.nameRequired };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t.invalidEmail };
  if (password.length < 8) return { error: t.passwordShort };
  if (await db.user.findUnique({ where: { email } })) return { error: t.emailTaken };

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
  await deleteUserWithFiles(id);
  revalidatePath("/", "layout");
}
