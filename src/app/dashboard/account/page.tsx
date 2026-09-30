import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { DeleteAccountForm, NotificationsForm } from "./account-forms";
import { PasswordForm } from "./password-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).account.title };
}

export default async function AccountPage() {
  const user = await requireUser();
  const t = (await getT()).account;
  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title={t.title} description={t.description} />
      <PasswordForm />
      <NotificationsForm notifyEmail={user.profile?.notifyEmail ?? true} />
      {user.role !== "SUPER_ADMIN" && <DeleteAccountForm />}
    </div>
  );
}
