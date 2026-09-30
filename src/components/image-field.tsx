"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { useT } from "./i18n-provider";

/** Champ d'upload d'image avec aperçu et option de suppression. */
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
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [removed, setRemoved] = useState(false);
  const t = useT();
  const round = shape === "round";
  const square = shape === "square";

  return (
    <div>
      <span className="label">{label}</span>
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
          <input
            type="file"
            name={name}
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPreview(URL.createObjectURL(file));
                setRemoved(false);
              }
            }}
          />
        </label>
        {current && (
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name={`remove_${name}`} checked={removed} onChange={(e) => setRemoved(e.target.checked)} />
            {t.common.remove}
          </label>
        )}
      </div>
    </div>
  );
}
