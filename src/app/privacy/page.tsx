import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getT } from "@/lib/i18n-server";
import { getLocalizedSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).legal.privacy };
}

export default async function PrivacyPage() {
  const [t, s] = await Promise.all([getT(), getLocalizedSettings()]);
  return <LegalPage title={t.legal.privacy} content={s.privacyText || t.legal.privacyDefault(s.siteName)} />;
}
