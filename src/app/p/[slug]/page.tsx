import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Globe, Link2, Mail, MapPin, Phone, Play } from "lucide-react";
import { Avatar } from "@/components/brand";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getPublicProfile } from "@/lib/public";
import { themeStyle } from "@/lib/theme";
import { splitList } from "@/lib/utils";
import { ContactForm } from "./contact-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicProfile((await params).slug);
  if (!profile) return { title: "Portfolio introuvable" };
  return {
    title: profile.fullName,
    description: profile.headline || profile.bio.slice(0, 160),
    openGraph: { images: profile.coverUrl || profile.avatarUrl ? [(profile.coverUrl || profile.avatarUrl)!] : [] },
  };
}

export default async function PortfolioPage({ params }: Props) {
  const profile = await getPublicProfile((await params).slug);
  if (!profile) notFound();
  const projects = profile.user.projects;
  const skills = splitList(profile.skills);
  const links = [
    { href: profile.website, label: "Site web", icon: Globe },
    { href: profile.github, label: "GitHub", icon: Link2 },
    { href: profile.linkedin, label: "LinkedIn", icon: Link2 },
  ].filter((l) => l.href);

  return (
    <div className="portfolio-theme" style={themeStyle(profile)}>
      <SiteHeader />

      {/* En-tête */}
      <section className="relative">
        <div
          className="h-56 bg-cover bg-center sm:h-72"
          style={{
            backgroundImage: profile.coverUrl
              ? `url(${profile.coverUrl})`
              : `radial-gradient(circle at 20% 30%, ${profile.accent}55, transparent 50%), radial-gradient(circle at 80% 10%, ${profile.accent}33, transparent 45%)`,
          }}
        >
          <div className="h-full bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
        </div>
        <div className="container-page relative -mt-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar name={profile.fullName} src={profile.avatarUrl} size={140} className="shrink-0 border-4 border-ink shadow-2xl" />
            {/* Le texte commence sous la couverture pour rester lisible quel que soit le thème */}
            <div className="flex-1 sm:pt-24">
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{profile.fullName}</h1>
              {profile.headline && <p className="mt-2 text-lg text-zinc-300">{profile.headline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
                {profile.location && <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {profile.location}</span>}
                {profile.phone && <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 hover:text-zinc-100"><Phone className="size-4" /> {profile.phone}</a>}
                {links.map(({ href, label, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-zinc-100">
                    <Icon className="size-4" /> {label}
                  </a>
                ))}
              </div>
            </div>
            <a
              href="#contact"
              className="btn-primary btn-accent self-start sm:self-end"
            >
              <Mail className="size-4" /> Me contacter
            </a>
          </div>
        </div>
      </section>

      <div className="container-page mt-14 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-14">
          {profile.bio && (
            <section>
              <SectionTitle>À propos</SectionTitle>
              <p className="prose-content">{profile.bio}</p>
            </section>
          )}

          <section>
            <SectionTitle>Réalisations <span className="text-zinc-500">({projects.length})</span></SectionTitle>
            {projects.length === 0 ? (
              <p className="text-muted">Aucune réalisation publiée pour le moment.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {projects.map((p) => (
                  <Link key={p.id} href={`/p/${profile.slug}/${p.id}`} className="card group overflow-hidden transition hover:border-zinc-500">
                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100/5">
                      {p.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverUrl} alt={p.title} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="grid size-full place-items-center font-display text-4xl font-bold text-zinc-100/10" style={{ background: `linear-gradient(135deg, ${profile.accent}33, transparent)` }}>
                          {p.title.slice(0, 1)}
                        </div>
                      )}
                      {p._count.media > 0 && (
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
                          <Play className="size-3" /> {p._count.media} média{p._count.media > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                        <ArrowUpRight className="size-5 shrink-0 text-zinc-600 transition group-hover:text-zinc-100" />
                      </div>
                      {p.summary && <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{p.summary}</p>}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {splitList(p.tags).slice(0, 4).map((t) => <span key={t} className="badge">{t}</span>)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section id="contact" className="scroll-mt-24">
            <SectionTitle>Contact</SectionTitle>
            <div className="card p-6">
              <p className="mb-5 text-sm text-zinc-400">Un projet, une question ? Écrivez directement à {profile.fullName.split(" ")[0]}.</p>
              <ContactForm slug={profile.slug} name={profile.fullName} />
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {skills.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Compétences</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="rounded-lg px-2.5 py-1 text-sm" style={{ backgroundColor: "color-mix(in oklab, var(--accent) 16%, transparent)" }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-3 font-display text-2xl font-bold">
      <span className="h-6 w-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
      {children}
    </h2>
  );
}
