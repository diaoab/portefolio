import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { getT } from "@/lib/i18n-server";
import { Avatar, Logo } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { NavLinks, type NavItem } from "./nav-links";

export async function AppShell({
  user,
  items,
  title,
  children,
}: {
  user: { email: string; role: string; profile: { fullName: string; avatarUrl: string | null; slug: string; published: boolean } | null };
  items: NavItem[];
  title: string;
  children: React.ReactNode;
}) {
  const name = user.profile?.fullName ?? user.email;
  const t = await getT();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-line bg-panel/60 p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
        <div className="mb-4 flex items-center justify-between lg:mb-8">
          <Logo href="/" />
          <span className="badge">{title}</span>
        </div>
        <NavLinks items={items} />
        <LanguageSwitcher className="mt-4 lg:mt-6" />
        <div className="mt-4 hidden border-t border-line pt-4 lg:mt-auto lg:block">
          {user.profile?.published && (
            <Link href={`/p/${user.profile.slug}`} target="_blank" className="mb-3 flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
              <ExternalLink className="size-3.5" /> {t.shell.viewPublic}
            </Link>
          )}
          <div className="flex items-center gap-3">
            <Avatar name={name} src={user.profile?.avatarUrl} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <form action={logout}>
              <button title={t.shell.logout} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
        <form action={logout} className="mt-3 lg:hidden">
          <button className="text-xs text-zinc-400 hover:text-white">{t.shell.logoutMobile(user.email)}</button>
        </form>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
