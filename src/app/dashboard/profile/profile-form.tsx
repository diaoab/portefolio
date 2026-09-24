"use client";

import { useActionState } from "react";
import type { Profile } from "@prisma/client";
import { ImageField } from "@/components/image-field";
import { ThemePicker } from "@/components/theme-picker";
import { FormMessage, SubmitButton } from "@/components/ui";
import { updateProfile } from "../actions";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-5 p-6">
        <h2 className="font-semibold">Identité</h2>
        <div className="grid gap-5 md:grid-cols-[auto_1fr]">
          <ImageField name="avatar" label="Photo" current={profile.avatarUrl} shape="round" />
          <ImageField name="cover" label="Image de couverture" current={profile.coverUrl} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet" name="fullName" defaultValue={profile.fullName} required />
          <Field label="Titre / métier" name="headline" defaultValue={profile.headline} placeholder="Développeuse Full-Stack · Designer UI" />
          <Field label="Localisation" name="location" defaultValue={profile.location} placeholder="Dakar, Sénégal" />
          <div>
            <label className="label" htmlFor="slug">Adresse du portfolio</label>
            <div className="flex items-center rounded-xl border border-line bg-white/[0.03] pl-3.5 text-sm text-zinc-500 focus-within:border-brand/70">
              /p/
              <input id="slug" name="slug" defaultValue={profile.slug} className="w-full bg-transparent py-2.5 pr-3.5 text-zinc-100 outline-none" />
            </div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="bio">Présentation</label>
          <textarea id="bio" name="bio" rows={6} defaultValue={profile.bio} className="input" placeholder="Parlez de votre parcours, de ce qui vous anime…" />
        </div>
        <Field label="Compétences (séparées par des virgules)" name="skills" defaultValue={profile.skills} placeholder="React, Figma, Montage vidéo" />
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="font-semibold">Coordonnées & liens</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Téléphone (optionnel, public)" name="phone" defaultValue={profile.phone} />
          <Field label="Site web" name="website" defaultValue={profile.website} placeholder="monsite.com" />
          <Field label="GitHub" name="github" defaultValue={profile.github} placeholder="github.com/pseudo" />
          <Field label="LinkedIn" name="linkedin" defaultValue={profile.linkedin} placeholder="linkedin.com/in/pseudo" />
        </div>
        <p className="text-xs text-muted">
          Votre email n&apos;est jamais affiché : les visiteurs vous écrivent via le formulaire de contact et les messages arrivent dans votre espace.
        </p>
      </section>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">Apparence & publication</h2>
          <p className="text-sm text-muted">Choisissez les couleurs de votre page publique.</p>
        </div>
        <ThemePicker
          initialTheme={profile.theme}
          initial={{ accent: profile.accent, bgColor: profile.bgColor, surfaceColor: profile.surfaceColor, textColor: profile.textColor }}
        />
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-4">
          <input type="checkbox" name="published" defaultChecked={profile.published} className="mt-1 size-4 accent-[#7c5cff]" />
          <span>
            <span className="block text-sm font-medium">Publier mon portfolio</span>
            <span className="block text-xs text-muted">Il apparaîtra sur la page publique et sera accessible par son lien. Seules les réalisations publiées sont visibles.</span>
          </span>
        </label>
      </section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-ink/90 p-3 backdrop-blur">
        <SubmitButton pendingText="Enregistrement…">Enregistrer le profil</SubmitButton>
        <div className="min-w-0 flex-1">
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" {...props} />
    </div>
  );
}
