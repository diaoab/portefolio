import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <AppShell
      user={user}
      title="Super admin"
      items={[
        { href: "/admin", label: "Tableau de bord", icon: "admin", exact: true },
        { href: "/admin/users", label: "Utilisateurs", icon: "users" },
        { href: "/admin/settings", label: "Paramètres du site", icon: "settings" },
        { href: "/dashboard", label: "Mon espace", icon: "home" },
      ]}
    >
      {children}
    </AppShell>
  );
}
