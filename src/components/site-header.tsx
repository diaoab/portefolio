import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Logo } from "./brand";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/70 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/#talents" className="hidden px-3 py-2 text-zinc-400 hover:text-zinc-100 sm:block">Talents</Link>
          {user ? (
            <Link href={user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"} className="btn-ghost">Mon espace</Link>
          ) : (
            <Link href="/login" className="btn-ghost">Connexion</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const { siteName, footerText } = await getSettings();
  return (
    <footer className="mt-24 border-t border-line py-8 text-center text-sm text-zinc-500">
      © {new Date().getFullYear()} {siteName}
      {footerText && ` · ${footerText}`}
    </footer>
  );
}
