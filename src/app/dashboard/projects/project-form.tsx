"use client";

import { useActionState } from "react";
import type { Project } from "@prisma/client";
import { useT } from "@/components/i18n-provider";
import { ImageField } from "@/components/image-field";
import { MediaUploader } from "@/components/media-uploader";
import { FormMessage, SubmitButton } from "@/components/ui";
import { createProject, updateProject } from "../actions";

export function ProjectForm({ project }: { project?: Project }) {
  const [state, action] = useActionState(project ? updateProject : createProject, undefined);
  const dict = useT();
  const t = dict.projects;

  return (
    <form action={action} className="card space-y-5 p-6">
      {project && <input type="hidden" name="id" value={project.id} />}
      <div>
        <label className="label" htmlFor="title">{t.formTitle}</label>
        <input id="title" name="title" required defaultValue={project?.title} className="input" placeholder={t.titlePlaceholder} />
      </div>
      <div>
        <label className="label" htmlFor="summary">{t.summary}</label>
        <input id="summary" name="summary" defaultValue={project?.summary} maxLength={300} className="input" placeholder={t.summaryPlaceholder} />
      </div>
      <ImageField name="cover" label={t.cover} current={project?.coverUrl} />
      {!project && (
        <div>
          <span className="label">{t.galleryLabel}</span>
          <MediaUploader />
          <p className="mt-2 text-xs text-muted">{t.coverHint}</p>
        </div>
      )}
      <div>
        <label className="label" htmlFor="content">{t.content}</label>
        <textarea id="content" name="content" rows={10} defaultValue={project?.content} className="input" placeholder={t.contentPlaceholder} />
        <p className="mt-1.5 text-xs text-muted">{dict.bilingual.richText}</p>
      </div>
      <details className="rounded-xl border border-line p-4" open={!!(project?.titleEn || project?.summaryEn || project?.contentEn)}>
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <span className="badge">EN</span> {dict.bilingual.title}
        </summary>
        <p className="mt-2 text-xs text-muted">{dict.bilingual.hint}</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="titleEn">{dict.bilingual.projectTitle}</label>
            <input id="titleEn" name="titleEn" defaultValue={project?.titleEn} className="input" lang="en" />
          </div>
          <div>
            <label className="label" htmlFor="summaryEn">{dict.bilingual.projectSummary}</label>
            <input id="summaryEn" name="summaryEn" defaultValue={project?.summaryEn} maxLength={300} className="input" lang="en" />
          </div>
          <div>
            <label className="label" htmlFor="contentEn">{dict.bilingual.projectContent}</label>
            <textarea id="contentEn" name="contentEn" rows={6} defaultValue={project?.contentEn} className="input" lang="en" />
          </div>
        </div>
      </details>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="tags">{t.tags}</label>
          <input id="tags" name="tags" defaultValue={project?.tags} className="input" placeholder={t.tagsPlaceholder} />
        </div>
        <div>
          <label className="label" htmlFor="link">{t.link}</label>
          <input id="link" name="link" defaultValue={project?.link} className="input" placeholder="https://…" />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" name="published" defaultChecked={project?.published ?? true} className="size-4 accent-[#7c5cff]" />
        {t.publish}
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText={dict.common.saving}>{project ? dict.common.save : t.create}</SubmitButton>
    </form>
  );
}
