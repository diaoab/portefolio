"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Film, ImagePlus, Link2, Loader2, X } from "lucide-react";
import { uploadFile } from "@/lib/upload-client";
import { useT } from "./i18n-provider";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm", "video/quicktime"];
const MAX = { image: 8 * 1024 * 1024, video: 100 * 1024 * 1024 };

const mb = (n: number, unit: string) => `${(n / 1024 / 1024).toFixed(n < 1024 * 1024 ? 2 : 1)} ${unit}`;

type Item = { id: string; file: File; preview: string; progress: number; url?: string; error?: string };

/**
 * Ajout de plusieurs images / vidéos (glisser-déposer ou sélection) et de liens YouTube / Vimeo.
 * Chaque fichier est envoyé dès son ajout, directement vers le stockage ; le formulaire transmet
 * ensuite la liste des URLs (champ `uploaded`, JSON) et les liens (champ `embeds`, un par ligne).
 */
export function MediaUploader() {
  const t = useT().media;
  const [items, setItems] = useState<Item[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  const patch = (id: string, p: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...p } : i)));

  function add(list: FileList | null) {
    if (!list) return;
    const errors: string[] = [];
    const fresh: Item[] = [];
    const known = new Set(itemsRef.current.map((i) => `${i.file.name}-${i.file.size}-${i.file.lastModified}`));
    for (const file of Array.from(list)) {
      const kind = file.type.startsWith("video/") ? "video" : "image";
      if (!ACCEPT.includes(file.type)) errors.push(t.unsupported(file.name));
      else if (file.size > MAX[kind]) errors.push(t.tooBig(file.name, mb(MAX[kind], t.mb)));
      else if (!known.has(`${file.name}-${file.size}-${file.lastModified}`)) {
        fresh.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), progress: 0 });
      }
    }
    setRejected(errors);
    setItems((prev) => [...prev, ...fresh]);
    for (const item of fresh) {
      uploadFile(item.file, ["image", "video"], (p) => patch(item.id, { progress: p }))
        .then((url) => patch(item.id, { url }))
        .catch((e: unknown) => patch(item.id, { error: e instanceof Error ? e.message : "Erreur" }));
    }
  }

  const done = items.filter((i) => i.url).map((i) => i.url!);
  const total = items.reduce((sum, i) => sum + i.file.size, 0);

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging ? "border-brand bg-brand/10" : "border-white/15 bg-white/[0.02] hover:border-brand/50 hover:bg-white/[0.04]"
        }`}
      >
        <span className="flex gap-2 text-brand">
          <ImagePlus className="size-6" />
          <Film className="size-6" />
        </span>
        <span className="text-sm font-medium">{t.dropHere}</span>
        <span className="text-xs text-muted">{t.dropHint}</span>
        <input
          type="file"
          multiple
          accept={ACCEPT.join(",")}
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {/* Champ réellement envoyé avec le formulaire : URLs des fichiers déjà envoyés */}
      <input type="hidden" name="uploaded" value={JSON.stringify(done)} />

      {rejected.length > 0 && (
        <ul className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          {rejected.map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}

      {items.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>{t.ready(items.length, mb(total, t.mb))}</span>
            <button type="button" onClick={() => setItems([])} className="hover:text-white">{t.removeAll}</button>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((item) => (
              <li key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-black/40">
                {item.file.type.startsWith("video/") ? (
                  <>
                    <video src={item.preview} muted className="size-full object-cover" />
                    <Film className="absolute bottom-1.5 left-1.5 size-4 text-white drop-shadow" />
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt={item.file.name} className="size-full object-cover" />
                )}
                {!item.url && !item.error && (
                  <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-black/70 px-2 py-1 text-[11px] text-white">
                    <Loader2 className="size-3 animate-spin" /> {Math.round(item.progress * 100)}%
                    <span className="absolute bottom-0 left-0 h-0.5 bg-brand" style={{ width: `${item.progress * 100}%` }} />
                  </span>
                )}
                {item.error && (
                  <span className="absolute inset-0 grid place-items-center bg-red-950/80 p-2 text-center text-[11px] text-red-200" title={item.error}>
                    <AlertCircle className="size-5" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                  className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-80 hover:opacity-100"
                  title={t.removeOne}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="label flex items-center gap-2" htmlFor="embeds">
          <Link2 className="size-4" /> {t.links} <span className="font-normal text-muted">{t.onePerLine}</span>
        </label>
        <textarea
          id="embeds"
          name="embeds"
          rows={2}
          className="input font-mono text-xs"
          placeholder={"https://www.youtube.com/watch?v=…\nhttps://vimeo.com/…"}
        />
      </div>
    </div>
  );
}
