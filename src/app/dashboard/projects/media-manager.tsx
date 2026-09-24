"use client";

import { useActionState, useEffect, useState } from "react";
import type { Media } from "@prisma/client";
import { ArrowLeft, ArrowRight, Check, Film, ImageIcon, MonitorPlay, Star, Trash2 } from "lucide-react";
import { MediaUploader } from "@/components/media-uploader";
import { MediaView } from "@/components/media-view";
import { FormMessage, SubmitButton } from "@/components/ui";
import { addMedia, deleteMedia, moveMedia, setMediaAsCover, updateMediaCaption } from "../actions";

const TYPE_ICON = { IMAGE: ImageIcon, VIDEO: Film, EMBED: MonitorPlay } as const;
const iconBtn = "rounded-md bg-black/70 p-1.5 text-zinc-200 hover:text-white disabled:opacity-40";

export function MediaManager({ projectId, media, coverUrl }: { projectId: string; media: Media[]; coverUrl: string | null }) {
  const [state, action] = useActionState(addMedia, undefined);
  // Vide la zone d'envoi après chaque ajout réussi
  const [uploaderKey, setUploaderKey] = useState(0);
  useEffect(() => {
    if (state?.ok) setUploaderKey((k) => k + 1);
  }, [state]);

  return (
    <div className="card space-y-5 p-6">
      <div>
        <h2 className="font-semibold">Galerie <span className="text-muted">({media.length})</span></h2>
        <p className="text-sm text-muted">Ajoutez autant d&apos;images, de vidéos et de liens que vous voulez. Utilisez les flèches pour changer l&apos;ordre.</p>
      </div>

      {media.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {media.map((m, i) => {
            const Icon = TYPE_ICON[m.type as keyof typeof TYPE_ICON] ?? ImageIcon;
            const isCover = m.type === "IMAGE" && m.url === coverUrl;
            return (
              <li key={m.id} className="overflow-hidden rounded-xl border border-line bg-black/30">
                <div className="relative">
                  <MediaView media={m} className="aspect-video object-cover" />
                  <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-1 text-[11px] text-zinc-200">
                    <Icon className="size-3.5" /> {i + 1}
                    {isCover && <><Star className="ml-1 size-3 fill-amber-300 text-amber-300" /> Couverture</>}
                  </span>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <form action={moveMedia}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button className={iconBtn} disabled={i === 0} title="Déplacer avant"><ArrowLeft className="size-3.5" /></button>
                    </form>
                    <form action={moveMedia}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button className={iconBtn} disabled={i === media.length - 1} title="Déplacer après"><ArrowRight className="size-3.5" /></button>
                    </form>
                    {m.type === "IMAGE" && !isCover && (
                      <form action={setMediaAsCover}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className={iconBtn} title="Utiliser comme couverture"><Star className="size-3.5" /></button>
                      </form>
                    )}
                    <form action={deleteMedia}>
                      <input type="hidden" name="id" value={m.id} />
                      <SubmitButton className={`${iconBtn} hover:text-red-400`} confirm="Supprimer ce média ?">
                        <Trash2 className="size-3.5" />
                      </SubmitButton>
                    </form>
                  </div>
                </div>
                <CaptionForm id={m.id} caption={m.caption} />
              </li>
            );
          })}
        </ul>
      )}

      <form action={action} className="space-y-3 rounded-xl border border-line p-4">
        <input type="hidden" name="projectId" value={projectId} />
        <p className="text-sm font-medium">Ajouter des médias</p>
        <MediaUploader key={uploaderKey} />
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full" pendingText="Envoi en cours… (les vidéos peuvent prendre un moment)">
          Ajouter à la galerie
        </SubmitButton>
      </form>
    </div>
  );
}

function CaptionForm({ id, caption }: { id: string; caption: string }) {
  const [value, setValue] = useState(caption);
  const dirty = value !== caption;
  return (
    <form action={updateMediaCaption} className="flex items-center gap-1 p-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="caption"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={300}
        placeholder="Ajouter une légende…"
        className="w-full rounded-md bg-transparent px-2 py-1 text-xs text-zinc-300 outline-none placeholder:text-zinc-600 focus:bg-white/5"
      />
      {dirty && (
        <SubmitButton className="rounded-md bg-brand p-1 text-white">
          <Check className="size-3.5" />
        </SubmitButton>
      )}
    </form>
  );
}
