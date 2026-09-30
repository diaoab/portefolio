import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { SubmitButton } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { deleteProject } from "../../actions";
import { MediaManager } from "../media-manager";
import { ProjectForm } from "../project-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).projects.edit };
}

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { created } = await searchParams;
  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: { media: { orderBy: { position: "asc" } } },
  });
  if (!project) notFound();
  const dict = await getT();
  const t = dict.projects;

  const publicUrl = user.profile?.published && project.published ? `/p/${user.profile.slug}/${project.id}` : null;

  return (
    <div className="max-w-6xl">
      <Link href="/dashboard/projects" className="text-sm text-muted hover:text-white">{t.back}</Link>
      <PageHeader
        title={project.title}
        description={created ? t.created : t.editDescription}
        actions={
          <div className="flex gap-2">
            {publicUrl && (
              <Link href={publicUrl} target="_blank" className="btn-ghost"><ExternalLink className="size-4" /> {dict.common.view}</Link>
            )}
            <form action={deleteProject}>
              <input type="hidden" name="id" value={project.id} />
              <SubmitButton className="btn-danger" confirm={t.confirmDelete}>
                <Trash2 className="size-4" /> {dict.common.delete}
              </SubmitButton>
            </form>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <ProjectForm project={project} />
        <MediaManager projectId={project.id} media={project.media} coverUrl={project.coverUrl} />
      </div>
    </div>
  );
}
