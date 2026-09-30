import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/nav-links";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [unread, t] = await Promise.all([db.message.count({ where: { toUserId: user.id, read: false } }), getT()]);

  const items: NavItem[] = [
    { href: "/dashboard", label: t.nav.overview, icon: "home", exact: true },
    { href: "/dashboard/profile", label: t.nav.profile, icon: "profile" },
    { href: "/dashboard/cv", label: t.nav.cv, icon: "cv" },
    { href: "/dashboard/projects", label: t.nav.projects, icon: "projects" },
    { href: "/dashboard/messages", label: t.nav.messages, icon: "inbox", badge: unread },
    { href: "/dashboard/account", label: t.nav.security, icon: "account" },
  ];
  if (user.role === "SUPER_ADMIN") items.push({ href: "/admin", label: t.nav.admin, icon: "admin" });

  return (
    <AppShell user={user} items={items} title={t.nav.mySpace}>
      {children}
    </AppShell>
  );
}
