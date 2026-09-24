import "server-only";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const PUBLIC_PREFIX = "/api/files/";

const LIMITS = { image: 8 * 1024 * 1024, video: 100 * 1024 * 1024 };
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export function isFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && value.size > 0;
}

/** Vérifie format et taille d'un fichier ; lève une erreur lisible sinon. */
export function checkUpload(file: File, allowed: ("image" | "video")[] = ["image"]) {
  const kind = file.type.split("/")[0] as "image" | "video";
  const ext = EXT[file.type];
  if (!ext || !allowed.includes(kind)) {
    throw new Error(`« ${file.name} » : format non supporté (${file.type || "inconnu"}).`);
  }
  if (file.size > LIMITS[kind]) {
    throw new Error(`« ${file.name} » est trop lourd (max ${LIMITS[kind] / 1024 / 1024} Mo).`);
  }
  return { kind, ext };
}

/** Enregistre un fichier image/vidéo et renvoie son URL publique. */
export async function saveUpload(file: File, allowed: ("image" | "video")[] = ["image"]) {
  const { kind, ext } = checkUpload(file, allowed);
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { url: PUBLIC_PREFIX + name, kind };
}

/** Supprime un fichier uploadé (ignore les URLs externes). */
export async function deleteUpload(url?: string | null) {
  if (!url || !url.startsWith(PUBLIC_PREFIX)) return;
  const name = path.basename(url.slice(PUBLIC_PREFIX.length));
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}
