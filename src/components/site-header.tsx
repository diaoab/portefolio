import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { getLocalizedSettings } from "@/lib/settings";
import { Logo } from "./brand";
import { LanguageSwitcher } from "./language-switcher";

export async function SiteHeader() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/70 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/#talents" className="hidden px-3 py-2 text-zinc-400 hover:text-zinc-100 sm:block">{t.header.talents}</Link>
          <LanguageSwitcher />
          {user ? (
            <Link href={user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"} className="btn-ghost">{t.header.mySpace}</Link>
          ) : (
            <Link href="/login" className="btn-ghost">{t.header.login}</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const [{ siteName, footerText }, t] = await Promise.all([getLocalizedSettings(), getT()]);
  return (
    <footer className="mt-24 border-t border-line py-8 text-sm text-zinc-500">
      <div className="container-page flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {siteName}
          {footerText && ` · ${footerText}`}
        </p>
        <nav className="flex gap-4">
          <Link href="/legal" className="hover:text-zinc-200">{t.legal.legal}</Link>
          <Link href="/privacy" className="hover:text-zinc-200">{t.legal.privacy}</Link>
        </nav>
      </div>
    </footer>
  );
}
