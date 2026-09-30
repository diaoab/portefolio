"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useT } from "./i18n-provider";
import { MediaView } from "./media-view";

type Item = { id: string; type: string; url: string; caption: string };

/** Galerie publique : vidéos en grand, images en grille, visionneuse plein écran pour les images. */
export function ProjectGallery({ media }: { media: Item[] }) {
  const images = media.filter((m) => m.type === "IMAGE");
  const [open, setOpen] = useState<number | null>(null);
  const t = useT().project;

  const go = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go]);

  const current = open !== null ? images[open] : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {media.map((m) => {
          if (m.type !== "IMAGE") {
            return (
              <figure key={m.id} className="overflow-hidden rounded-2xl border border-line bg-black/30 sm:col-span-2">
                <MediaView media={m} />
                {m.caption && <figcaption className="px-4 py-3 text-sm text-zinc-400">{m.caption}</figcaption>}
              </figure>
            );
          }
          const index = images.indexOf(m);
          // Une image seule ou la 1re d'une série impaire occupe toute la largeur
          const wide = images.length % 2 === 1 && index === 0;
          return (
            <figure key={m.id} className={`group overflow-hidden rounded-2xl border border-line ${wide ? "sm:col-span-2" : ""}`}>
              <button type="button" onClick={() => setOpen(index)} className="relative block w-full cursor-zoom-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.caption}
                  loading="lazy"
                  className={`w-full object-cover transition duration-500 group-hover:scale-[1.02] ${wide ? "max-h-[520px]" : "aspect-[4/3]"}`}
                />
                <span className="absolute right-3 bottom-3 rounded-lg bg-black/60 p-2 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                  <Expand className="size-4" />
                </span>
              </button>
              {m.caption && <figcaption className="px-4 py-3 text-sm text-zinc-400">{m.caption}</figcaption>}
            </figure>
          );
        })}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between p-4 text-sm text-zinc-300">
            <span>{open! + 1} / {images.length}</span>
            <button className="rounded-full p-2 hover:bg-white/10" aria-label={t.close}>
              <X className="size-6" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={current.id} src={current.url} alt={current.caption} className="max-h-full max-w-full rounded-lg object-contain" />
            {images.length > 1 && (
              <>
                <button onClick={() => go(-1)} className="absolute left-2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-4" aria-label={t.previous}>
                  <ChevronLeft className="size-6" />
                </button>
                <button onClick={() => go(1)} className="absolute right-2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-4" aria-label={t.next}>
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
          <div className="min-h-14 p-4 text-center text-sm text-zinc-300">{current.caption}</div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-4" onClick={(e) => e.stopPropagation()}>
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setOpen(i)} className={`shrink-0 overflow-hidden rounded-md border-2 ${i === open ? "border-white" : "border-transparent opacity-50 hover:opacity-100"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="size-14 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
