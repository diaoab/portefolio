"use client";

import { useSyncExternalStore } from "react";
import { requestUpload } from "./upload-actions";
import type { UploadKind } from "./uploads";

// ── Envois en cours (les boutons « Enregistrer » attendent leur fin) ──
let pending = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const usePendingUploads = () => useSyncExternalStore(subscribe, () => pending, () => 0);

/** Envoie un fichier directement vers le stockage et renvoie son URL publique. */
export async function uploadFile(file: File, allowed: UploadKind[], onProgress?: (ratio: number) => void): Promise<string> {
  pending++;
  emit();
  try {
    const res = await requestUpload({ name: file.name, type: file.type, size: file.size }, allowed);
    if ("error" in res) throw new Error(res.error);
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", res.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("network"));
      xhr.send(file);
    });
    onProgress?.(1);
    return res.url;
  } finally {
    pending--;
    emit();
  }
}
