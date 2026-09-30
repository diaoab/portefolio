import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getT } from "@/lib/i18n-server";
import { getLocalizedSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).legal.legal };
}

export default async function LegalNoticePage() {
  const [t, s] = await Promise.all([getT(), getLocalizedSettings()]);
  return <LegalPage title={t.legal.legal} content={s.legalText || t.legal.legalDefault(s.siteName, await siteUrl())} />;
}
