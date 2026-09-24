import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { ProjectForm } from "../project-form";

export const metadata = { title: "Nouvelle réalisation" };

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/projects" className="text-sm text-muted hover:text-white">← Réalisations</Link>
      <PageHeader title="Nouvelle réalisation" description="Vous pourrez ajouter images et vidéos à l'étape suivante." />
      <ProjectForm />
    </div>
  );
}
