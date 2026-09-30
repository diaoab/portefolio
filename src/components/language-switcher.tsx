"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALES } from "@/lib/i18n";
import { setLocale } from "@/lib/locale-actions";
import { useLocale, useT } from "./i18n-provider";

/** Bascule FR / EN : enregistre le choix dans un cookie puis recharge la page. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const current = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div
      role="group"
      aria-label={t.lang.label}
      className={`inline-flex items-center gap-0.5 rounded-xl border border-line bg-white/[0.03] p-0.5 text-xs font-semibold ${pending ? "opacity-60" : ""} ${className}`}
    >
      <Languages className="mx-1.5 size-3.5 text-zinc-500" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          title={t.lang[l]}
          aria-pressed={l === current}
          disabled={pending}
          onClick={() =>
            l !== current &&
            start(async () => {
              await setLocale(l);
              router.refresh();
            })
          }
          className={`rounded-lg px-2 py-1 uppercase transition ${
            l === current ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
