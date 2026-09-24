"use client";

import { useActionState } from "react";
import type { Project } from "@prisma/client";
import { ImageField } from "@/components/image-field";
import { MediaUploader } from "@/components/media-uploader";
import { FormMessage, SubmitButton } from "@/components/ui";
import { createProject, updateProject } from "../actions";

export function ProjectForm({ project }: { project?: Project }) {
  const [state, action] = useActionState(project ? updateProject : createProject, undefined);

  return (
    <form action={action} className="card space-y-5 p-6">
      {project && <input type="hidden" name="id" value={project.id} />}
      <div>
        <label className="label" htmlFor="title">Titre</label>
        <input id="title" name="title" required defaultValue={project?.title} className="input" placeholder="Refonte de l'application mobile X" />
      </div>
      <div>
        <label className="label" htmlFor="summary">Résumé court</label>
        <input id="summary" name="summary" defaultValue={project?.summary} maxLength={300} className="input" placeholder="Une phrase qui donne envie d'en savoir plus" />
      </div>
      <ImageField name="cover" label="Image de couverture" current={project?.coverUrl} />
      {!project && (
        <div>
          <span className="label">Galerie : images et vidéos du projet</span>
          <MediaUploader />
          <p className="mt-2 text-xs text-muted">Sans image de couverture, la première image de la galerie sera utilisée.</p>
        </div>
      )}
      <div>
        <label className="label" htmlFor="content">Description détaillée</label>
        <textarea id="content" name="content" rows={10} defaultValue={project?.content} className="input" placeholder="Contexte, rôle, outils, résultats…" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="tags">Tags (séparés par des virgules)</label>
          <input id="tags" name="tags" defaultValue={project?.tags} className="input" placeholder="Design, React, 2026" />
        </div>
        <div>
          <label className="label" htmlFor="link">Lien externe</label>
          <input id="link" name="link" defaultValue={project?.link} className="input" placeholder="https://…" />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" name="published" defaultChecked={project?.published ?? true} className="size-4 accent-[#7c5cff]" />
        Publier cette réalisation sur mon portfolio
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Enregistrement…">{project ? "Enregistrer" : "Créer la réalisation"}</SubmitButton>
    </form>
  );
}
