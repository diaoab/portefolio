import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { ProjectList } from "./project-list";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).projects.title };
}

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
    include: { _count: { select: { media: true } } },
  });
  const dict = await getT();
  const t = dict.projects;

  return (
    <>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={<Link href="/dashboard/projects/new" className="btn-primary"><Plus className="size-4" /> {t.new}</Link>}
      />

      {projects.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-12 text-center">
          <ImageIcon className="size-10 text-zinc-600" />
          <p className="font-medium">{t.emptyTitle}</p>
          <p className="max-w-sm text-sm text-muted">{t.emptyText}</p>
          <Link href="/dashboard/projects/new" className="btn-primary mt-2">{t.createFirst}</Link>
        </div>
      ) : (
        <ProjectList projects={projects} />
      )}
    </>
  );
}
