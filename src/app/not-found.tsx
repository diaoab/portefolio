import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="font-display text-7xl font-bold text-gradient">404</p>
        <h1 className="mt-4 text-xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-sm text-muted">Ce portfolio n&apos;existe pas ou n&apos;est plus publié.</p>
        <Link href="/" className="btn-primary mt-6">Voir tous les portfolios</Link>
      </div>
    </main>
  );
}
