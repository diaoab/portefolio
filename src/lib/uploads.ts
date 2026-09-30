import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { dictionaries, type Dict } from "./i18n";

/**
 * Stockage des fichiers envoyés (photos, vidéos, logo).
 * - Production (Vercel) : Cloudflare R2, dès que les variables R2_* sont définies.
 * - Développement : disque local (dossier uploads/), servi par /api/files/<nom>.
 * Dans les deux cas, le navigateur envoie le fichier directement (URL d'envoi signée) :
 * les gros fichiers ne transitent pas par les fonctions serveur, limitées à 4,5 Mo sur Vercel.
 */

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const LOCAL_PREFIX = "/api/files/";

const r2 = process.env.R2_BUCKET
  ? {
      bucket: process.env.R2_BUCKET,
      publicUrl: (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, ""),
      client: new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "" },
      }),
    }
  : null;

export type UploadKind = "image" | "video";
export const LIMITS: Record<UploadKind, number> = { image: 8 * 1024 * 1024, video: 100 * 1024 * 1024 };
export const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
export const MIME: Record<string, string> = Object.fromEntries(Object.entries(EXT).map(([mime, ext]) => [ext, mime]));

const KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif|avif|mp4|webm|mov)$/;

export type UploadMeta = { name: string; type: string; size: number };

/** Vérifie format et taille annoncés d'un fichier ; lève une erreur lisible sinon. */
export function checkUpload(meta: UploadMeta, allowed: UploadKind[] = ["image"], t: Dict = dictionaries.fr) {
  const kind = meta.type.split("/")[0] as UploadKind;
  const ext = EXT[meta.type];
  if (!ext || !allowed.includes(kind)) throw new Error(t.media.badFormat(meta.name, meta.type));
  if (!(meta.size > 0) || meta.size > LIMITS[kind]) throw new Error(t.media.fileTooBig(meta.name, LIMITS[kind] / 1024 / 1024));
  return { kind, ext };
}

const sign = (value: string) => createHmac("sha256", process.env.AUTH_SECRET ?? "").update(value).digest("hex");

/** Prépare un envoi : URL où le navigateur dépose le fichier (PUT) et URL publique finale. */
export async function createUpload(meta: UploadMeta, allowed: UploadKind[], t: Dict) {
  const { ext } = checkUpload(meta, allowed, t);
  const key = `${randomUUID()}.${ext}`;
  if (r2) {
    const uploadUrl = await getSignedUrl(
      r2.client,
      // Type et taille font partie de la signature : R2 refuse tout autre fichier
      new PutObjectCommand({ Bucket: r2.bucket, Key: key, ContentType: meta.type, ContentLength: meta.size, CacheControl: "public, max-age=31536000, immutable" }),
      { expiresIn: 600, signableHeaders: new Set(["content-type", "content-length"]) },
    );
    return { uploadUrl, url: `${r2.publicUrl}/${key}` };
  }
  const expires = Date.now() + 600_000;
  const query = new URLSearchParams({ type: meta.type, size: String(meta.size), expires: String(expires) });
  query.set("sig", sign(`${key}:${meta.type}:${meta.size}:${expires}`));
  return { uploadUrl: `/api/upload/${key}?${query}`, url: LOCAL_PREFIX + key };
}

/** Vérifie la signature d'un envoi local (mode développement). */
export function verifyLocalUpload(key: string, type: string, size: number, expires: number, sig: string) {
  if (!KEY.test(key) || Date.now() > expires) return false;
  const expected = Buffer.from(sign(`${key}:${type}:${size}:${expires}`));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Nom du fichier si l'URL désigne un fichier de ce site, sinon null. */
export function keyOf(url?: string | null) {
  if (!url) return null;
  const key = url.startsWith(LOCAL_PREFIX) ? url.slice(LOCAL_PREFIX.length) : r2 && url.startsWith(`${r2.publicUrl}/`) ? url.slice(r2.publicUrl.length + 1) : null;
  return key && KEY.test(key) ? key : null;
}

export const kindOf = (url: string): UploadKind | null => {
  const mime = MIME[url.split(".").pop() ?? ""];
  return mime ? (mime.split("/")[0] as UploadKind) : null;
};

/** Contenu d'un fichier envoyé (photo de profil pour le PDF, image de partage…). */
export async function readUpload(url?: string | null): Promise<Buffer | null> {
  const key = keyOf(url);
  if (!key) return null;
  try {
    if (r2) {
      const obj = await r2.client.send(new GetObjectCommand({ Bucket: r2.bucket, Key: key }));
      return obj.Body ? Buffer.from(await obj.Body.transformToByteArray()) : null;
    }
    // Local : anciens fichiers et fichiers du mode développement
    return await readFile(path.join(UPLOAD_DIR, key));
  } catch {
    return null;
  }
}

export async function writeLocalUpload(key: string, data: Buffer) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), data);
}

async function writeUpload(key: string, data: Buffer) {
  if (r2) {
    await r2.client.send(
      new PutObjectCommand({ Bucket: r2.bucket, Key: key, Body: data, ContentType: MIME[key.split(".").pop()!], CacheControl: "public, max-age=31536000, immutable" }),
    );
  } else {
    await writeLocalUpload(key, data);
  }
}

/**
 * Redresse (EXIF, en retirant la géolocalisation), limite à 2000 px et recompresse une photo envoyée.
 * Les GIF (animations) sont conservés ; en cas d'échec, le fichier d'origine est gardé.
 */
export async function optimizeUpload(url: string) {
  const key = keyOf(url);
  const ext = key?.split(".").pop();
  if (!key || !ext || kindOf(url) !== "image" || ext === "gif") return;
  const data = await readUpload(url);
  if (!data) return;
  try {
    const img = sharp(data).rotate().resize(2000, 2000, { fit: "inside", withoutEnlargement: true });
    const out =
      ext === "png" ? await img.png({ compressionLevel: 9, palette: false }).toBuffer()
      : ext === "webp" ? await img.webp({ quality: 82 }).toBuffer()
      : ext === "avif" ? await img.avif({ quality: 60 }).toBuffer()
      : await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    if (out.length < data.length) await writeUpload(key, out);
  } catch {
    // image conservée telle quelle
  }
}

/** Supprime un fichier envoyé (ignore les URLs externes). */
export async function deleteUpload(url?: string | null) {
  const key = keyOf(url);
  if (!key) return;
  if (r2 && !url!.startsWith(LOCAL_PREFIX)) {
    await r2.client.send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: key })).catch(() => {});
  } else {
    await unlink(path.join(UPLOAD_DIR, key)).catch(() => {});
  }
}
