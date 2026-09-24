import Link from "next/link";
import { ArrowRight, FolderKanban, Globe, Mail, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Avatar } from "@/components/brand";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Administration" };

export default async function AdminHome() {
  const [users, published, projects, messages, recent] = await Promise.all([
    db.user.count(),
    db.profile.count({ where: { published: true, user: { active: true } } }),
    db.project.count({ where: { published: true } }),
    db.message.count(),
    db.user.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { profile: true } }),
  ]);

  const stats = [
    { label: "Utilisateurs", value: users, icon: Users },
    { label: "Portfolios publiés", value: published, icon: Globe },
    { label: "Réalisations publiées", value: projects, icon: FolderKanban },
    { label: "Messages reçus", value: messages, icon: Mail },
  ];

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la plateforme."
        actions={<Link href="/admin/users" className="btn-primary">Gérer les utilisateurs <ArrowRight className="size-4" /></Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <Icon className="size-5 text-brand" />
            <p className="mt-4 font-display text-3xl font-bold">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="card mt-8">
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="font-semibold">Derniers comptes créés</h2>
          <Link href="/admin/users" className="text-sm text-muted hover:text-white">Tout voir</Link>
        </div>
        <ul className="divide-y divide-line">
          {recent.map((u) => (
            <li key={u.id} className="flex items-center gap-3 p-4">
              <Avatar name={u.profile?.fullName ?? u.email} src={u.profile?.avatarUrl} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.profile?.fullName}</p>
                <p className="truncate text-xs text-muted">{u.email}</p>
              </div>
              <span className="hidden text-xs text-muted sm:block">{formatDate(u.createdAt)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
