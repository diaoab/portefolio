import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageIcon, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { SubmitButton } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { moveProject, toggleProjectPublished } from "../actions";

export const metadata = { title: "Réalisations" };

const iconBtn = "rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
    include: { _count: { select: { media: true } } },
  });

  return (
    <>
      <PageHeader
        title="Réalisations"
        description="Vos projets, travaux et créations. L'ordre ci-dessous est celui du portfolio."
        actions={<Link href="/dashboard/projects/new" className="btn-primary"><Plus className="size-4" /> Nouvelle réalisation</Link>}
      />

      {projects.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-12 text-center">
          <ImageIcon className="size-10 text-zinc-600" />
          <p className="font-medium">Aucune réalisation pour l&apos;instant</p>
          <p className="max-w-sm text-sm text-muted">Ajoutez vos projets avec images, vidéos et descriptions pour les présenter sur votre portfolio.</p>
          <Link href="/dashboard/projects/new" className="btn-primary mt-2">Créer ma première réalisation</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p, i) => (
            <li key={p.id} className="card flex items-center gap-4 p-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-white/5 sm:h-16 sm:w-24">
                {p.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverUrl} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/projects/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                <p className="truncate text-sm text-muted">{p.summary || "—"}</p>
                <div className="mt-1 flex gap-2 text-xs">
                  <span className={`badge ${p.published ? "text-emerald-300" : "text-zinc-500"}`}>{p.published ? "Publiée" : "Brouillon"}</span>
                  <span className="badge">{p._count.media} média(s)</span>
                </div>
              </div>
              <div className="flex items-center">
                <form action={moveProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="dir" value="up" />
                  <SubmitButton className={`${iconBtn} ${i === 0 ? "invisible" : ""}`}><ArrowUp className="size-4" /></SubmitButton>
                </form>
                <form action={moveProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="dir" value="down" />
                  <SubmitButton className={`${iconBtn} ${i === projects.length - 1 ? "invisible" : ""}`}><ArrowDown className="size-4" /></SubmitButton>
                </form>
                <form action={toggleProjectPublished}>
                  <input type="hidden" name="id" value={p.id} />
                  <SubmitButton className={iconBtn}>{p.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</SubmitButton>
                </form>
                <Link href={`/dashboard/projects/${p.id}`} className={iconBtn}><Pencil className="size-4" /></Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
