import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  const { next } = await searchParams;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">Bon retour 👋</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Connectez-vous pour gérer votre portfolio.</p>
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Pas encore de compte ? Votre accès est créé par l&apos;administrateur.
          <br />
          <Link href="/" className="text-zinc-200 underline-offset-4 hover:underline">← Retour aux portfolios</Link>
        </p>
      </div>
    </main>
  );
}
