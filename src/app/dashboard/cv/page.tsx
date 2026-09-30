import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { cvMissing, cvUrl } from "@/lib/cv";
import { getT } from "@/lib/i18n-server";
import { CvForm } from "./cv-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).cv.title };
}

export default async function CvPage() {
  const user = await requireUser();
  const profile = user.profile!;
  const t = await getT();
  const missing = cvMissing(profile, t);

  return (
    <div className="max-w-7xl">
      <PageHeader title={t.cv.title} description={t.cv.description} />

      <div className={`card mb-6 p-5 ${missing.length ? "border-amber-500/30" : "border-emerald-500/30"}`}>
        <p className="text-sm text-muted">{t.cv.status}</p>
        {missing.length === 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <p className="flex flex-1 items-center gap-2 font-semibold text-emerald-300">
              <CheckCircle2 className="size-5" /> {t.cv.ready}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">{t.cv.downloadIn}</span>
              <a href={cvUrl(profile.slug, "fr")} className="btn-primary"><Download className="size-4" /> {t.lang.fr}</a>
              <a href={cvUrl(profile.slug, "en")} className="btn-ghost"><Download className="size-4" /> {t.lang.en}</a>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm">
            <p className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertCircle className="size-5" /> {t.cv.missing}
            </p>
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-zinc-300">
              {missing.map((m) => <li key={m}>{m}</li>)}
            </ul>
            <Link href="/dashboard/profile" className="mt-3 inline-block text-zinc-200 underline-offset-4 hover:underline">
              {t.cv.editProfile} →
            </Link>
          </div>
        )}
      </div>

      <CvForm profile={profile} />
    </div>
  );
}
