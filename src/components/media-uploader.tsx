"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Film, ImagePlus, Link2, X } from "lucide-react";
import { useT } from "./i18n-provider";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm", "video/quicktime"];
const MAX = { image: 8 * 1024 * 1024, video: 100 * 1024 * 1024 };
const MAX_TOTAL = 100 * 1024 * 1024; // limite d'un envoi (voir next.config.ts)

const mb = (n: number, unit: string) => `${(n / 1024 / 1024).toFixed(n < 1024 * 1024 ? 2 : 1)} ${unit}`;

/**
 * Champ de formulaire pour ajouter plusieurs images / vidéos (glisser-déposer ou sélection)
 * et plusieurs liens YouTube / Vimeo. Les fichiers sont envoyés via le champ `files`,
 * les liens via le champ `embeds` (un par ligne).
 */
export function MediaUploader() {
  const t = useT().media;
  const [files, setFiles] = useState<File[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  // Le champ caché <input type="file"> reflète toujours la liste affichée,
  // y compris après la réinitialisation automatique du formulaire par React.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const sync = () => {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
    };
    sync();
    const onReset = () => setTimeout(sync, 0);
    input.form?.addEventListener("reset", onReset);
    return () => input.form?.removeEventListener("reset", onReset);
  }, [files]);

  const total = files.reduce((sum, f) => sum + f.size, 0);

  function add(list: FileList | null) {
    if (!list) return;
    const ok: File[] = [];
    const errors: string[] = [];
    for (const f of Array.from(list)) {
      const kind = f.type.startsWith("video/") ? "video" : "image";
      if (!ACCEPT.includes(f.type)) errors.push(t.unsupported(f.name));
      else if (f.size > MAX[kind]) errors.push(t.tooBig(f.name, mb(MAX[kind], t.mb)));
      else ok.push(f);
    }
    setRejected(errors);
    setFiles((prev) => {
      const key = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
      const known = new Set(prev.map(key));
      return [...prev, ...ok.filter((f) => !known.has(key(f)))];
    });
  }

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
      {/* Champ réellement envoyé avec le formulaire */}
      <input ref={inputRef} type="file" name="files" multiple className="hidden" tabIndex={-1} aria-hidden />

      {rejected.length > 0 && (
        <ul className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          {rejected.map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}

      {files.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>{t.ready(files.length, mb(total, t.mb))}</span>
            <button type="button" onClick={() => setFiles([])} className="hover:text-white">{t.removeAll}</button>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {files.map((f, i) => (
              <li key={previews[i]} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-black/40">
                {f.type.startsWith("video/") ? (
                  <>
                    <video src={previews[i]} muted className="size-full object-cover" />
                    <Film className="absolute bottom-1.5 left-1.5 size-4 text-white drop-shadow" />
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[i]} alt={f.name} className="size-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-80 hover:opacity-100"
                  title={t.removeOne}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          {total > MAX_TOTAL && (
            <p className="mt-2 text-xs text-red-300">
              {t.tooMuch(mb(MAX_TOTAL, t.mb))}
            </p>
          )}
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
