import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n-server";
import { ProjectForm } from "../project-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).projects.new };
}

export default async function NewProjectPage() {
  const t = (await getT()).projects;
  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/projects" className="text-sm text-muted hover:text-white">{t.back}</Link>
      <PageHeader title={t.new} description={t.newDescription} />
      <ProjectForm />
    </div>
  );
}
