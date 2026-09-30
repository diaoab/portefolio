"use client";

import { useActionState } from "react";
import type { Profile } from "@prisma/client";
import { useT } from "@/components/i18n-provider";
import { ImageField } from "@/components/image-field";
import { ThemePicker } from "@/components/theme-picker";
import { FormMessage, SubmitButton } from "@/components/ui";
import { updateProfile } from "../actions";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, undefined);
  const dict = useT();
  const t = dict.profile;

  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-5 p-6">
        <h2 className="font-semibold">{t.identity}</h2>
        <div className="grid gap-5 md:grid-cols-[auto_1fr]">
          <ImageField name="avatar" label={t.photo} current={profile.avatarUrl} shape="round" />
          <ImageField name="cover" label={t.cover} current={profile.coverUrl} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.fullName} name="fullName" defaultValue={profile.fullName} required />
          <Field label={t.headline} name="headline" defaultValue={profile.headline} placeholder={t.headlinePlaceholder} />
          <Field label={t.location} name="location" defaultValue={profile.location} placeholder={t.locationPlaceholder} />
          <div>
            <label className="label" htmlFor="slug">{t.slug}</label>
            <div className="flex items-center rounded-xl border border-line bg-white/[0.03] pl-3.5 text-sm text-zinc-500 focus-within:border-brand/70">
              /p/
              <input id="slug" name="slug" defaultValue={profile.slug} className="w-full bg-transparent py-2.5 pr-3.5 text-zinc-100 outline-none" />
            </div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="bio">{t.bio}</label>
          <textarea id="bio" name="bio" rows={6} defaultValue={profile.bio} className="input" placeholder={t.bioPlaceholder} />
          <p className="mt-1.5 text-xs text-muted">{dict.bilingual.richText}</p>
        </div>
        <Field label={t.skills} name="skills" defaultValue={profile.skills} placeholder={t.skillsPlaceholder} />
      </section>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><span className="badge">EN</span> {dict.bilingual.title}</h2>
          <p className="text-sm text-muted">{dict.bilingual.hint}</p>
        </div>
        <Field label={dict.bilingual.headline} name="headlineEn" defaultValue={profile.headlineEn} placeholder={profile.headline} lang="en" />
        <div>
          <label className="label" htmlFor="bioEn">{dict.bilingual.bio}</label>
          <textarea id="bioEn" name="bioEn" rows={5} defaultValue={profile.bioEn} className="input" lang="en" />
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="font-semibold">{t.contact}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.phone} name="phone" defaultValue={profile.phone} />
          <Field label={t.website} name="website" defaultValue={profile.website} placeholder="monsite.com" />
          <Field label="GitHub" name="github" defaultValue={profile.github} placeholder="github.com/pseudo" />
          <Field label="LinkedIn" name="linkedin" defaultValue={profile.linkedin} placeholder="linkedin.com/in/pseudo" />
        </div>
        <p className="text-xs text-muted">
          {t.emailNote}
        </p>
      </section>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-semibold">{t.appearance}</h2>
          <p className="text-sm text-muted">{t.appearanceText}</p>
        </div>
        <ThemePicker
          initialTheme={profile.theme}
          initial={{ accent: profile.accent, bgColor: profile.bgColor, surfaceColor: profile.surfaceColor, textColor: profile.textColor }}
        />
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-4">
          <input type="checkbox" name="published" defaultChecked={profile.published} className="mt-1 size-4 accent-[#7c5cff]" />
          <span>
            <span className="block text-sm font-medium">{t.publish}</span>
            <span className="block text-xs text-muted">{t.publishText}</span>
          </span>
        </label>
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

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" {...props} />
    </div>
  );
}
