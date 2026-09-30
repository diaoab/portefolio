import Link from "next/link";
import { Logo } from "./brand";
import { LanguageSwitcher } from "./language-switcher";

/** Mise en page commune des écrans connexion / mot de passe oublié. */
export function AuthCard({ title, intro, children, footer }: { title: string; intro: string; children: React.ReactNode; footer?: { href: string; label: string } }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
      <LanguageSwitcher className="absolute top-4 right-4" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-muted">{intro}</p>
          {children}
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm">
            <Link href={footer.href} className="text-zinc-300 underline-offset-4 hover:underline">{footer.label}</Link>
          </p>
        )}
      </div>
    </main>
  );
}
