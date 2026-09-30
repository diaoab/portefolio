import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Download, ExternalLink, FileText } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { cvUrl, isCvComplete, parseEntries } from "@/lib/cv";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { statsFor } from "@/lib/stats";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).nav.mySpace };
}

export default async function DashboardHome() {
  const user = await requireUser();
  const profile = user.profile!;
  const [projects, published, messages, unread, t] = await Promise.all([
    db.project.count({ where: { userId: user.id } }),
    db.project.count({ where: { userId: user.id, published: true } }),
    db.message.count({ where: { toUserId: user.id } }),
    db.message.count({ where: { toUserId: user.id, read: false } }),
    getT(),
  ]);
  const stats = await statsFor(profile.id);
  const d = t.dashboard;

  const steps = [
    { done: !!profile.avatarUrl, label: d.steps.photo, href: "/dashboard/profile" },
    { done: !!profile.headline && !!profile.bio, label: d.steps.bio, href: "/dashboard/profile" },
    { done: !!profile.skills, label: d.steps.skills, href: "/dashboard/profile" },
    {
      done: parseEntries(profile.experience).length + parseEntries(profile.education).length > 0,
      label: d.steps.cv,
      href: "/dashboard/cv",
    },
    { done: published > 0, label: d.steps.project, href: "/dashboard/projects/new" },
    { done: profile.published, label: d.steps.publish, href: "/dashboard/profile" },
  ];
  const progress = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  return (
    <>
      <PageHeader
        title={d.hello(profile.fullName.split(" ")[0]!)}
        description={d.intro}
        actions={
          profile.published ? (
            <Link href={`/p/${profile.slug}`} target="_blank" className="btn-ghost">
              {d.viewPortfolio} <ExternalLink className="size-4" />
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={d.projects} value={projects} hint={d.publishedCount(published)} href="/dashboard/projects" />
        <Stat label={d.messages} value={messages} hint={d.unreadCount(unread)} href="/dashboard/messages" />
        <Stat
          label={d.portfolio}
          value={profile.published ? d.online : t.common.draft}
          hint={profile.published ? `/p/${profile.slug}` : d.notPublic}
          href="/dashboard/profile"
        />
      </div>

      <div className="card mt-8 p-6">
        <h2 className="font-semibold">{t.stats.title}</h2>
        {stats.views + stats.cvDownloads === 0 ? (
          <p className="mt-2 text-sm text-muted">{t.stats.empty}</p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <Trend label={t.stats.views} total={stats.views} values={stats.series.map((d) => d.views)} color="var(--color-brand)" />
            <Trend label={t.stats.cvDownloads} total={stats.cvDownloads} values={stats.series.map((d) => d.cvDownloads)} color="var(--color-brand-2)" />
          </div>
        )}
      </div>

      {isCvComplete(profile) && (
        <div className="card mt-8 flex flex-wrap items-center gap-4 border-emerald-500/30 p-5">
          <FileText className="size-8 text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{d.cvReady}</p>
            <p className="text-sm text-muted">{d.cvReadyText}</p>
          </div>
          <div className="flex gap-2">
            <a href={cvUrl(profile.slug, "fr")} className="btn-primary"><Download className="size-4" /> CV FR</a>
            <a href={cvUrl(profile.slug, "en")} className="btn-ghost"><Download className="size-4" /> CV EN</a>
          </div>
        </div>
      )}

      <div className="card mt-8 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">{d.complete}</h2>
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

/** Mini histogramme des 30 derniers jours. */
function Trend({ label, total, values, color }: { label: string; total: number; values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{total}</p>
      <div className="mt-3 flex h-14 items-end gap-[3px]" aria-hidden>
        {values.map((v, i) => (
          <span key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: color, opacity: v ? 0.9 : 0.15 }} />
        ))}
      </div>
    </div>
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
