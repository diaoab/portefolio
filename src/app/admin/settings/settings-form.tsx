"use client";

import { useActionState } from "react";
import type { SiteSettings } from "@prisma/client";
import { ImageField } from "@/components/image-field";
import { FormMessage, SubmitButton } from "@/components/ui";
import { updateSettings } from "../actions";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useActionState(updateSettings, undefined);

  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">Identité du site</h2>
          <p className="text-sm text-muted">Affichés dans l&apos;en-tête, l&apos;onglet du navigateur et les espaces de connexion.</p>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <ImageField name="logo" label="Logo" current={settings.logoUrl} shape="square" />
          <div className="flex-1">
            <label className="label" htmlFor="siteName">Nom du site</label>
            <input id="siteName" name="siteName" required maxLength={60} defaultValue={settings.siteName} className="input" />
            <p className="mt-2 text-xs text-muted">
              Logo : image carrée recommandée (PNG, SVG converti en PNG, WebP…), 8 Mo max. Sans logo, l&apos;initiale du nom est affichée.
            </p>
          </div>
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">Page d&apos;accueil</h2>
          <p className="text-sm text-muted">Le grand titre et le texte de présentation de la page publique.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="heroTitle">Titre (ligne en couleur)</label>
            <input id="heroTitle" name="heroTitle" required maxLength={120} defaultValue={settings.heroTitle} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="heroTitleLine2">Titre (deuxième ligne, optionnelle)</label>
            <input id="heroTitleLine2" name="heroTitleLine2" maxLength={120} defaultValue={settings.heroTitleLine2} className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="heroDescription">Description de la page</label>
          <textarea id="heroDescription" name="heroDescription" rows={3} maxLength={400} defaultValue={settings.heroDescription} className="input" />
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">Référencement & pied de page</h2>
        </div>
        <div>
          <label className="label" htmlFor="metaDescription">Description pour Google et les partages sur les réseaux</label>
          <textarea id="metaDescription" name="metaDescription" rows={2} maxLength={300} defaultValue={settings.metaDescription} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="footerText">Texte du pied de page</label>
          <input id="footerText" name="footerText" maxLength={200} defaultValue={settings.footerText} className="input" />
        </div>
      </section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-ink/90 p-3 backdrop-blur">
        <SubmitButton pendingText="Enregistrement…">Enregistrer les paramètres</SubmitButton>
        <div className="min-w-0 flex-1">
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
