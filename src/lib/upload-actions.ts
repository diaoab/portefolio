"use server";

import { getCurrentUser } from "./auth";
import { getT } from "./i18n-server";
import { createUpload, type UploadKind, type UploadMeta } from "./uploads";

/** Demande une URL d'envoi signée (réservé aux utilisateurs connectés). */
export async function requestUpload(meta: UploadMeta, allowed: UploadKind[]) {
  const t = await getT();
  if (!(await getCurrentUser())) return { error: t.common.error };
  try {
    return await createUpload(
      { name: String(meta.name).slice(0, 200), type: String(meta.type), size: Number(meta.size) },
      allowed.filter((k): k is UploadKind => k === "image" || k === "video"),
      t,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : t.common.error };
  }
}
