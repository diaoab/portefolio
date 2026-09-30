import "server-only";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { dictionaries, type Dict } from "./i18n";

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
export function checkUpload(file: File, allowed: ("image" | "video")[] = ["image"], t: Dict = dictionaries.fr) {
  const kind = file.type.split("/")[0] as "image" | "video";
  const ext = EXT[file.type];
  if (!ext || !allowed.includes(kind)) {
    throw new Error(t.media.badFormat(file.name, file.type));
  }
  if (file.size > LIMITS[kind]) {
    throw new Error(t.media.fileTooBig(file.name, LIMITS[kind] / 1024 / 1024));
  }
  return { kind, ext };
}

/** Enregistre un fichier image/vidéo et renvoie son URL publique. */
export async function saveUpload(file: File, allowed: ("image" | "video")[] = ["image"], t?: Dict) {
  const { kind, ext } = checkUpload(file, allowed, t);
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  let data: Buffer = Buffer.from(await file.arrayBuffer());
  if (kind === "image") data = await optimizeImage(data, ext);
  await writeFile(path.join(UPLOAD_DIR, name), data);
  return { url: PUBLIC_PREFIX + name, kind };
}

/**
 * Redresse (EXIF), limite à 2000 px et recompresse les photos : pages plus légères, surtout sur mobile.
 * Les GIF (animations) sont conservés tels quels ; en cas d'échec, le fichier d'origine est gardé.
 */
async function optimizeImage(data: Buffer, ext: string): Promise<Buffer> {
  if (ext === "gif") return data;
  try {
    const img = sharp(data).rotate().resize(2000, 2000, { fit: "inside", withoutEnlargement: true });
    const out =
      ext === "png" ? await img.png({ compressionLevel: 9, palette: false }).toBuffer()
      : ext === "webp" ? await img.webp({ quality: 82 }).toBuffer()
      : ext === "avif" ? await img.avif({ quality: 60 }).toBuffer()
      : await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return out.length < data.length ? out : data;
  } catch {
    return data;
  }
}

/** Supprime un fichier uploadé (ignore les URLs externes). */
export async function deleteUpload(url?: string | null) {
  if (!url || !url.startsWith(PUBLIC_PREFIX)) return;
  const name = path.basename(url.slice(PUBLIC_PREFIX.length));
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}
