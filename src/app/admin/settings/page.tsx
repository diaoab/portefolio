import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n-server";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).settings.title };
}

export default async function SettingsPage() {
  const [settings, dict] = await Promise.all([getSettings(), getT()]);
  const t = dict.settings;
  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t.title}
        description={t.intro}
        actions={<Link href="/" target="_blank" className="btn-ghost">{t.viewSite} <ExternalLink className="size-4" /></Link>}
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
