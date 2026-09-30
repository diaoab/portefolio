import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { getLocale } from "@/lib/i18n-server";
import { getLocalizedSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getLocalizedSettings();
  return {
    metadataBase: new URL(await siteUrl()),
    title: { default: s.siteName, template: `%s · ${s.siteName}` },
    openGraph: { siteName: s.siteName, type: "website" },
    description: s.metaDescription,
    icons: s.logoUrl ? { icon: s.logoUrl } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${inter.variable} ${grotesk.variable}`}>
      <body className="min-h-screen font-sans">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
