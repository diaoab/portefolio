import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Paramètres du site" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Paramètres du site"
        description="Nom, logo et textes de la plateforme."
        actions={<Link href="/" target="_blank" className="btn-ghost">Voir le site <ExternalLink className="size-4" /></Link>}
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
