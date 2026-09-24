import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Mon espace" };

export default async function DashboardHome() {
  const user = await requireUser();
  const profile = user.profile!;
  const [projects, published, messages, unread] = await Promise.all([
    db.project.count({ where: { userId: user.id } }),
    db.project.count({ where: { userId: user.id, published: true } }),
    db.message.count({ where: { toUserId: user.id } }),
    db.message.count({ where: { toUserId: user.id, read: false } }),
  ]);

  const steps = [
    { done: !!profile.avatarUrl, label: "Ajouter une photo de profil", href: "/dashboard/profile" },
    { done: !!profile.headline && !!profile.bio, label: "Rédiger votre titre et votre bio", href: "/dashboard/profile" },
    { done: !!profile.skills, label: "Lister vos compétences", href: "/dashboard/profile" },
    { done: published > 0, label: "Publier une première réalisation", href: "/dashboard/projects/new" },
    { done: profile.published, label: "Rendre votre portfolio public", href: "/dashboard/profile" },
  ];
  const progress = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  return (
    <>
      <PageHeader
        title={`Bonjour ${profile.fullName.split(" ")[0]} 👋`}
        description="Gérez votre profil, vos réalisations et vos messages."
        actions={
          profile.published ? (
            <Link href={`/p/${profile.slug}`} target="_blank" className="btn-ghost">
              Voir mon portfolio <ExternalLink className="size-4" />
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Réalisations" value={projects} hint={`${published} publiée(s)`} href="/dashboard/projects" />
        <Stat label="Messages" value={messages} hint={`${unread} non lu(s)`} href="/dashboard/messages" />
        <Stat
          label="Portfolio"
          value={profile.published ? "En ligne" : "Brouillon"}
          hint={profile.published ? `/p/${profile.slug}` : "Non visible publiquement"}
          href="/dashboard/profile"
        />
      </div>

      <div className="card mt-8 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Complétez votre portfolio</h2>
          <span className="text-sm text-muted">{progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <ul className="mt-5 space-y-1">
          {steps.map((s) => (
            <li key={s.label}>
              <Link href={s.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/[0.04]">
                {s.done ? <CheckCircle2 className="size-5 text-emerald-400" /> : <Circle className="size-5 text-zinc-600" />}
                <span className={s.done ? "text-zinc-500 line-through" : ""}>{s.label}</span>
                {!s.done && <ArrowRight className="ml-auto size-4 text-zinc-500" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Stat({ label, value, hint, href }: { label: string; value: string | number; hint: string; href: string }) {
  return (
    <Link href={href} className="card block p-5 transition hover:border-white/20">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 truncate text-xs text-zinc-500">{hint}</p>
    </Link>
  );
}
