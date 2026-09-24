import Link from "next/link";
import { ArrowUpRight, MapPin, Search, Sparkles } from "lucide-react";
import { Avatar } from "@/components/brand";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { visibleProfile } from "@/lib/public";
import { getSettings } from "@/lib/settings";
import { splitList } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() ?? "";
  const settings = await getSettings();
  const profiles = await db.profile.findMany({
    where: {
      ...visibleProfile,
      ...(q && {
        OR: [
          { fullName: { contains: q } },
          { headline: { contains: q } },
          { skills: { contains: q } },
          { location: { contains: q } },
        ],
      }),
    },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { _count: { select: { projects: { where: { published: true } } } } } } },
  });

  return (
    <>
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand/25 to-brand-2/20 blur-3xl" />
        <div className="container-page relative py-20 text-center sm:py-28">
          <span className="badge mx-auto mb-6">
            <Sparkles className="size-3.5 text-brand" /> {profiles.length} talent{profiles.length > 1 ? "s" : ""} à découvrir
          </span>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
            <span className="text-gradient">{settings.heroTitle}</span>
            {settings.heroTitleLine2 && (
              <>
                <br />
                {settings.heroTitleLine2}
              </>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-zinc-400 sm:text-lg">
            {settings.heroDescription}
          </p>
          <form className="mx-auto mt-10 flex max-w-lg items-center gap-2 rounded-2xl border border-line bg-panel/80 p-2 backdrop-blur" action="/#talents">
            <Search className="ml-2 size-5 shrink-0 text-zinc-500" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Nom, métier, compétence, ville…"
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-500"
            />
            <button className="btn-primary shrink-0">Rechercher</button>
          </form>
        </div>
      </section>

      <section id="talents" className="container-page scroll-mt-20">
        {q && (
          <p className="mb-6 text-sm text-muted">
            {profiles.length} résultat(s) pour « {q} » ·{" "}
            <Link href="/#talents" className="text-zinc-200 hover:underline">Effacer</Link>
          </p>
        )}
        {profiles.length === 0 ? (
          <div className="card p-12 text-center text-muted">
            {q ? "Aucun portfolio ne correspond à votre recherche." : "Aucun portfolio publié pour le moment."}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/p/${p.slug}`}
                className="card group relative overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className="h-28 bg-cover bg-center"
                  style={{
                    backgroundImage: p.coverUrl
                      ? `url(${p.coverUrl})`
                      : `linear-gradient(135deg, ${p.accent}66, transparent 70%), radial-gradient(circle at 80% 20%, ${p.accent}44, transparent 50%)`,
                  }}
                />
                <div className="p-5 pt-0">
                  <Avatar name={p.fullName} src={p.avatarUrl} size={64} className="-mt-8 border-4 border-panel" />
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-lg font-semibold">{p.fullName}</h2>
                      <p className="truncate text-sm text-zinc-400">{p.headline || "Portfolio"}</p>
                    </div>
                    <ArrowUpRight className="size-5 shrink-0 text-zinc-600 transition group-hover:text-white" />
                  </div>
                  {p.location && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500"><MapPin className="size-3" /> {p.location}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {splitList(p.skills).slice(0, 4).map((s) => (
                      <span key={s} className="badge">{s}</span>
                    ))}
                  </div>
                  <p className="mt-4 border-t border-line pt-3 text-xs text-zinc-500">
                    {p.user._count.projects} réalisation{p.user._count.projects > 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </>
  );
}
