"use client";

import { useActionState, useEffect, useState } from "react";
import type { Profile } from "@prisma/client";
import { Check, ExternalLink, RefreshCw } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { FormMessage, SubmitButton } from "@/components/ui";
import { CV_TEMPLATES, cvUrl } from "@/lib/cv";
import { updateCv } from "../actions";
import { EntriesEditor } from "./entries-editor";

const LANGS = ["fr", "en"] as const;

export function CvForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateCv, undefined);
  const dict = useT();
  const t = dict.cvEditor;
  const [tab, setTab] = useState<(typeof LANGS)[number]>("fr");
  const [template, setTemplate] = useState(profile.cvTemplate);
  const [version, setVersion] = useState(0);
  // Après chaque enregistrement réussi, l'aperçu est régénéré
  useEffect(() => {
    if (state?.ok) setVersion((v) => v + 1);
  }, [state]);

  const fields = {
    fr: { experience: profile.experience, education: profile.education, languages: profile.languages, suffix: "" },
    en: { experience: profile.experienceEn, education: profile.educationEn, languages: profile.languagesEn, suffix: "En" },
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <form action={action} className="min-w-0 space-y-6">
        <input type="hidden" name="cvTemplate" value={template} />

        <section className="card space-y-4 p-6">
          <h2 className="font-semibold">{t.template}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {CV_TEMPLATES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTemplate(id)}
                aria-pressed={template === id}
                className={`relative rounded-xl border p-3 text-left transition ${template === id ? "border-brand ring-2 ring-brand/40" : "border-line hover:border-white/25"}`}
              >
                <TemplateThumb id={id} />
                <span className="mt-2 block text-sm font-medium">{t.templates[id]}</span>
                <span className="block text-xs text-muted">{t.templateHints[id]}</span>
                {template === id && <Check className="absolute top-2 right-2 size-4 rounded-full bg-brand p-0.5 text-white" />}
              </button>
            ))}
          </div>
        </section>

        <section className="card space-y-6 p-6">
          <div role="tablist" className="inline-flex rounded-xl border border-line p-1 text-sm">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={tab === l}
                onClick={() => setTab(l)}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${tab === l ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                {l === "fr" ? t.frenchVersion : t.englishVersion}
              </button>
            ))}
          </div>
          {tab === "en" && <p className="-mt-2 text-sm text-muted">{t.englishHint}</p>}

          {LANGS.map((l) => {
            const f = fields[l];
            return (
              // Les deux versions restent dans le formulaire : on n'en masque qu'une
              <div key={l} className={`space-y-6 ${tab === l ? "" : "hidden"}`}>
                <div>
                  <h3 className="label text-base">{dict.cv.experience}</h3>
                  <EntriesEditor name={`experience${f.suffix}`} initial={f.experience} addLabel={t.addExperience} lang={l} />
                </div>
                <div>
                  <h3 className="label text-base">{dict.cv.education}</h3>
                  <EntriesEditor name={`education${f.suffix}`} initial={f.education} addLabel={t.addEducation} lang={l} />
                </div>
                <div>
                  <label className="label" htmlFor={`languages${f.suffix}`}>{dict.cv.languages}</label>
                  <input id={`languages${f.suffix}`} name={`languages${f.suffix}`} defaultValue={f.languages} className="input" placeholder={dict.cv.languagesPlaceholder} lang={l} />
                </div>
              </div>
            );
          })}

          <label className="flex cursor-pointer items-center gap-3 border-t border-line pt-5 text-sm">
            <input type="checkbox" name="cvPublic" defaultChecked={profile.cvPublic} className="size-4 accent-[#7c5cff]" />
            {dict.cv.showOnPortfolio}
          </label>
        </section>

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-ink/90 p-3 backdrop-blur">
          <SubmitButton pendingText={dict.common.saving}>{dict.cv.submit}</SubmitButton>
          <div className="min-w-0 flex-1">
            <FormMessage state={state} />
          </div>
        </div>
      </form>

      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line p-3">
            <span className="text-sm font-medium">{t.preview} · {tab.toUpperCase()}</span>
            <button type="button" onClick={() => setVersion((v) => v + 1)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white" title={t.refresh}>
              <RefreshCw className="size-4" />
            </button>
          </div>
          <iframe
            key={`${tab}-${template}-${version}`}
            src={`${cvUrl(profile.slug, tab, { template, inline: "1", v: String(version) })}#toolbar=0&navpanes=0&view=FitH`}
            title={t.preview}
            className="aspect-[1/1.414] w-full bg-white"
          />
          <div className="flex items-center justify-between gap-3 border-t border-line p-3 text-xs text-muted">
            <span>{t.previewHint}</span>
            <a href={cvUrl(profile.slug, tab, { template, inline: "1" })} target="_blank" rel="noopener" className="flex shrink-0 items-center gap-1 text-zinc-300 hover:text-white">
              {t.openPreview} <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** Miniature schématique de chaque modèle. */
function TemplateThumb({ id }: { id: string }) {
  const bar = "h-1 rounded-full bg-zinc-300";
  return (
    <div className="flex aspect-[1/1.2] overflow-hidden rounded-md bg-white">
      {id === "modern" && <div className="w-1/3 bg-[#1b1c2c] p-1.5"><div className="mx-auto size-4 rounded-full bg-brand" /></div>}
      <div className={`flex-1 space-y-1.5 ${id === "minimal" ? "p-3" : "p-2"} ${id === "classic" ? "text-center" : ""}`}>
        <div className={`h-1.5 w-2/3 rounded-full bg-zinc-800 ${id === "classic" ? "mx-auto" : ""}`} />
        <div className={`h-1 w-1/2 rounded-full ${id === "minimal" ? "bg-zinc-400" : "bg-brand"} ${id === "classic" ? "mx-auto" : ""}`} />
        {id === "classic" && <div className="h-px bg-zinc-800" />}
        <div className={`${bar} w-full`} />
        <div className={`${bar} w-5/6`} />
        <div className={`${bar} w-4/6`} />
        <div className={`${bar} w-full`} />
      </div>
    </div>
  );
}
