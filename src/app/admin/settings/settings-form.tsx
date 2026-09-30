"use client";

import { useActionState } from "react";
import type { SiteSettings } from "@prisma/client";
import { useT } from "@/components/i18n-provider";
import { ImageField } from "@/components/image-field";
import { FormMessage, SubmitButton } from "@/components/ui";
import { updateSettings } from "../actions";

/** Champ traduisible : version française (obligatoire selon le champ) et version anglaise côte à côte. */
function Bilingual({
  name,
  label,
  settings,
  max,
  rows,
  required,
  placeholder,
}: {
  name: "heroTitle" | "heroTitleLine2" | "heroDescription" | "metaDescription" | "footerText" | "legalText" | "privacyText";
  label: string;
  settings: SiteSettings;
  max: number;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const t = useT();
  const enName = `${name}En` as const;
  const langs = [
    { lang: "fr", id: name, value: settings[name], required },
    { lang: "en", id: enName, value: settings[enName], required: false },
  ];
  return (
    <div>
      <span className="label">{label}</span>
      <div className="grid gap-3 sm:grid-cols-2">
        {langs.map(({ lang, id, value, required }) => (
          <div key={lang} className="relative">
            <span className="pointer-events-none absolute top-2.5 right-3 text-[10px] font-bold uppercase text-zinc-500">{lang}</span>
            {rows ? (
              <textarea id={id} name={id} rows={rows} maxLength={max} defaultValue={value} required={required} placeholder={placeholder} className="input pr-10" lang={lang} aria-label={`${label} (${t.lang[lang as "fr" | "en"]})`} />
            ) : (
              <input id={id} name={id} maxLength={max} defaultValue={value} required={required} className="input pr-10" lang={lang} aria-label={`${label} (${t.lang[lang as "fr" | "en"]})`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useActionState(updateSettings, undefined);
  const dict = useT();
  const t = dict.settings;

  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">{t.identity}</h2>
          <p className="text-sm text-muted">{t.identityText}</p>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <ImageField name="logo" label={t.logo} current={settings.logoUrl} shape="square" />
          <div className="flex-1">
            <label className="label" htmlFor="siteName">{t.siteName}</label>
            <input id="siteName" name="siteName" required maxLength={60} defaultValue={settings.siteName} className="input" />
            <p className="mt-2 text-xs text-muted">{t.logoHint}</p>
          </div>
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">{t.homepage}</h2>
          <p className="text-sm text-muted">{t.homepageText}</p>
        </div>
        <Bilingual name="heroTitle" label={t.heroTitle} settings={settings} max={120} required />
        <Bilingual name="heroTitleLine2" label={t.heroTitleLine2} settings={settings} max={120} />
        <Bilingual name="heroDescription" label={t.heroDescription} settings={settings} max={400} rows={3} />
      </section>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">{t.seo}</h2>
        </div>
        <Bilingual name="metaDescription" label={t.metaDescription} settings={settings} max={300} rows={2} />
        <Bilingual name="footerText" label={t.footerText} settings={settings} max={200} />
        <p className="text-xs text-muted">{t.enHint}</p>
      </section>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">{dict.settingsLegal.title}</h2>
          <p className="text-sm text-muted">{dict.settingsLegal.text}</p>
        </div>
        <Bilingual name="legalText" label={dict.settingsLegal.legal} settings={settings} max={20000} rows={8} placeholder={dict.legal.legalDefault(settings.siteName, "https://…")} />
        <Bilingual name="privacyText" label={dict.settingsLegal.privacy} settings={settings} max={20000} rows={8} placeholder={dict.legal.privacyDefault(settings.siteName)} />
      </section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-ink/90 p-3 backdrop-blur">
        <SubmitButton pendingText={dict.common.saving}>{t.submit}</SubmitButton>
        <div className="min-w-0 flex-1">
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
