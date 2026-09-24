import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/nav-links";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await db.message.count({ where: { toUserId: user.id, read: false } });

  const items: NavItem[] = [
    { href: "/dashboard", label: "Aperçu", icon: "home", exact: true },
    { href: "/dashboard/profile", label: "Mon profil", icon: "profile" },
    { href: "/dashboard/projects", label: "Réalisations", icon: "projects" },
    { href: "/dashboard/messages", label: "Messages", icon: "inbox", badge: unread },
    { href: "/dashboard/account", label: "Sécurité", icon: "account" },
  ];
  if (user.role === "SUPER_ADMIN") items.push({ href: "/admin", label: "Administration", icon: "admin" });

  return (
    <AppShell user={user} items={items} title="Mon espace">
      {children}
    </AppShell>
  );
}
