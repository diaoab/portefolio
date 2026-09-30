"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { isCvTemplate } from "@/lib/cv";
import { db } from "@/lib/db";
import type { Dict } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { uniqueSlug } from "@/lib/slug";
import { deleteUserWithFiles } from "@/lib/users";
import { DEFAULT_THEME, isHex, THEME_PRESETS, type ThemeColors } from "@/lib/theme";
import { checkUpload, deleteUpload, isFile, saveUpload } from "@/lib/uploads";
import { normalizeUrl, slugify, splitList, str, toEmbedUrl, type FormState } from "@/lib/utils";

async function fail(e: unknown): Promise<FormState> {
  return { error: e instanceof Error ? e.message : (await getT()).common.error };
}

async function ownProject(id: string) {
  const user = await requireUser();
  const project = await db.project.findFirst({ where: { id, userId: user.id }, include: { media: true } });
  if (!project) throw new Error((await getT()).projects.notFound);
  return project;
}

/** Gère un champ image : nouveau fichier, suppression demandée, ou valeur conservée. */
async function handleImage(formData: FormData, field: string, current: string | null, keep: string[] = []) {
  const drop = (url: string | null) => (url && keep.includes(url) ? undefined : deleteUpload(url));
  const file = formData.get(field);
  if (isFile(file)) {
    const { url } = await saveUpload(file, ["image"], await getT());
    await drop(current);
    return url;
  }
  if (formData.get(`remove_${field}`) === "on") {
    await drop(current);
    return null;
  }
  return current;
}

// ───────────── Profil ─────────────

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const profile = user.profile!;
  const t = await getT();
  try {
    const fullName = str(formData, "fullName", 120);
    if (!fullName) return { error: t.profile.nameRequired };

    const wantedSlug = slugify(str(formData, "slug", 60)) || slugify(fullName);
    const slug = await uniqueSlug(wantedSlug, user.id);

    const avatarUrl = await handleImage(formData, "avatar", profile.avatarUrl);
    const coverUrl = await handleImage(formData, "cover", profile.coverUrl);
    const color = (key: keyof ThemeColors) => {
      const value = str(formData, key, 7);
      return isHex(value) ? value.toLowerCase() : DEFAULT_THEME[key];
    };
    const theme = str(formData, "theme", 20);

    await db.profile.update({
      where: { userId: user.id },
      data: {
        fullName,
        slug,
        avatarUrl,
        coverUrl,
        headline: str(formData, "headline", 160),
        bio: str(formData, "bio", 5000),
        headlineEn: str(formData, "headlineEn", 160),
        bioEn: str(formData, "bioEn", 5000),
        location: str(formData, "location", 120),
        phone: str(formData, "phone", 40),
        website: normalizeUrl(str(formData, "website", 300)),
        github: normalizeUrl(str(formData, "github", 300)),
        linkedin: normalizeUrl(str(formData, "linkedin", 300)),
        skills: splitList(str(formData, "skills", 1000)).join(", "),
        theme: THEME_PRESETS.some((p) => p.id === theme) ? theme : "custom",
        accent: color("accent"),
        bgColor: color("bgColor"),
        surfaceColor: color("surfaceColor"),
        textColor: color("textColor"),
        published: formData.get("published") === "on",
      },
    });
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: slug !== wantedSlug ? t.profile.slugTaken(wantedSlug, slug) : t.profile.saved,
    };
  } catch (e) {
    return fail(e);
  }
}

// ───────────── CV ─────────────

/** Normalise un champ de parcours : lignes nettoyées, une seule ligne vide entre deux entrées. */
function cvText(formData: FormData, key: string) {
  return str(formData, key, 10000)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export async function updateCv(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const template = str(formData, "cvTemplate", 20);
  try {
    await db.profile.update({
      where: { userId: user.id },
      data: {
        experience: cvText(formData, "experience"),
        education: cvText(formData, "education"),
        languages: splitList(str(formData, "languages", 500)).join(", "),
        experienceEn: cvText(formData, "experienceEn"),
        educationEn: cvText(formData, "educationEn"),
        languagesEn: splitList(str(formData, "languagesEn", 500)).join(", "),
        cvTemplate: isCvTemplate(template) ? template : "modern",
        cvPublic: formData.get("cvPublic") === "on",
      },
    });
    revalidatePath("/", "layout");
    return { ok: true, message: (await getT()).cv.saved };
  } catch (e) {
    return fail(e);
  }
}

// ───────────── Réalisations ─────────────

function projectData(formData: FormData) {
  return {
    title: str(formData, "title", 160),
    summary: str(formData, "summary", 300),
    content: str(formData, "content", 20000),
    titleEn: str(formData, "titleEn", 160),
    summaryEn: str(formData, "summaryEn", 300),
    contentEn: str(formData, "contentEn", 20000),
    link: normalizeUrl(str(formData, "link", 300)),
    tags: splitList(str(formData, "tags", 500)).join(", "),
    published: formData.get("published") === "on",
  };
}

export async function createProject(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const t = await getT();
  const data = projectData(formData);
  if (!data.title) return { error: t.projects.titleRequired };
  let id: string;
  try {
    const media = readMediaInput(formData, t);
    const cover = formData.get("cover");
    let coverUrl = isFile(cover) ? (await saveUpload(cover, ["image"], t)).url : null;
    const last = await db.project.findFirst({ where: { userId: user.id }, orderBy: { position: "desc" } });
    ({ id } = await db.project.create({
      data: { ...data, coverUrl, userId: user.id, position: (last?.position ?? 0) + 1 },
    }));
    if (media.count) {
      await saveMedia(id, media);
      // Sans couverture choisie, la première image de la galerie sert de couverture
      if (!coverUrl) {
        const firstImage = await db.media.findFirst({ where: { projectId: id, type: "IMAGE" }, orderBy: { position: "asc" } });
        if (firstImage) {
          coverUrl = firstImage.url;
          await db.project.update({ where: { id }, data: { coverUrl } });
        }
      }
    }
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/", "layout");
  redirect(`/dashboard/projects/${id}?created=1`);
}

export async function updateProject(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const project = await ownProject(str(formData, "id"));
    const t = await getT();
    const data = projectData(formData);
    if (!data.title) return { error: t.projects.titleRequired };
    const coverUrl = await handleImage(formData, "cover", project.coverUrl, project.media.map((m) => m.url));
    await db.project.update({ where: { id: project.id }, data: { ...data, coverUrl } });
    revalidatePath("/", "layout");
    return { ok: true, message: t.projects.saved };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProject(formData: FormData) {
  const project = await ownProject(str(formData, "id"));
  await db.project.delete({ where: { id: project.id } });
  await Promise.all([project.coverUrl, ...project.media.map((m) => m.url)].map(deleteUpload));
  revalidatePath("/", "layout");
  redirect("/dashboard/projects");
}

export async function toggleProjectPublished(formData: FormData) {
  const project = await ownProject(str(formData, "id"));
  await db.project.update({ where: { id: project.id }, data: { published: !project.published } });
  revalidatePath("/", "layout");
}

export async function moveProject(formData: FormData) {
  const project = await ownProject(str(formData, "id"));
  const up = formData.get("dir") === "up";
  const neighbor = await db.project.findFirst({
    where: { userId: project.userId, position: up ? { lt: project.position } : { gt: project.position } },
    orderBy: { position: up ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await db.$transaction([
    db.project.update({ where: { id: project.id }, data: { position: neighbor.position } }),
    db.project.update({ where: { id: neighbor.id }, data: { position: project.position } }),
  ]);
  revalidatePath("/", "layout");
}

// ───────────── Médias (images, vidéos, liens YouTube/Vimeo) ─────────────

/**
 * Lit les champs `files` (plusieurs images/vidéos) et `embeds` (liens YouTube/Vimeo, un par ligne).
 * Tout est validé avant d'écrire quoi que ce soit, pour ne jamais enregistrer un envoi à moitié.
 */
function readMediaInput(formData: FormData, t: Dict) {
  const files = formData.getAll("files").filter(isFile);
  files.forEach((f) => checkUpload(f, ["image", "video"], t));
  const embeds = str(formData, "embeds", 5000)
    .split(/\s*\n\s*/)
    .filter(Boolean)
    .map((link) => {
      const url = toEmbedUrl(normalizeUrl(link));
      if (!url) throw new Error(t.media.badLink(link));
      return url;
    });
  return { files, embeds, count: files.length + embeds.length };
}

async function saveMedia(projectId: string, input: ReturnType<typeof readMediaInput>) {
  const last = await db.media.findFirst({ where: { projectId }, orderBy: { position: "desc" } });
  let position = last?.position ?? 0;
  const rows = [];
  for (const file of input.files) {
    const { url, kind } = await saveUpload(file, ["image", "video"]);
    rows.push({ projectId, type: kind === "video" ? "VIDEO" : "IMAGE", url, position: ++position });
  }
  for (const url of input.embeds) rows.push({ projectId, type: "EMBED", url, position: ++position });
  await db.media.createMany({ data: rows });
}

export async function addMedia(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const project = await ownProject(str(formData, "projectId"));
    const t = await getT();
    const input = readMediaInput(formData, t);
    if (!input.count) return { error: t.media.needOne };
    await saveMedia(project.id, input);
    revalidatePath("/", "layout");
    return { ok: true, message: t.media.added(input.count) };
  } catch (e) {
    return fail(e);
  }
}

async function ownMedia(formData: FormData) {
  const user = await requireUser();
  return db.media.findFirst({ where: { id: str(formData, "id"), project: { userId: user.id } }, include: { project: true } });
}

export async function deleteMedia(formData: FormData) {
  const media = await ownMedia(formData);
  if (!media) return;
  await db.media.delete({ where: { id: media.id } });
  if (media.project.coverUrl !== media.url) await deleteUpload(media.url);
  revalidatePath("/", "layout");
}

export async function moveMedia(formData: FormData) {
  const media = await ownMedia(formData);
  if (!media) return;
  const up = formData.get("dir") === "up";
  const neighbor = await db.media.findFirst({
    where: { projectId: media.projectId, position: up ? { lt: media.position } : { gt: media.position } },
    orderBy: { position: up ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await db.$transaction([
    db.media.update({ where: { id: media.id }, data: { position: neighbor.position } }),
    db.media.update({ where: { id: neighbor.id }, data: { position: media.position } }),
  ]);
  revalidatePath("/", "layout");
}

export async function updateMediaCaption(formData: FormData) {
  const media = await ownMedia(formData);
  if (!media) return;
  await db.media.update({ where: { id: media.id }, data: { caption: str(formData, "caption", 300) } });
  revalidatePath("/", "layout");
}

/** Utilise une image de la galerie comme couverture de la réalisation. */
export async function setMediaAsCover(formData: FormData) {
  const media = await ownMedia(formData);
  if (!media || media.type !== "IMAGE") return;
  const old = media.project.coverUrl;
  await db.project.update({ where: { id: media.projectId }, data: { coverUrl: media.url } });
  // L'ancienne couverture n'est supprimée que si elle n'appartient pas aussi à la galerie
  if (old && !(await db.media.findFirst({ where: { url: old } }))) await deleteUpload(old);
  revalidatePath("/", "layout");
}

// ───────────── Messages ─────────────

export async function toggleMessageRead(formData: FormData) {
  const user = await requireUser();
  const msg = await db.message.findFirst({ where: { id: str(formData, "id"), toUserId: user.id } });
  if (!msg) return;
  await db.message.update({ where: { id: msg.id }, data: { read: !msg.read } });
  revalidatePath("/dashboard", "layout");
}

export async function deleteMessage(formData: FormData) {
  const user = await requireUser();
  await db.message.deleteMany({ where: { id: str(formData, "id"), toUserId: user.id } });
  revalidatePath("/dashboard", "layout");
}

// ───────────── Compte ─────────────

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const t = (await getT()).account;

  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: t.wrongCurrent };
  if (next.length < 8) return { error: t.tooShort };
  if (next !== confirm) return { error: t.mismatch };

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true, message: t.updated };
}

export async function updateNotifications(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  await db.profile.update({ where: { userId: user.id }, data: { notifyEmail: formData.get("notifyEmail") === "on" } });
  return { ok: true, message: (await getT()).danger.notifySaved };
}

export async function deleteOwnAccount(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const t = await getT();
  if (user.role === "SUPER_ADMIN") return { error: t.danger.adminBlocked };
  if (!(await bcrypt.compare(String(formData.get("password") ?? ""), user.passwordHash))) return { error: t.account.wrongCurrent };
  await deleteUserWithFiles(user.id);
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

// ───────────── Glisser-déposer ─────────────

/** Nouvel ordre des réalisations (ids dans l'ordre voulu). */
export async function reorderProjects(ids: string[]) {
  const user = await requireUser();
  const owned = await db.project.findMany({ where: { userId: user.id }, select: { id: true } });
  const known = new Set(owned.map((p) => p.id));
  const order = ids.filter((id) => known.has(id));
  await db.$transaction(order.map((id, i) => db.project.update({ where: { id }, data: { position: i + 1 } })));
  revalidatePath("/", "layout");
}

/** Nouvel ordre des médias d'une réalisation. */
export async function reorderMedia(projectId: string, ids: string[]) {
  const project = await ownProject(projectId);
  const known = new Set(project.media.map((m) => m.id));
  const order = ids.filter((id) => known.has(id));
  await db.$transaction(order.map((id, i) => db.media.update({ where: { id }, data: { position: i + 1 } })));
  revalidatePath("/", "layout");
}
