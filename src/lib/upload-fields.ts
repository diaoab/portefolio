import "server-only";
import { db } from "./db";
import type { Dict } from "./i18n";
import { deleteUpload, keyOf, kindOf, optimizeUpload, type UploadKind } from "./uploads";

/**
 * Valide une URL de fichier envoyée par le formulaire : elle doit venir de notre stockage,
 * être du bon type et ne pas être déjà utilisée ailleurs (on ne peut pas « s'approprier » le fichier d'un autre).
 */
export async function acceptUpload(url: string, allowed: UploadKind[], t: Dict) {
  const kind = kindOf(url);
  if (!keyOf(url) || !kind || !allowed.includes(kind)) throw new Error(t.media.badFormat(url.split("/").pop() ?? "", ""));
  const used = await Promise.all([
    db.profile.count({ where: { OR: [{ avatarUrl: url }, { coverUrl: url }] } }),
    db.project.count({ where: { coverUrl: url } }),
    db.media.count({ where: { url } }),
    db.siteSettings.count({ where: { logoUrl: url } }),
  ]);
  if (used.some(Boolean)) throw new Error(t.common.error);
  if (kind === "image") await optimizeUpload(url);
  return { url, kind };
}

/**
 * Champ image d'un formulaire : nouveau fichier (`<champ>_url`), suppression demandée (`remove_<champ>`) ou valeur conservée.
 * `keep` : URLs à ne jamais supprimer du stockage (ex. image de la galerie servant de couverture).
 */
export async function handleImageField(formData: FormData, field: string, current: string | null, t: Dict, keep: string[] = []) {
  const drop = (url: string | null) => (url && keep.includes(url) ? undefined : deleteUpload(url));
  const uploaded = String(formData.get(`${field}_url`) ?? "").trim();
  if (uploaded) {
    await acceptUpload(uploaded, ["image"], t);
    await drop(current);
    return uploaded;
  }
  if (formData.get(`remove_${field}`) === "on") {
    await drop(current);
    return null;
  }
  return current;
}
