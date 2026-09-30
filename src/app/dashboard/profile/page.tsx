import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { ProfileForm } from "./profile-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).profile.title };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const t = (await getT()).profile;
  return (
    <div className="max-w-4xl">
      <PageHeader title={t.title} description={t.description} />
      <ProfileForm profile={user.profile!} />
    </div>
  );
}
