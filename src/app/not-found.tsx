import Link from "next/link";
import { getT } from "@/lib/i18n-server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="font-display text-7xl font-bold text-gradient">404</p>
        <h1 className="mt-4 text-xl font-semibold">{t.notFound.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.notFound.text}</p>
        <Link href="/" className="btn-primary mt-6">{t.notFound.back}</Link>
      </div>
    </main>
  );
}
