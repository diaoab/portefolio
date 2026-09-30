"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useT } from "@/components/i18n-provider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT().errorPage;
  useEffect(() => console.error(error), [error]);
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="font-display text-6xl font-bold text-gradient">Oups</p>
        <h1 className="mt-4 text-xl font-semibold">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.text}</p>
        {error.digest && <p className="mt-1 font-mono text-xs text-zinc-600">#{error.digest}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="btn-primary"><RotateCcw className="size-4" /> {t.retry}</button>
          <Link href="/" className="btn-ghost">{t.home}</Link>
        </div>
      </div>
    </main>
  );
}
