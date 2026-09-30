"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { SubmitButton } from "@/components/ui";
import { useSortable } from "@/components/use-sortable";
import { moveProject, reorderProjects, toggleProjectPublished } from "../actions";

type Item = { id: string; title: string; summary: string; coverUrl: string | null; published: boolean; _count: { media: number } };

const iconBtn = "rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white";

/** Liste des réalisations, réorganisable par glisser-déposer (les flèches restent disponibles au clavier). */
export function ProjectList({ projects }: { projects: Item[] }) {
  const dict = useT();
  const t = dict.projects;
  const { list, bind, pending } = useSortable(projects, reorderProjects);

  return (
    <ul className={`space-y-3 ${pending ? "opacity-70" : ""}`}>
      {list.map((p, i) => (
        <li key={p.id} {...bind(i)} className="card flex items-center gap-3 p-3 transition">
          <GripVertical className="size-4 shrink-0 text-zinc-600" aria-hidden />
          <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-white/5 sm:h-16 sm:w-24">
            {p.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.coverUrl} alt="" draggable={false} className="size-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/dashboard/projects/${p.id}`} draggable={false} className="font-medium hover:underline">{p.title}</Link>
            <p className="truncate text-sm text-muted">{p.summary || "—"}</p>
            <div className="mt-1 flex gap-2 text-xs">
              <span className={`badge ${p.published ? "text-emerald-300" : "text-zinc-500"}`}>{p.published ? t.published : dict.common.draft}</span>
              <span className="badge">{t.mediaCount(p._count.media)}</span>
            </div>
          </div>
          <div className="flex items-center">
            <form action={moveProject}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="dir" value="up" />
              <SubmitButton className={`${iconBtn} ${i === 0 ? "invisible" : ""}`}><ArrowUp className="size-4" /><span className="sr-only">{dict.cvEditor.moveUp}</span></SubmitButton>
            </form>
            <form action={moveProject}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="dir" value="down" />
              <SubmitButton className={`${iconBtn} ${i === list.length - 1 ? "invisible" : ""}`}><ArrowDown className="size-4" /><span className="sr-only">{dict.cvEditor.moveDown}</span></SubmitButton>
            </form>
            <form action={toggleProjectPublished}>
              <input type="hidden" name="id" value={p.id} />
              <SubmitButton className={iconBtn}>
                {p.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                <span className="sr-only">{p.published ? dict.admin.unpublish : dict.admin.publish}</span>
              </SubmitButton>
            </form>
            <Link href={`/dashboard/projects/${p.id}`} draggable={false} className={iconBtn}><Pencil className="size-4" /></Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
