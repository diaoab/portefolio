import { PageHeader } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="max-w-4xl">
      <PageHeader title="Mon profil" description="Ces informations apparaissent sur votre portfolio public." />
      <ProfileForm profile={user.profile!} />
    </div>
  );
}
