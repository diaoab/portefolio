import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { Avatar } from "@/components/brand";
import { ProjectGallery } from "@/components/project-gallery";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { visibleProfile } from "@/lib/public";
import { themeStyle } from "@/lib/theme";
import { splitList } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; projectId: string }> };

async function getProject({ slug, projectId }: { slug: string; projectId: string }) {
  return db.project.findFirst({
    where: { id: projectId, published: true, user: { profile: { slug, ...visibleProfile } } },
    include: { media: { orderBy: { position: "asc" } }, user: { include: { profile: true } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject(await params);
  if (!project) return { title: "Réalisation introuvable" };
  return {
    title: `${project.title} — ${project.user.profile!.fullName}`,
    description: project.summary,
    openGraph: { images: project.coverUrl ? [project.coverUrl] : [] },
  };
}

export default async function ProjectPage({ params }: Props) {
  const project = await getProject(await params);
  if (!project) notFound();
  const profile = project.user.profile!;

  return (
    <div className="portfolio-theme" style={themeStyle(profile)}>
      <SiteHeader />
      <article className="container-page max-w-4xl py-10">
        <Link href={`/p/${profile.slug}`} className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100">
          <ArrowLeft className="size-4" /> Portfolio de {profile.fullName}
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap gap-1.5">
            {splitList(project.tags).map((t) => <span key={t} className="badge">{t}</span>)}
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">{project.title}</h1>
          {project.summary && <p className="mt-3 text-lg text-zinc-400">{project.summary}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href={`/p/${profile.slug}`} className="flex items-center gap-3">
              <Avatar name={profile.fullName} src={profile.avatarUrl} size={40} />
              <span className="text-sm">
                <span className="block font-medium">{profile.fullName}</span>
                <span className="block text-zinc-500">{profile.headline}</span>
              </span>
            </Link>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn-ghost ml-auto">
                Voir le projet <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </header>

        {project.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.coverUrl} alt={project.title} className="mt-10 w-full rounded-2xl border border-line object-cover" />
        )}

        {project.content && <div className="prose-content mt-10 text-base">{project.content}</div>}

        {project.media.length > 0 && (
          <section className="mt-12 space-y-6">
            <h2 className="font-display text-2xl font-bold">
              Galerie <span className="text-zinc-500">({project.media.length})</span>
            </h2>
            <ProjectGallery media={project.media.map(({ id, type, url, caption }) => ({ id, type, url, caption }))} />
          </section>
        )}

        <div className="card mt-16 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="font-semibold">Ce projet vous intéresse ?</p>
            <p className="text-sm text-muted">Contactez {profile.fullName} pour en discuter.</p>
          </div>
          <Link
            href={`/p/${profile.slug}#contact`}
            className="btn-primary btn-accent"
          >
            <Mail className="size-4" /> Prendre contact
          </Link>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
