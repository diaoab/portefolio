import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const t = (await getT()).nav;
  return (
    <AppShell
      user={user}
      title={t.superAdmin}
      items={[
        { href: "/admin", label: t.dashboard, icon: "admin", exact: true },
        { href: "/admin/users", label: t.users, icon: "users" },
        { href: "/admin/settings", label: t.settings, icon: "settings" },
        { href: "/dashboard", label: t.mySpace, icon: "home" },
      ]}
    >
      {children}
    </AppShell>
  );
}
