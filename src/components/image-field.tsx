"use client";

import { useState } from "react";
import { AlertCircle, ImagePlus, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/upload-client";
import { useT } from "./i18n-provider";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";
const MAX = 8 * 1024 * 1024;

/**
 * Champ image avec aperçu et option de suppression.
 * Le fichier est envoyé dès sa sélection ; le formulaire transmet ensuite son URL (champ `<name>_url`).
 */
export function ImageField({
  name,
  label,
  current,
  shape = "wide",
}: {
  name: string;
  label: string;
  current?: string | null;
  shape?: "round" | "square" | "wide";
}) {
  const t = useT();
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [removed, setRemoved] = useState(false);
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const round = shape === "round";
  const square = shape === "square";

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!ACCEPT.split(",").includes(file.type)) return setError(t.media.unsupported(file.name));
    if (file.size > MAX) return setError(t.media.tooBig(file.name, `8 ${t.media.mb}`));
    setPreview(URL.createObjectURL(file));
    setRemoved(false);
    setUrl("");
    setProgress(0);
    try {
      setUrl(await uploadFile(file, ["image"], setProgress));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
      setPreview(current ?? null);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={`${name}_url`} value={url} />
      <div className="flex items-center gap-4">
        <label
          className={`group relative grid shrink-0 cursor-pointer place-items-center overflow-hidden border border-dashed border-white/15 bg-white/[0.03] transition hover:border-brand/60 ${
            round ? "size-24 rounded-full" : square ? "size-24 rounded-xl" : "aspect-[16/7] w-full max-w-md rounded-xl"
          }`}
        >
          {preview && !removed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className={`absolute inset-0 size-full ${square ? "object-contain p-2" : "object-cover"}`} />
          ) : (
            <ImagePlus className="size-6 text-zinc-500 group-hover:text-brand" />
          )}
          {progress !== null && (
            <span className="absolute inset-0 grid place-items-center bg-black/60 text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-4 animate-spin" /> {Math.round(progress * 100)}%
              </span>
            </span>
          )}
          <input
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={progress !== null}
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {current && (
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name={`remove_${name}`} checked={removed} onChange={(e) => {
                setRemoved(e.target.checked);
                if (e.target.checked) setUrl("");
              }} />
            {t.common.remove}
          </label>
        )}
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
          <AlertCircle className="size-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
